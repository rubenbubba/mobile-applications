import { Badge, Divider, Expandable, Stack, Text } from '@/components/primitives';
import { CheckRow } from '@/components/shared/InfoRow';
import { SectionCard } from '@/components/shared/SectionCard';
import { pluralize } from '@/logic/format';
import { pageHasGoodHeadings, pageProblems } from '@/logic/seoChecklist';
import type { SeoPage } from '@/types/Monitoring';

function headingDetail(page: SeoPage): string {
  if (page.h1Count === 0) return 'No main heading found.';
  if (page.h1Count > 1) return `${page.h1Count} main headings found. One is best.`;
  return page.headingsInOrder ? 'One main heading, in a clear order.' : 'Headings are out of order.';
}

function PageRow({ page }: { page: SeoPage }) {
  const problems = pageProblems(page);

  return (
    <Expandable
      title={page.name}
      subtitle={page.path}
      trailing={
        problems.length === 0 ? (
          <Badge label="Looks good" variant="success" icon="checkmark-circle" />
        ) : (
          <Badge label={pluralize(problems.length, 'problem')} variant="warning" icon="alert-circle" />
        )
      }
      testID={`seo-page-${page.path}`}
    >
      <Stack gap="md">
        <CheckRow label="Title" detail={page.title ?? 'Missing. Google will guess a title.'} passed={page.title !== undefined} />
        <CheckRow
          label="Description"
          detail={page.metaDescription ?? 'Missing. Google will pick some text from the page.'}
          passed={page.metaDescription !== undefined}
        />
        <CheckRow label="Headings" detail={headingDetail(page)} passed={pageHasGoodHeadings(page)} />
        <CheckRow
          label="Visible in Google"
          detail={page.indexable ? 'Google can show this page.' : 'This page is set to stay out of Google.'}
          passed={page.indexable}
        />
      </Stack>
    </Expandable>
  );
}

export function SeoPagesCard({ pages }: { pages: SeoPage[] }) {
  return (
    <SectionCard
      title="Your pages"
      description="What Google can read on each page. Open a page to see the details."
      testID="seo-pages"
    >
      {pages.length === 0 ? (
        <Text tone="secondary">We did not find any pages yet.</Text>
      ) : (
        <Stack>
          {pages.map((page, index) => (
            <Stack key={page.path}>
              {index > 0 && <Divider />}
              <PageRow page={page} />
            </Stack>
          ))}
        </Stack>
      )}
    </SectionCard>
  );
}
