import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { radii, spacing } from '../../theme/tokens';
import { Icon, type IoniconsName } from './Icon';
import { Text } from './Text';
import { Touchable } from './Touchable';

interface NavItemProps {
  label: string;
  onPress: () => void;
  active?: boolean;
  icon?: IoniconsName;
  count?: number;
  orientation?: 'bar' | 'side';
  testID?: string;
}

export function NavItem({
  label,
  onPress,
  active = false,
  icon,
  count = 0,
  orientation = 'bar',
  testID,
}: NavItemProps) {
  const { colors } = useTheme();
  const isBar = orientation === 'bar';
  const iconColor = active ? colors.accentText : colors.textSecondary;
  const countLabel = count > 0 ? `, ${count} open` : '';

  const countBadge = count > 0 && (
    <View style={[styles.count, { backgroundColor: colors.tones.critical.mark }]}>
      <Text size="xs" weight="bold" color={colors.onCriticalMark}>{count}</Text>
    </View>
  );

  if (isBar) {
    return (
      <Touchable
        onPress={onPress}
        role="link"
        label={`${label}${countLabel}`}
        hoverColor="transparent"
        style={styles.bar}
        testID={testID}
      >
        <View style={[styles.barIcon, active && { backgroundColor: colors.accentSoft }]}>
          {icon !== undefined && <Icon name={icon} size={22} color={iconColor} />}
          {count > 0 && <View style={styles.barCount}>{countBadge}</View>}
        </View>
        <Text size="xs" weight={active ? 'bold' : 'medium'} tone={active ? 'accent' : 'secondary'}>{label}</Text>
      </Touchable>
    );
  }

  return (
    <Touchable
      onPress={onPress}
      role="link"
      label={`${label}${countLabel}`}
      hoverColor={active ? colors.accentSoft : colors.surfaceMuted}
      style={[styles.side, active && { backgroundColor: colors.accentSoft }]}
      testID={testID}
    >
      {icon !== undefined && <Icon name={icon} size={20} color={iconColor} />}
      <View style={styles.sideLabel}>
        <Text size="md" weight={active ? 'semibold' : 'medium'} tone={active ? 'accent' : 'secondary'}>{label}</Text>
      </View>
      {countBadge}
    </Touchable>
  );
}

const styles = StyleSheet.create({
  bar: { flex: 1, minHeight: 60, alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: spacing.xs },
  barIcon: {
    width: 56,
    height: 30,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barCount: { position: 'absolute', top: -2, right: 6 },
  side: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  sideLabel: { flex: 1 },
  count: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
