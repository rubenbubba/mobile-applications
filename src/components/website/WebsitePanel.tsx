import { Banner, Stack } from '@/components/primitives';
import { AreaHeaderCard } from '@/components/shared/AreaHeaderCard';
import { AreaIssues } from '@/components/shared/AreaIssues';
import { CheckRow, InfoRow } from '@/components/shared/InfoRow';
import { SectionCard } from '@/components/shared/SectionCard';
import { UnavailableCard } from '@/components/shared/UnavailableCard';
import { formatDateTime, formatDuration, formatRelativeTime, pluralize } from '@/logic/format';
import type { Overview } from '@/logic/overview';
import { sectionValue } from '@/logic/scoring';
import { LiveCheckCard } from './LiveCheckCard';
import { UptimeCard } from './UptimeCard';

export function WebsitePanel({ overview }: { overview: Overview }) {
  const { areas, now, snapshot } = overview;
  const data = sectionValue(snapshot.website);

  if (data === undefined) {
    return (
      <Stack gap="lg">
        <UnavailableCard title="We have no website results" reason={areas.website.unavailableReason} />
        <LiveCheckCard />
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      {!data.isUp && data.downSince !== undefined && (
        <Banner
          tone="critical"
          icon="close-circle"
          message={`Your website has been down since ${formatDateTime(data.downSince)}.`}
          testID="site-down-banner"
        />
      )}

      <AreaHeaderCard
        summary={areas.website}
        now={now}
        headline={data.isUp ? 'Your website is online' : 'Your website is not responding'}
        testID="website-status"
      >
        <Stack gap="sm">
          <InfoRow label="Address" value={data.url.replace('https://', '')} />
          <InfoRow label="Last successful check" value={formatRelativeTime(data.lastSuccessfulCheck, now)} testID="last-successful" />
          <InfoRow
            label={data.isUp ? 'Response time' : 'Error code'}
            value={data.isUp ? formatDuration(data.responseTimeMs) : String(data.statusCode)}
            testID="response-time"
          />
        </Stack>
      </AreaHeaderCard>

      <UptimeCard data={data} />

      {data.isUp && (
        <SectionCard title="Basic health" testID="website-health">
          <Stack gap="md">
            <CheckRow label="Secure connection" detail={data.httpsEnabled ? 'Your site uses https.' : 'Your site does not use https.'} passed={data.httpsEnabled} />
            <CheckRow
              label="Security certificate"
              detail={
                data.certificateExpiresInDays !== undefined
                  ? `Expires in ${pluralize(data.certificateExpiresInDays, 'day')}.`
                  : 'Valid. The expiry date is not checked yet.'
              }
              passed={data.certificateExpiresInDays === undefined || data.certificateExpiresInDays >= 30}
            />
            <CheckRow
              label="Sends visitors to the secure version"
              detail={data.redirectsToHttps ? 'Old http:// links are redirected.' : 'Old http:// links stay insecure.'}
              passed={data.redirectsToHttps}
            />
            <CheckRow
              label="Easy to use on a phone"
              detail={data.mobileFriendly ? 'Text and buttons fit phone screens.' : 'Text and buttons are too small.'}
              passed={data.mobileFriendly}
            />
          </Stack>
        </SectionCard>
      )}

      <AreaIssues overview={overview} area="website" title="Problems we found" emptyTitle="No technical problems found" />
      <LiveCheckCard />
    </Stack>
  );
}
