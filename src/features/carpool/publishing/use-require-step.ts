import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useRef } from 'react';

import {
  firstIncompletePublishStep,
  PUBLISH_STEPS,
  usePublishDraftStore,
  type PublishStepKey,
} from '@/stores/publish-draft-store';

/**
 * Guards a wizard step: if the draft has not legitimately reached `step`
 * (deep link, cold start, or a draft that was reset underneath the screen),
 * redirect to the first step that still needs input rather than render an
 * empty form.
 *
 * Returns `true` while the redirect is pending so the screen can render a
 * spinner instead of its (blank) content for that frame.
 */
export function useRequirePublishStep(step: PublishStepKey): boolean {
  const redirecting = useRef(false);

  useFocusEffect(
    useCallback(() => {
      const state = usePublishDraftStore.getState();
      const config = PUBLISH_STEPS.find((s) => s.key === step);
      if (config && !config.reached(state)) {
        redirecting.current = true;
        router.replace(firstIncompletePublishStep(state) as Href);
      } else {
        redirecting.current = false;
      }
    }, [step]),
  );

  return redirecting.current;
}
