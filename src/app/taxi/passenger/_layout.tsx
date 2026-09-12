import { Stack } from 'expo-router';

import { stackScreenOptions } from '@/theme';

/** Passenger stack — no gate, any authenticated user may hail a taxi. */
export default function TaxiPassengerLayout() {
  return <Stack screenOptions={stackScreenOptions} />;
}
