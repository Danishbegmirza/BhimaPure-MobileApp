import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Bottom padding for fixed footers, tab bars, and bottom CTAs.
 * Uses `SafeAreaProvider` insets when the OS reports them; on Android with
 * gesture navigation `bottom` is often 0 — use a minimum so controls sit
 * above the system nav / gesture bar.
 */
export function useSafeBottomInset(): number {
  const { bottom } = useSafeAreaInsets();
  const minAndroid = Platform.OS === 'android' ? 20 : 0;
  return Math.max(bottom, minAndroid);
}
