import { router, usePathname, type Href } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Nav, NavItem, Row, Text, type IoniconsName } from '@/components/primitives';
import { useOverview } from '@/hooks/useOverview';
import { spacing } from '@/theme/tokens';
import { APP_NAME, BrandMark } from './BrandMark';

interface NavEntry {
  label: string;
  icon: IoniconsName;
  href: Href;
  activePaths: string[];
  showsCount?: boolean;
}

const HOME: NavEntry = { label: 'Home', icon: 'home-outline', href: '/', activePaths: ['/'] };
const ISSUES: NavEntry = {
  label: 'Issues',
  icon: 'list-outline',
  href: '/issues',
  activePaths: ['/issues', '/details'],
  showsCount: true,
};
const REVIEWS: NavEntry = { label: 'Reviews', icon: 'star-outline', href: '/reviews', activePaths: ['/reviews'] };
const SETTINGS: NavEntry = { label: 'Settings', icon: 'settings-outline', href: '/settings', activePaths: ['/settings'] };

const BAR_ENTRIES: NavEntry[] = [
  HOME,
  ISSUES,
  { label: 'Website', icon: 'globe-outline', href: '/website', activePaths: ['/website', '/seo', '/performance'] },
  REVIEWS,
  SETTINGS,
];

const SIDE_ENTRIES: NavEntry[] = [
  HOME,
  ISSUES,
  { label: 'Website', icon: 'globe-outline', href: '/website', activePaths: ['/website'] },
  { label: 'Found on Google', icon: 'search-outline', href: '/seo', activePaths: ['/seo'] },
  { label: 'Speed', icon: 'speedometer-outline', href: '/performance', activePaths: ['/performance'] },
  REVIEWS,
];

function isActive(entry: NavEntry, pathname: string): boolean {
  return entry.activePaths.some((path) => (path === '/' ? pathname === '/' : pathname.startsWith(path)));
}

export function AppNav({ isWide }: { isWide: boolean }) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const state = useOverview();
  const count = state.kind === 'ready' ? state.overview.urgentCount : 0;

  const renderEntry = (entry: NavEntry, orientation: 'bar' | 'side') => (
    <NavItem
      key={entry.label}
      label={entry.label}
      icon={entry.icon}
      orientation={orientation}
      active={isActive(entry, pathname)}
      count={entry.showsCount === true ? count : 0}
      onPress={() => router.navigate(entry.href)}
      testID={`nav-${entry.label.toLowerCase().replace(/\s+/g, '-')}`}
    />
  );

  if (!isWide) {
    return <Nav bottomInset={insets.bottom}>{BAR_ENTRIES.map((entry) => renderEntry(entry, 'bar'))}</Nav>;
  }

  return (
    <Nav orientation="side" topInset={insets.top}>
      <View style={styles.brand}>
        <Row gap="sm">
          <BrandMark size={32} />
          <Text size="lg" weight="bold">{APP_NAME}</Text>
        </Row>
      </View>
      {SIDE_ENTRIES.map((entry) => renderEntry(entry, 'side'))}
      <View style={styles.spacer} />
      {renderEntry(SETTINGS, 'side')}
    </Nav>
  );
}

const styles = StyleSheet.create({
  brand: { paddingHorizontal: spacing.sm, paddingBottom: spacing.lg },
  spacer: { flex: 1 },
});
