import { Stack } from 'expo-router';

import { useTaxiApplication } from '@/features/taxi/queries';
import {
  TaxiBroadcastProvider,
  useTaxiDriverBroadcast,
} from '@/features/taxi/use-taxi-driver-broadcast';
import { stackScreenOptions } from '@/theme';

/**
 * Driver stack. No role gate here — anyone may apply; individual screens
 * (`online.tsx`) redirect based on the application's status. Each screen
 * sets its own `title`, same convention as `carpool/_layout.tsx`.
 *
 * Mounts the location broadcast hook once, at this level, driven by
 * `application.is_online` — not inside `online.tsx` itself, so it keeps
 * running when the driver navigates from "go online" into an active ride
 * screen (a per-screen mount would stop broadcasting at exactly the moment
 * it matters most).
 */
export default function TaxiDriverLayout() {
  const { data: application } = useTaxiApplication();
  const broadcast = useTaxiDriverBroadcast(application?.status === 'approved' && application.is_online);

  return (
    <TaxiBroadcastProvider value={broadcast}>
      <Stack screenOptions={stackScreenOptions} />
    </TaxiBroadcastProvider>
  );
}
