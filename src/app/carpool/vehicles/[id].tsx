import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { getFieldError, normalizeError } from '@/api/errors';
import {
  AppButton,
  AppText,
  ErrorView,
  LoadingView,
  Screen,
} from '@/components';
import type { VehicleInput } from '@/features/carpool/vehicles/api';
import { VehicleForm } from '@/features/carpool/vehicles/components/VehicleForm';
import {
  useDeleteVehicle,
  useUpdateVehicle,
  useVehicles,
} from '@/features/carpool/vehicles/queries';
import { spacing } from '@/theme';

/** Edit a vehicle: update fields, set default, or delete. */
export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: vehicles, isLoading, isError, error, refetch } = useVehicles();
  const vehicle = vehicles?.find((v) => v.id === id);

  const update = useUpdateVehicle(id ?? '');
  const remove = useDeleteVehicle(id ?? '');
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function onSubmit(input: VehicleInput) {
    setFormError(null);
    try {
      await update.mutateAsync(input);
      router.back();
    } catch (e) {
      setFormError(getFieldError(e, 'plate') ?? normalizeError(e).message);
    }
  }

  async function onDelete() {
    setFormError(null);
    try {
      await remove.mutateAsync();
      router.back();
    } catch (e) {
      setConfirmDelete(false);
      setFormError(normalizeError(e).message);
    }
  }

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Véhicule' }} />

      {isLoading ? (
        <LoadingView />
      ) : isError || !vehicle ? (
        <ErrorView error={error ?? new Error('Véhicule introuvable.')} onRetry={() => void refetch()} />
      ) : (
        <View>
          <VehicleForm
            initial={vehicle}
            submitLabel="Enregistrer les modifications"
            loading={update.isPending}
            error={formError}
            onSubmit={onSubmit}
          />

          <View style={styles.footer}>
            {!vehicle.is_default ? (
              <AppButton
                label="Définir comme véhicule par défaut"
                variant="secondary"
                loading={update.isPending}
                onPress={() => update.mutate({ is_default: true })}
              />
            ) : null}

            {confirmDelete ? (
              <View style={styles.confirm}>
                <AppText variant="bodySmall" color="secondary">
                  Supprimer ce véhicule ? Impossible s’il est utilisé par un trajet actif.
                </AppText>
                <View style={styles.confirmRow}>
                  <AppButton
                    label="Garder"
                    variant="secondary"
                    fullWidth={false}
                    onPress={() => setConfirmDelete(false)}
                  />
                  <AppButton
                    label="Supprimer"
                    variant="danger"
                    fullWidth={false}
                    loading={remove.isPending}
                    onPress={() => void onDelete()}
                  />
                </View>
              </View>
            ) : (
              <AppButton
                label="Supprimer ce véhicule"
                variant="ghost"
                onPress={() => setConfirmDelete(true)}
              />
            )}
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: { marginTop: spacing.xl, gap: spacing.md },
  confirm: { gap: spacing.sm },
  confirmRow: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' },
});
