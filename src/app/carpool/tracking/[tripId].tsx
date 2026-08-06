import { Stack, useLocalSearchParams } from 'expo-router';

import { DevelopmentPlaceholder, Screen } from '@/components';
import { MapPlaceholder } from '@/services/maps/MapPlaceholder';

/**
 * Live tracking.
 *
 * The map is the placeholder from `services/maps` — features never import a
 * map SDK directly, so swapping in a real provider changes one component.
 */
export default function TrackingScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Suivi du trajet' }} />

      <MapPlaceholder height={220} />

      <DevelopmentPlaceholder
        title="Suivi en temps réel"
        description="Position du conducteur, ETA et état du trajet, via WebSocket avec repli sur le polling."
        feature="carpool/tracking"
        endpoints={['GET /trips/{id}/tracking', 'WS /ws/trips/{id}']}
        params={{ tripId }}
      />
    </Screen>
  );
}
