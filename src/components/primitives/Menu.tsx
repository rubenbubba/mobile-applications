import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { MIN_TOUCH_TARGET, radii, spacing } from '../../theme/tokens';
import { Text } from './Text';
import { Touchable } from './Touchable';

interface MenuItem {
  label: string;
  onPress: () => void;
}

interface MenuProps {
  items: MenuItem[];
  visible: boolean;
  onClose: () => void;
}

export function Menu({ items, visible, onClose }: MenuProps) {
  const { colors } = useTheme();

  if (!visible) return null;

  return (
    <>
      <Touchable onPress={onClose} label="Close menu" hoverColor="transparent" style={styles.overlay}>
        <View />
      </Touchable>
      <View style={[styles.menu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {items.map((item) => (
          <Touchable
            key={item.label}
            onPress={() => {
              item.onPress();
              onClose();
            }}
            role="menuitem"
            style={styles.menuItem}
          >
            <Text size="md">{item.label}</Text>
          </Touchable>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  menu: { position: 'absolute', borderWidth: 1, borderRadius: radii.md, overflow: 'hidden', minWidth: 180 },
  menuItem: { minHeight: MIN_TOUCH_TARGET, justifyContent: 'center', paddingHorizontal: spacing.lg },
});
