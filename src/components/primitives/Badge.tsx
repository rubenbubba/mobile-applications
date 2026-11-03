import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { radii, spacing, type ToneName } from '../../theme/tokens';
import { Icon, type IoniconsName } from './Icon';
import { Text } from './Text';

type BadgeVariant = 'default' | 'success' | 'warning' | 'serious' | 'error';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: IoniconsName;
  testID?: string;
}

const variantTones: Record<BadgeVariant, ToneName> = {
  default: 'neutral',
  success: 'healthy',
  warning: 'warning',
  serious: 'serious',
  error: 'critical',
};

export function Badge({ label, variant = 'default', icon, testID }: BadgeProps) {
  const { colors } = useTheme();
  const tone = colors.tones[variantTones[variant]];

  return (
    <View style={[styles.base, { backgroundColor: tone.background }]} testID={testID}>
      {icon !== undefined && <Icon name={icon} size={14} color={tone.text} />}
      <Text size="xs" weight="semibold" color={tone.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: 10,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
});
