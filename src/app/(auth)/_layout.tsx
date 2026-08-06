import { Stack } from 'expo-router';

/**
 * Authentication flow.
 *
 * The native header is hidden across the group: these screens are branded and
 * use `ScreenHeader` for their own back control. Swipe-back still works.
 */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
