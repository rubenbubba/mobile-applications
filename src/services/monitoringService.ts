import { buildDemoSnapshot, type DemoInput } from '../data/demo/buildSnapshot';
import { DEMO_DEFINITIONS, DEFAULT_BUSINESS_ID, type DemoDefinition } from '../data/demo/businesses';
import type { Business } from '../types/Business';
import type { MonitoringSnapshot } from '../types/Monitoring';
import { isOnline } from './connectivityService';
import { getDataMode } from './dataMode';
import {
  createLiveBusiness,
  deleteLiveBusiness,
  fetchLiveBusinesses,
  fetchLiveSnapshot,
  runLiveCheck,
  type NewBusiness,
} from './liveMonitoringService';

// Demo sessions use the sample businesses in src/data/demo/. Real accounts use Supabase (liveMonitoringService.ts).
// The stores call these functions and never need to know which one is behind them.

const LOAD_DELAY_MS = 450;
const CHECK_DELAY_MS = 1400;

export const defaultBusinessId = DEFAULT_BUSINESS_ID;
export type { NewBusiness };

export class OfflineError extends Error {
  constructor() {
    super('You are offline and this business has not been loaded on this device yet.');
    this.name = 'OfflineError';
  }
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function findDefinition(businessId: string): DemoDefinition {
  const definition = DEMO_DEFINITIONS.find((item) => item.business.id === businessId);
  if (definition === undefined) throw new Error(`Unknown business: ${businessId}`);
  return definition;
}

// The sample businesses. Real accounts load theirs with loadBusinesses().
export function listBusinesses(): Business[] {
  return DEMO_DEFINITIONS.map((definition) => definition.business);
}

export function getBusiness(businessId: string): Business {
  return findDefinition(businessId).business;
}

export async function loadBusinesses(): Promise<Business[]> {
  if (getDataMode() !== 'live') return listBusinesses();
  if (!isOnline()) throw new OfflineError();
  return fetchLiveBusinesses();
}

export async function addBusiness(input: NewBusiness): Promise<Business> {
  if (getDataMode() !== 'live') throw new Error('Create an account to add your own business.');
  if (!isOnline()) throw new Error('You are offline. Add your business when you are back online.');
  return createLiveBusiness(input);
}

export async function removeBusiness(businessId: string): Promise<void> {
  if (getDataMode() !== 'live') throw new Error('Sample businesses cannot be removed.');
  if (!isOnline()) throw new Error('You are offline. Remove the business when you are back online.');
  await deleteLiveBusiness(businessId);
}

async function fetchDemoSnapshot(businessId: string, input: DemoInput, delay: number): Promise<MonitoringSnapshot> {
  if (!isOnline()) throw new OfflineError();
  await wait(delay);
  return buildDemoSnapshot(findDefinition(businessId), input, new Date());
}

export async function fetchSnapshot(businessId: string, input: DemoInput): Promise<MonitoringSnapshot> {
  if (getDataMode() !== 'live') return fetchDemoSnapshot(businessId, input, LOAD_DELAY_MS);
  if (!isOnline()) throw new OfflineError();
  return fetchLiveSnapshot(businessId);
}

// Demo: simulates a check where every fix the owner made is found. Live: the server really checks the site.
export async function runCheck(businessId: string, input: DemoInput): Promise<MonitoringSnapshot> {
  if (getDataMode() !== 'live') return fetchDemoSnapshot(businessId, input, CHECK_DELAY_MS);
  if (!isOnline()) throw new OfflineError();
  await runLiveCheck(businessId);
  return fetchLiveSnapshot(businessId);
}
