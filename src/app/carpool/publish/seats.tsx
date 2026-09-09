import { Stack, router } from 'expo-router';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { AppText, Screen, StepIndicator, WizardFooter } from '@/components';
import { useRequirePublishStep } from '@/features/carpool/publishing/use-require-step';
import { useVehicles } from '@/features/carpool/vehicles/queries';
import {
  MAX_TRIP_SEATS,
  MIN_TRIP_SEATS,
  usePublishDraftStore,
} from '@/stores/publish-draft-store';
import { colors, radius, sizes, spacing } from '@/theme';

/** Step 4 — seats offered, instant book, and the "max two in the back" option. */
export default function PublishSeatsScreen() {
  const redirecting = useRequirePublishStep('seats');
  const seats = usePublishDraftStore((s) => s.seats);
  const setSeats = usePublishDraftStore((s) => s.setSeats);
  const instantBook = usePublishDraftStore((s) => s.instantBook);
  const setInstantBook = usePublishDraftStore((s) => s.setInstantBook);
  const maxTwoInBack = usePublishDraftStore((s) => s.maxTwoInBack);
  const setMaxTwoInBack = usePublishDraftStore((s) => s.setMaxTwoInBack);
  const vehicleId = usePublishDraftStore((s) => s.vehicleId);

  const { data: vehicles } = useVehicles();
  const vehicle = vehicles?.find((v) => v.id === vehicleId);
  const max = Math.min(MAX_TRIP_SEATS, vehicle?.seats ?? MAX_TRIP_SEATS);

  if (redirecting) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'Places' }} />
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Places' }} />

      <StepIndicator step={4} total={6} />

      <View style={styles.sections}>
        <View style={styles.block}>
          <AppText variant="label" color="secondary">
            Places proposées
          </AppText>
          <View style={styles.stepper}>
            <StepButton
              label="Retirer une place"
              symbol="−"
              disabled={seats <= MIN_TRIP_SEATS}
              onPress={() => setSeats(seats - 1)}
            />
            <AppText variant="subheading" style={styles.count}>
              {seats} {seats > 1 ? 'places' : 'place'}
            </AppText>
            <StepButton
              label="Ajouter une place"
              symbol="+"
              disabled={seats >= max}
              onPress={() => setSeats(seats + 1)}
            />
          </View>
          {vehicle ? (
            <AppText variant="caption" color="tertiary">
              {vehicle.make} {vehicle.model} · {vehicle.seats} places passagers
            </AppText>
          ) : null}
        </View>

        <ToggleRow
          title="Réservation immédiate"
          subtitle="Les passagers réservent sans attendre votre accord."
          value={instantBook}
          onChange={setInstantBook}
        />
        <ToggleRow
          title="Maximum 2 à l’arrière"
          subtitle="Plus de place pour chacun sur la banquette."
          value={maxTwoInBack}
          onChange={setMaxTwoInBack}
        />
      </View>

      <WizardFooter
        backHref="/carpool/publish/vehicle"
        onNext={() => router.push('/carpool/publish/price')}
      />
    </Screen>
  );
}

function StepButton({
  label,
  symbol,
  disabled,
  onPress,
}: {
  label: string;
  symbol: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={[styles.stepButton, disabled && styles.stepButtonOff]}
    >
      <AppText variant="heading" color={disabled ? 'tertiary' : 'brand'}>
        {symbol}
      </AppText>
    </Pressable>
  );
}

function ToggleRow({
  title,
  subtitle,
  value,
  onChange,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleText}>
        <AppText variant="body">{title}</AppText>
        <AppText variant="caption" color="tertiary">
          {subtitle}
        </AppText>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.brand.primary, false: colors.border.strong }}
        thumbColor={colors.background.default}
        accessibilityLabel={title}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sections: { gap: spacing.xl, paddingTop: spacing.md },
  block: { gap: spacing.sm },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  count: { flex: 1, textAlign: 'center' },
  stepButton: {
    width: sizes.button.md,
    height: sizes.button.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonOff: { borderColor: colors.border.default },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  toggleText: { flex: 1, gap: spacing.xxs },
  cta: { marginTop: spacing.xl },
});
