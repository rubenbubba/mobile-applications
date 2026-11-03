import { router, type Href } from 'expo-router';
import { SegmentedControl } from '@/components/primitives';
import { useBreakpoint } from '@/hooks/useBreakpoint';

type Section = 'website' | 'seo' | 'performance';

const HREFS: Record<Section, Href> = { website: '/website', seo: '/seo', performance: '/performance' };

// The sidebar already lists these on wide screens. The phone bar only has room for one Website tab.
export function WebsiteSubNav({ current }: { current: Section }) {
  const { isWide } = useBreakpoint();

  if (isWide) return null;

  return (
    <SegmentedControl<Section>
      label="Website sections"
      value={current}
      onChange={(section) => router.navigate(HREFS[section])}
      options={[
        { value: 'website', label: 'Status', testID: 'subnav-website' },
        { value: 'seo', label: 'Google', testID: 'subnav-seo' },
        { value: 'performance', label: 'Speed', testID: 'subnav-performance' },
      ]}
    />
  );
}
