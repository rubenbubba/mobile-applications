import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { radii, spacing, type SpaceKey, type ToneName } from '../../theme/tokens';
import { Touchable } from './Touchable';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  padding?: SpaceKey;
  tone?: ToneName;
  flex?: number;
  label?: string;
  testID?: string;
}

export function Card({ children, onPress, padding = 'lg', tone, flex, label, testID }: CardProps) {
  const { colors } = useTheme();
  const toneColors = tone !== undefined ? colors.tones[tone] : undefined;

  const surfaceStyle = [
    styles.base,
    {
      backgroundColor: toneColors?.background ?? colors.surface,
      borderColor: toneColors?.background ?? colors.border,
      padding: spacing[padding],
    },
    flex !== undefined && { flex },
  ];

  if (onPress !== undefined) {
    return (
      <Touchable onPress={onPress} label={label} style={surfaceStyle} testID={testID}>
        {children}
      </Touchable>
    );
  }

  return (
    <View style={surfaceStyle} testID={testID}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radii.lg, borderWidth: 1, minWidth: 0 },
});
