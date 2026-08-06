import { Stack, useLocalSearchParams } from 'expo-router';

import { DevelopmentPlaceholder, Screen } from '@/components';

/** Reached with `target_type` and `target_id` from a trip or a user profile. */
export default function ReportScreen() {
  const { target_type: targetType, target_id: targetId } = useLocalSearchParams<{
    target_type?: string;
    target_id?: string;
  }>();

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Signaler' }} />

      <DevelopmentPlaceholder
        title="Signalement"
        description="Signale un utilisateur ou un trajet avec un motif et des détails."
        feature="support"
        endpoints={['POST /reports']}
        params={{ target_type: targetType, target_id: targetId }}
      />
    </Screen>
  );
}
