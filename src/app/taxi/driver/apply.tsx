import { Stack, router } from 'expo-router';
import { useState } from 'react';

import { normalizeError } from '@/api/errors';
import { ErrorView, LoadingView, Screen } from '@/components';
import { TaxiApplicationForm } from '@/features/taxi/components/TaxiApplicationForm';
import { useTaxiApplication, useSubmitTaxiApplication } from '@/features/taxi/queries';
import { useCurrentUser } from '@/features/profile/queries';

/**
 * Taxi driver application form. First/last name come straight from the
 * authenticated user's profile — never re-entered (spec requirement).
 *
 * Doubles as the resubmit screen: if an application already exists (most
 * likely `rejected`, reached via `driver/status.tsx`'s "Corriger et
 * renvoyer"), the form is pre-filled with it.
 */
export default function TaxiDriverApplyScreen() {
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: application, isLoading: applicationLoading, error: applicationError } =
    useTaxiApplication();
  const submit = useSubmitTaxiApplication();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // A 404 here just means "no application yet" — not a real error to show.
  const hasRealApplicationError =
    applicationError && (applicationError as { status?: number }).status !== 404;

  if (userLoading || applicationLoading) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'Devenir chauffeur' }} />
        <LoadingView />
      </Screen>
    );
  }

  if (!user || hasRealApplicationError) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'Devenir chauffeur' }} />
        <ErrorView error={applicationError} />
      </Screen>
    );
  }

  async function handleSubmit(input: Parameters<typeof submit.mutateAsync>[0]) {
    setSubmitError(null);
    try {
      await submit.mutateAsync(input);
      router.replace('/taxi/driver/status');
    } catch (error) {
      setSubmitError(normalizeError(error).message);
    }
  }

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Devenir chauffeur' }} />
      <TaxiApplicationForm
        firstName={user.first_name ?? ''}
        lastName={user.last_name ?? ''}
        initial={application}
        loading={submit.isPending}
        error={submitError}
        onSubmit={(input) => void handleSubmit(input)}
      />
    </Screen>
  );
}
