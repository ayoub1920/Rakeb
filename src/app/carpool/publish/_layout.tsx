import { Stack } from 'expo-router';

/**
 * Publish wizard — six steps over one draft trip held in
 * `stores/publish-draft-store`. `POST /trips` takes the whole trip in a single
 * payload; the steps just edit the draft.
 */

// A deep link straight to `/carpool/publish/price` should still build a stack
// that can step back through the wizard rather than exiting the group. The
// per-step `useRequirePublishStep` guard then bounces an incomplete draft to
// the first unfinished step.
export const unstable_settings = { initialRouteName: 'index' };

export default function PublishLayout() {
  return <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }} />;
}
