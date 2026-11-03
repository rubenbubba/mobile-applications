import { Text as RNText, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import type { ThemeColors } from '../../theme/tokens';

export type TextTone =
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'accent'
  | 'onAccent'
  | 'healthy'
  | 'warning'
  | 'serious'
  | 'critical';

interface TextProps {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'display';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  tone?: TextTone;
  color?: string;
  align?: 'left' | 'center' | 'right';
  numberOfLines?: number;
  heading?: 1 | 2 | 3;
  selectable?: boolean;
  tabular?: boolean;
  testID?: string;
}

function toneColor(colors: ThemeColors, tone: TextTone): string {
  switch (tone) {
    case 'primary':
      return colors.text;
    case 'secondary':
      return colors.textSecondary;
    case 'muted':
      return colors.textMuted;
    case 'accent':
      return colors.accentText;
    case 'onAccent':
      return colors.onAccent;
    default:
      return colors.tones[tone].text;
  }
}

export function Text({
  children,
  size = 'md',
  weight = 'normal',
  tone = 'primary',
  color,
  align = 'left',
  numberOfLines,
  heading,
  selectable,
  tabular = false,
  testID,
}: TextProps) {
  const { colors } = useTheme();

  return (
    <RNText
      style={[
        styles.base,
        styles[size],
        styles[weight],
        { textAlign: align, color: color ?? toneColor(colors, tone) },
        tabular && styles.tabular,
      ]}
      numberOfLines={numberOfLines}
      role={heading !== undefined ? 'heading' : undefined}
      aria-level={heading}
      selectable={selectable}
      testID={testID}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  base: { flexShrink: 1 },
  xs: { fontSize: 12, lineHeight: 16 },
  sm: { fontSize: 13, lineHeight: 18 },
  md: { fontSize: 15, lineHeight: 22 },
  lg: { fontSize: 17, lineHeight: 24 },
  xl: { fontSize: 20, lineHeight: 26 },
  xxl: { fontSize: 28, lineHeight: 34 },
  display: { fontSize: 60, lineHeight: 64, letterSpacing: -1.5 },
  normal: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  semibold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
  tabular: { fontVariant: ['tabular-nums'] },
});
