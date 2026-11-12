import { useState } from 'react';
import { TextInput, View, StyleSheet, type KeyboardTypeOptions } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { MIN_TOUCH_TARGET, radii, spacing } from '../../theme/tokens';
import { Icon } from './Icon';
import { Text } from './Text';

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  hint?: string;
  keyboardType?: KeyboardTypeOptions;
  autoComplete?: 'email' | 'current-password' | 'new-password' | 'url' | 'off';
  onSubmitEditing?: () => void;
  testID?: string;
}

export function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  hint,
  keyboardType,
  autoComplete,
  onSubmitEditing,
  testID,
}: InputFieldProps) {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const hasError = error !== undefined;

  const borderColor = hasError
    ? colors.tones.critical.mark
    : isFocused
      ? colors.accent
      : colors.borderStrong;

  return (
    <View style={styles.container}>
      <Text size="sm" weight="semibold">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoComplete={autoComplete}
        onSubmitEditing={onSubmitEditing}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        aria-label={label}
        aria-invalid={hasError}
        style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor }]}
        testID={testID}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {hint !== undefined && !hasError && <Text size="sm" tone="muted">{hint}</Text>}
      {hasError && (
        <View style={styles.errorRow} role="alert">
          <Icon name="alert-circle" size={16} color={colors.tones.critical.text} />
          <Text size="sm" tone="critical">{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  input: {
    minHeight: MIN_TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
