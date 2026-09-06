import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { normalizeError } from '@/api/errors';
import { AppButton, AppCard, AppText, Screen } from '@/components';
import type { PublishDraft } from '@/features/carpool/publishing/api';
import { usePublishTrip } from '@/features/carpool/publishing/queries';
import { useVehicles } from '@/features/carpool/vehicles/queries';
import { useCanPublish, usePublishDraftStore } from '@/stores/publish-draft-store';
import { colors, radius, sizes, spacing } from '@/theme';
import { formatMillimes } from '@/utils/money';

const WEEKDAY_LABEL = ['', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'];

/** Step 6 — recap of the whole draft, then `POST /trips`. The only step that writes. */
export default function PublishReviewScreen() {
  const draft = usePublishDraftStore();
  const canPublish = useCanPublish();
  const publish = usePublishTrip();
  const { data: vehicles } = useVehicles();
  const [formError, setFormError] = useState<string | null>(null);

  const vehicle = vehicles?.find((v) => v.id === draft.vehicleId);

  async function onPublish() {
    setFormError(null);
    if (!canPublish || draft.origin === null || draft.destination === null) return;

    const payload: PublishDraft = {
      vehicleId: draft.vehicleId!,
      origin: draft.origin,
      destination: draft.destination,
      stops: draft.stops,
      departureDate: draft.departureDate!,
      departureTime: draft.departureTime!,
      seats: draft.seats,
      pricePerSeat: draft.pricePerSeat!,
      instantBook: draft.instantBook,
      maxTwoInBack: draft.maxTwoInBack,
      notes: draft.notes,
      recurrence:
        draft.recurrenceDays.length > 0 && draft.recurrenceUntil
          ? { days: draft.recurrenceDays, until: draft.recurrenceUntil }
          : null,
    };

    try {
      await publish.mutateAsync(payload);
      draft.reset();
      router.replace('/carpool/trips/mine');
    } catch (error) {
      setFormError(normalizeError(error).message);
    }
  }

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Vérifier et publier' }} />

      <View style={styles.sections}>
        <AppCard>
          <Row label="Départ" value={draft.origin?.label ?? '—'} />
          {draft.stops.map((stop, i) => (
            <Row key={`${stop.id}-${i}`} label="Étape" value={stop.label} />
          ))}
          <Row label="Arrivée" value={draft.destination?.label ?? '—'} />
          <View style={styles.divider} />
          <Row
            label="Départ le"
            value={
              draft.departureDate && draft.departureTime
                ? `${draft.departureDate} · ${draft.departureTime}`
                : '—'
            }
          />
          {draft.recurrenceDays.length > 0 ? (
            <Row
              label="Répétition"
              value={`${draft.recurrenceDays.map((d) => WEEKDAY_LABEL[d]).join(', ')} — jusqu’au ${draft.recurrenceUntil}`}
            />
          ) : null}
          <View style={styles.divider} />
          <Row
            label="Véhicule"
            value={vehicle ? `${vehicle.make} ${vehicle.model} · ${vehicle.plate}` : '—'}
          />
          <Row label="Places" value={`${draft.seats}`} />
          <Row
            label="Prix par place"
            value={draft.pricePerSeat != null ? formatMillimes(draft.pricePerSeat) : '—'}
          />
          <Row
            label="Réservation"
            value={draft.instantBook ? 'Immédiate' : 'Sur acceptation'}
          />
          {draft.maxTwoInBack ? <Row label="Confort" value="Max 2 à l’arrière" /> : null}
        </AppCard>

        <View style={styles.block}>
          <AppText variant="label" color="secondary">
            Note aux passagers (optionnel)
          </AppText>
          <TextInput
            value={draft.notes}
            onChangeText={draft.setNotes}
            placeholder="Point de rendez-vous précis, bagages, animaux…"
            placeholderTextColor={colors.text.tertiary}
            multiline
            style={styles.notes}
          />
        </View>

        {formError ? (
          <AppText variant="bodySmall" color="error">
            {formError}
          </AppText>
        ) : null}
      </View>

      <AppButton
        label={
          draft.pricePerSeat != null
            ? `Publier — ${draft.seats} place${draft.seats > 1 ? 's' : ''} à ${formatMillimes(draft.pricePerSeat, { compact: true })}`
            : 'Publier'
        }
        disabled={!canPublish}
        loading={publish.isPending}
        onPress={() => void onPublish()}
        style={styles.cta}
      />
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <AppText variant="bodySmall" color="tertiary">
        {label}
      </AppText>
      <AppText variant="bodySmall" style={styles.rowValue}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  sections: { gap: spacing.xl, paddingTop: spacing.md },
  block: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingVertical: spacing.xs,
  },
  rowValue: { flex: 1, textAlign: 'right' },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
    marginVertical: spacing.sm,
  },
  notes: {
    minHeight: sizes.input.minHeightMultiline,
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: radius.md,
    padding: spacing.md,
    textAlignVertical: 'top',
    color: colors.text.primary,
    fontSize: 16,
  },
  cta: { marginTop: spacing.xl },
});
