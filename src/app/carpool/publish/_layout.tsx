import { Stack } from 'expo-router';

/**
 * Publish wizard.
 *
 * Six steps over **one** draft trip: `POST /trips` takes the whole thing in a
 * single payload. When these are implemented, the draft belongs in a Zustand
 * store (`stores/publish-draft-store`), not in six independent forms — see
 * `features/carpool/publishing/README.md`.
 */
export default function PublishLayout() {
  return <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }} />;
}
