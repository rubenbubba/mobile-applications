import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { spacing } from '../../theme/tokens';
import { Icon, type IoniconsName } from './Icon';
import { Text } from './Text';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: IoniconsName;
  testID?: string;
}

export function EmptyState({ title, description, action, icon, testID }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.base} testID={testID}>
      {icon !== undefined && <Icon name={icon} size={32} color={colors.textMuted} />}
      <Text size="lg" weight="semibold" align="center">{title}</Text>
      {description !== undefined && <Text tone="secondary" align="center">{description}</Text>}
      {action !== undefined && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  action: { marginTop: spacing.sm },
});
