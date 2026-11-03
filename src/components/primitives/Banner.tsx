import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { radii, spacing, type ToneName } from '../../theme/tokens';
import { Icon, type IoniconsName } from './Icon';
import { Text } from './Text';

interface BannerProps {
  message: string;
  tone?: ToneName;
  icon?: IoniconsName;
  action?: React.ReactNode;
  testID?: string;
}

export function Banner({ message, tone = 'neutral', icon = 'information-circle', action, testID }: BannerProps) {
  const { colors } = useTheme();
  const toneColors = colors.tones[tone];

  return (
    <View role="status" style={[styles.base, { backgroundColor: toneColors.background }]} testID={testID}>
      <Icon name={icon} size={18} color={toneColors.text} />
      <View style={styles.message}>
        <Text size="sm" weight="medium" color={toneColors.text}>{message}</Text>
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  message: { flex: 1 },
});
