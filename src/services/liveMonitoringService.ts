import { getSupabase } from '../lib/supabase';
import { ISSUE_IDS } from '../logic/issueRules';
import { computeAreaScores, computeOverallScore } from '../logic/scoring';
import { toSections, type RawResults } from '../logic/sections';
import type { Business } from '../types/Business';
import type { IssueId } from '../types/Issue';
import type {
  MonitoringSnapshot,
  PerformanceData,
  ReachabilityResult,
  ScorePoint,
  SeoData,
  UptimeDay,
  WebsiteData,
} from '../types/Monitoring';

// Real data for signed-in accounts, from the Supabase tables in supabase/migrations/.
// The checks themselves run on the server (supabase/functions/), so no API key is ever in the app.

const DAY_MS = 24 * 60 * 60 * 1000;
const HISTORY_WEEKS = 11;
const SNAPSHOTS_TO_READ = 80;

interface BusinessRow {
  id: string;
  name: string;
  category: string;
  city: string;
  website_url: string;
}

// The database returns null for a part of the check that could not run. toRaw() turns that into undefined,
// so null never travels past this file.
interface SnapshotRow {
  checked_at: string;
  website: WebsiteData;
  seo: SeoData | null;
  performance: PerformanceData | null;
}

interface UptimeRow {
  checked_at: string;
  is_up: boolean;
  status_code: number;
  response_time_ms: number;
}

export interface NewBusiness {
  name: string;
  category: string;
  city: string;
  websiteUrl: string;
}

export interface ServerProgress {
  markedFixed: IssueId[];
  verifiedFixes: IssueId[];
  repliedReviewIds: string[];
}

function toBusiness(row: BusinessRow): Business {
  return { id: row.id, name: row.name, category: row.category, city: row.city, websiteUrl: row.website_url };
}

function isIssueId(value: string): value is IssueId {
  return ISSUE_IDS.some((id) => id === value);
}

export async function fetchLiveBusinesses(): Promise<Business[]> {
  const { data, error } = await getSupabase()
    .from('businesses')
    .select('id, name, category, city, website_url')
    .order('created_at', { ascending: true })
    .returns<BusinessRow[]>();
  if (error) throw new Error('Your businesses could not be loaded. Check your connection and try again.');
  return (data ?? []).map(toBusiness);
}

export async function createLiveBusiness(input: NewBusiness): Promise<Business> {
  const { data, error } = await getSupabase()
    .from('businesses')
    .insert({ name: input.name, category: input.category, city: input.city, website_url: input.websiteUrl })
    .select('id, name, category, city, website_url')
    .single<BusinessRow>();
  if (error) throw new Error(error.message.includes('up to 5') ? 'You can add up to 5 businesses.' : 'The business could not be saved. Try again.');
  return toBusiness(data);
}

// Removes the business and, through the database's cascade rules, all of its check results.
export async function deleteLiveBusiness(businessId: string): Promise<void> {
  const { error } = await getSupabase().from('businesses').delete().eq('id', businessId);
  if (error) throw new Error('The business could not be removed. Try again.');
}

// The latest monitor result is often newer than the last full check, so it decides whether the site is up now.
function withLatestUptime(website: WebsiteData, checkedAt: string, latest: UptimeRow | undefined, days: UptimeDay[]): WebsiteData {
  const uptimeDays = days.length > 0 ? days : [{ date: checkedAt, uptimePercent: website.isUp ? 100 : 0 }];
  if (latest === undefined || new Date(latest.checked_at) <= new Date(checkedAt)) return { ...website, uptimeDays };

  return {
    ...website,
    uptimeDays,
    isUp: latest.is_up,
    statusCode: latest.status_code,
    responseTimeMs: latest.response_time_ms > 0 ? latest.response_time_ms : website.responseTimeMs,
    lastSuccessfulCheck: latest.is_up ? latest.checked_at : website.lastSuccessfulCheck,
    downSince: latest.is_up ? undefined : website.downSince ?? latest.checked_at,
  };
}

function toRaw(row: SnapshotRow, website: WebsiteData): RawResults {
  return { website, seo: row.seo ?? undefined, performance: row.performance ?? undefined };
}

// One point per past week (the latest check in that week), scored exactly like today.
function weeklyHistory(rows: SnapshotRow[], now: Date): ScorePoint[] {
  const points: ScorePoint[] = [];

  for (let weeksAgo = HISTORY_WEEKS; weeksAgo >= 1; weeksAgo -= 1) {
    const weekEnd = new Date(now.getTime() - weeksAgo * 7 * DAY_MS);
    const weekStart = new Date(weekEnd.getTime() - 7 * DAY_MS);
    const row = rows.find((item) => {
      const at = new Date(item.checked_at);
      return at > weekStart && at <= weekEnd;
    });
    if (row === undefined) continue;

    const sections = toSections(toRaw(row, row.website), 'live', row.checked_at);
    const overall = computeOverallScore(computeAreaScores(sections, weekEnd), !row.website.isUp);
    if (overall !== undefined) points.push({ weekOf: weekEnd.toISOString(), overall });
  }

  return points;
}

