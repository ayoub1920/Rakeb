import { Stack } from 'expo-router';

/**
 * Modal routes.
 *
 * Grouped so `presentation: 'modal'` is declared once. A modal is the right
 * shape for something that interrupts a flow and returns to it — the
 * coming-soon notice, the place picker — not for a destination.
 */
export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: 'modal',
        headerShown: true,
        headerBackButtonDisplayMode: 'minimal',
      }}
    />
  );
}
