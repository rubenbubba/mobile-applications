import { Children } from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing, type SpaceKey } from '../../theme/tokens';

interface GridProps {
  children: React.ReactNode;
  columns: number;
  gap?: SpaceKey;
}

export function Grid({ children, columns, gap = 'md' }: GridProps) {
  const size = spacing[gap];

  return (
    <View style={[styles.base, { marginHorizontal: -size / 2, marginBottom: -size }]}>
      {Children.toArray(children).map((child, index) => (
        <View
          key={index}
          style={{ width: `${100 / columns}%`, paddingHorizontal: size / 2, paddingBottom: size }}
        >
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', flexWrap: 'wrap' },
});
