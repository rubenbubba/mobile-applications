import { useWindowDimensions } from 'react-native';
import { TABLET_BREAKPOINT, WIDE_BREAKPOINT } from '../theme/tokens';

export function useBreakpoint() {
  const { width } = useWindowDimensions();

  return { isWide: width >= WIDE_BREAKPOINT, isTablet: width >= TABLET_BREAKPOINT };
}
