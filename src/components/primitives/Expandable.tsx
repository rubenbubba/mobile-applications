import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { spacing } from '../../theme/tokens';
import { Icon } from './Icon';
import { Text } from './Text';
import { Touchable } from './Touchable';

interface ExpandableProps {
  title: string;
  children: React.ReactNode;
  subtitle?: string;
  trailing?: React.ReactNode;
  defaultOpen?: boolean;
  testID?: string;
}

export function Expandable({ title, children, subtitle, trailing, defaultOpen = false, testID }: ExpandableProps) {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <View>
      <Touchable
        onPress={() => setIsOpen(!isOpen)}
        expanded={isOpen}
        hoverColor="transparent"
        style={styles.header}
        testID={testID}
      >
        <View style={styles.title}>
          <Text weight="medium">{title}</Text>
          {subtitle !== undefined && <Text size="sm" tone="secondary">{subtitle}</Text>}
        </View>
        {trailing}
        <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
      </Touchable>
      {isOpen && <View style={styles.body}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48, paddingVertical: spacing.xs },
  title: { flex: 1 },
  body: { paddingTop: spacing.xs, paddingBottom: spacing.md, gap: spacing.sm },
});
