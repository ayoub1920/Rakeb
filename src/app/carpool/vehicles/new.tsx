import { Stack, router } from 'expo-router';
import { useState } from 'react';

import { getFieldError, normalizeError } from '@/api/errors';
import { Screen } from '@/components';
import type { VehicleInput } from '@/features/carpool/vehicles/api';
import { VehicleForm } from '@/features/carpool/vehicles/components/VehicleForm';
import { useCreateVehicle } from '@/features/carpool/vehicles/queries';

/** Add a vehicle. */
export default function NewVehicleScreen() {
  const create = useCreateVehicle();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(input: VehicleInput) {
    setError(null);
    try {
      await create.mutateAsync(input);
      router.back();
    } catch (e) {
      setError(getFieldError(e, 'plate') ?? normalizeError(e).message);
    }
  }

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Ajouter un véhicule' }} />
      <VehicleForm
        submitLabel="Enregistrer"
        loading={create.isPending}
        error={error}
        onSubmit={onSubmit}
      />
    </Screen>
  );
}
