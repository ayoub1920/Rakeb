import { Stack } from 'expo-router';

import { Screen } from '@/components';
import { SupportChat } from '@/features/support/SupportChat';

/**
 * Full-screen live support chat. The primary entry point is the floating
 * headset button (a bottom sheet); this route exists so a support-message
 * notification and the Aide & sécurité menu have somewhere to deep-link.
 */
export default function SupportChatScreen() {
  return (
    <Screen padded={false}>
      <Stack.Screen options={{ title: 'Support Rakeb' }} />
      <SupportChat />
    </Screen>
  );
}