function noCheckYet(businessId: string, now: Date): MonitoringSnapshot {
  const reason = 'No check has run yet. Tap "Run new check" to start.';
  return {
    businessId,
    fetchedAt: now.toISOString(),
    website: { source: 'unavailable', reasonCode: 'not-enough-data', reason },
    reviews: { source: 'unavailable', reasonCode: 'not-connected', reason: 'Your Google Business Profile is not connected yet.' },
    seo: { source: 'unavailable', reasonCode: 'not-enough-data', reason },
    performance: { source: 'unavailable', reasonCode: 'not-enough-data', reason },
    scoreHistory: [],
    changes: [],
  };
}

export async function fetchLiveSnapshot(businessId: string): Promise<MonitoringSnapshot> {
  const supabase = getSupabase();
  const now = new Date();

  const [snapshots, uptimeDays, latestUptime] = await Promise.all([
    supabase
      .from('check_snapshots')
      .select('checked_at, website, seo, performance')
      .eq('business_id', businessId)
      .order('checked_at', { ascending: false })
      .limit(SNAPSHOTS_TO_READ)
      .returns<SnapshotRow[]>(),
    supabase
      .from('uptime_days')
      .select('day, uptime_percent')
      .eq('business_id', businessId)
      .order('day', { ascending: true })
      .returns<{ day: string; uptime_percent: number }[]>(),
    supabase
      .from('uptime_checks')
      .select('checked_at, is_up, status_code, response_time_ms')
      .eq('business_id', businessId)
      .order('checked_at', { ascending: false })
      .limit(1)
      .returns<UptimeRow[]>(),
  ]);
  if (snapshots.error || uptimeDays.error || latestUptime.error) {
    throw new Error('Your results could not be loaded. Check your connection and try again.');
  }

  const rows = snapshots.data ?? [];
  const latest = rows[0];
  if (latest === undefined) return noCheckYet(businessId, now);

  const days: UptimeDay[] = (uptimeDays.data ?? []).map((row) => ({
    date: new Date(row.day).toISOString(),
    uptimePercent: Number(row.uptime_percent),
  }));
  const website = withLatestUptime(latest.website, latest.checked_at, latestUptime.data?.[0], days);

  return {
    businessId,
    // "Last checked" shows when the check ran, not when the app downloaded it.
    fetchedAt: latest.checked_at,
    ...toSections(toRaw(latest, website), 'live', latest.checked_at),
    scoreHistory: weeklyHistory(rows, now),
    changes: [],
  };
}

export async function runLiveCheck(businessId: string): Promise<void> {
  const { error } = await getSupabase().functions.invoke('run-check', { body: { businessId } });
  if (error) throw new Error('The check could not run. Try again in a few minutes.');
}

export async function fetchServerProgress(businessId: string): Promise<ServerProgress> {
  const supabase = getSupabase();
  const [progress, replies] = await Promise.all([
    supabase.from('issue_progress').select('issue_id, status').eq('business_id', businessId).returns<{ issue_id: string; status: string }[]>(),
    supabase.from('review_replies').select('review_id').eq('business_id', businessId).returns<{ review_id: string }[]>(),
  ]);
  if (progress.error || replies.error) throw new Error('Your progress could not be loaded.');

  const withStatus = (status: string) =>
    (progress.data ?? []).filter((row) => row.status === status).map((row) => row.issue_id).filter(isIssueId);

  return {
    markedFixed: withStatus('marked'),
    verifiedFixes: withStatus('verified'),
    repliedReviewIds: (replies.data ?? []).map((row) => row.review_id),
  };
}

// A real request from the server, which can read the status code (the browser test cannot).
export async function checkUrlOnServer(url: string): Promise<ReachabilityResult> {
  const { data, error } = await getSupabase().functions.invoke<ReachabilityResult>('check-url', { body: { url } });
  if (error || data === null) throw new Error('The test could not run. Check your connection and try again.');
  return data;
}

// Everything stored for this account, for "Download my data".
export async function exportLiveData(): Promise<Record<string, unknown>> {
  const supabase = getSupabase();
  const [user, businesses, snapshots, uptime, progress, replies] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('businesses').select('*'),
    supabase.from('check_snapshots').select('*'),
    supabase.from('uptime_checks').select('*'),
    supabase.from('issue_progress').select('*'),
    supabase.from('review_replies').select('*'),
  ]);
  const account = user.data.user;

  return {
    account: account === null ? undefined : { id: account.id, email: account.email, createdAt: account.created_at },
    businesses: businesses.data ?? [],
    checkResults: snapshots.data ?? [],
    uptimeChecks: uptime.data ?? [],
    issueProgress: progress.data ?? [],
    reviewReplies: replies.data ?? [],
  };
}
