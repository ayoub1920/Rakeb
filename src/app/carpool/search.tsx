import { Stack, router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppText, Screen } from '@/components';
import {
  MAX_SEATS,
  MIN_SEATS,
  useCanSearch,
  useCarpoolSearchStore,
} from '@/stores/carpool-search-store';
import { colors, radius, sizes, spacing } from '@/theme';
import { formatShortDate, toIsoDate } from '@/utils/date';

/** Number of upcoming days offered as quick chips. */
const DATE_WINDOW = 14;

/**
 * Passenger search form.
 *
 * The criteria live in `stores/carpool-search-store`, so the results screen and
 * "search again" from the home screen read the same values. This screen only
 * edits that store and then navigates.
 */
export default function SearchScreen() {
  const origin = useCarpoolSearchStore((s) => s.origin);
  const destination = useCarpoolSearchStore((s) => s.destination);
  const date = useCarpoolSearchStore((s) => s.date);
  const seats = useCarpoolSearchStore((s) => s.seats);
  const setDate = useCarpoolSearchStore((s) => s.setDate);
  const setSeats = useCarpoolSearchStore((s) => s.setSeats);
  const swapPlaces = useCarpoolSearchStore((s) => s.swapPlaces);
  const canSearch = useCanSearch();

  const days = useMemo(() => buildDayWindow(DATE_WINDOW), []);

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Chercher un trajet' }} />

      <View style={styles.sections}>
        <AppCard>
          <PlaceRow
            label="Départ"
            value={origin?.label}
            placeholder="D’où partez-vous ?"
            onPress={() => router.push('/(modals)/select-place?field=origin')}
          />
          <View style={styles.divider} />
          <PlaceRow
            label="Arrivée"
            value={destination?.label}
            placeholder="Où allez-vous ?"
            onPress={() => router.push('/(modals)/select-place?field=destination')}
          />

          <Pressable
            onPress={swapPlaces}
            accessibilityRole="button"
            accessibilityLabel="Inverser départ et arrivée"
            hitSlop={sizes.hitSlop}
            style={styles.swap}
          >
            <AppText variant="label" color="brand">
              ↑↓
            </AppText>
          </Pressable>
        </AppCard>

        <View style={styles.block}>
          <AppText variant="label" color="secondary">
            Date
          </AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateTrack}
          >
            {days.map((day) => {
              const iso = toIsoDate(day.date);
              const selected = date === iso;
              return (
                <Pressable
                  key={iso}
                  onPress={() => setDate(selected ? null : iso)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={day.label}
                  style={[styles.dateChip, selected && styles.dateChipSelected]}
                >
                  <AppText variant="bodySmall" color={selected ? 'inverse' : 'primary'}>
                    {day.label}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.block}>
          <AppText variant="label" color="secondary">
            Places
          </AppText>
          <View style={styles.stepper}>
            <StepperButton
              label="Retirer une place"
              symbol="−"
              disabled={seats <= MIN_SEATS}
              onPress={() => setSeats(seats - 1)}
            />
            <AppText variant="subheading" style={styles.seatCount}>
              {seats} {seats > 1 ? 'passagers' : 'passager'}
            </AppText>
            <StepperButton
              label="Ajouter une place"
              symbol="+"
              disabled={seats >= MAX_SEATS}
              onPress={() => setSeats(seats + 1)}
            />
          </View>
        </View>
      </View>

      <AppButton
        label="Rechercher"
        onPress={() => router.push('/carpool/results')}
        disabled={!canSearch}
        style={styles.submit}
      />
    </Screen>
  );
}

function PlaceRow({
  label,
  value,
  placeholder,
  onPress,
}: {
  label: string;
  value?: string;
  placeholder: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label} : ${value}` : `${label} : ${placeholder}`}
      style={styles.placeRow}
    >
      <AppText variant="caption" color="tertiary">
        {label}
      </AppText>
      <AppText variant="body" color={value ? 'primary' : 'tertiary'}>
        {value ?? placeholder}
      </AppText>
    </Pressable>
  );
}

function StepperButton({
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
      style={[styles.stepperButton, disabled && styles.stepperButtonDisabled]}
    >
      <AppText variant="heading" color={disabled ? 'tertiary' : 'brand'}>
        {symbol}
      </AppText>
    </Pressable>
  );
}

type Day = { date: Date; label: string };

function buildDayWindow(count: number): Day[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, offset) => {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const label =
      offset === 0 ? 'Aujourd’hui' : offset === 1 ? 'Demain' : formatShortDate(date);
    return { date, label };
  });
}

const styles = StyleSheet.create({
  sections: {
    gap: spacing.xl,
    paddingTop: spacing.md,
  },
  block: {
    gap: spacing.sm,
  },
  placeRow: {
    paddingVertical: spacing.sm,
    gap: spacing.xxs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
    marginVertical: spacing.xs,
  },
  swap: {
    position: 'absolute',
    right: spacing.lg,
    top: '50%',
    marginTop: -sizes.icon.md,
    width: sizes.icon.lg + spacing.sm,
    height: sizes.icon.lg + spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.strong,
    backgroundColor: colors.background.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateTrack: {
    gap: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  dateChip: {
    minWidth: 84,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.strong,
    alignItems: 'center',
    backgroundColor: colors.background.surfaceRaised,
  },
  dateChipSelected: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seatCount: {
    flex: 1,
    textAlign: 'center',
  },
  stepperButton: {
    width: sizes.button.md,
    height: sizes.button.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonDisabled: {
    borderColor: colors.border.default,
  },
  submit: {
    marginTop: spacing.xl,
  },
});
