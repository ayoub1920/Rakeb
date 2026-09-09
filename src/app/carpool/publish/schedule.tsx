import { Stack, router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Screen, StepIndicator, WizardFooter } from '@/components';
import { useRequirePublishStep } from '@/features/carpool/publishing/use-require-step';
import { usePublishDraftStore } from '@/stores/publish-draft-store';
import { colors, radius, spacing } from '@/theme';
import { formatShortDate, toIsoDate } from '@/utils/date';

const DATE_WINDOW = 21;
/** 05:00 → 22:00 in 30-minute steps. */
const TIMES = Array.from({ length: 35 }, (_, i) => {
  const minutes = 5 * 60 + i * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
});
const WEEKDAYS = [
  { day: 1, label: 'L' },
  { day: 2, label: 'M' },
  { day: 3, label: 'M' },
  { day: 4, label: 'J' },
  { day: 5, label: 'V' },
  { day: 6, label: 'S' },
  { day: 7, label: 'D' },
];

/** Step 2 — departure date and time, optional weekly recurrence. */
export default function PublishScheduleScreen() {
  const redirecting = useRequirePublishStep('schedule');
  const date = usePublishDraftStore((s) => s.departureDate);
  const time = usePublishDraftStore((s) => s.departureTime);
  const setSchedule = usePublishDraftStore((s) => s.setSchedule);
  const recurrenceDays = usePublishDraftStore((s) => s.recurrenceDays);
  const recurrenceUntil = usePublishDraftStore((s) => s.recurrenceUntil);
  const toggleDay = usePublishDraftStore((s) => s.toggleRecurrenceDay);
  const setUntil = usePublishDraftStore((s) => s.setRecurrenceUntil);

  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: DATE_WINDOW }, (_, offset) => {
      const d = new Date(today);
      d.setDate(today.getDate() + offset);
      return {
        iso: toIsoDate(d),
        label: offset === 0 ? 'Auj.' : offset === 1 ? 'Demain' : formatShortDate(d),
      };
    });
  }, []);

  const recurring = recurrenceDays.length > 0;
  const ready = Boolean(date) && Boolean(time) && (!recurring || Boolean(recurrenceUntil));

  if (redirecting) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'Date et heure' }} />
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Date et heure' }} />

      <StepIndicator step={2} total={6} />

      <View style={styles.sections}>
        <View style={styles.block}>
          <AppText variant="label" color="secondary">
            Date
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.track}>
            {days.map((d) => {
              const selected = date === d.iso;
              return (
                <Pressable
                  key={d.iso}
                  onPress={() => setSchedule(selected ? null : d.iso, time)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[styles.chip, selected && styles.chipOn]}
                >
                  <AppText variant="bodySmall" color={selected ? 'inverse' : 'primary'}>
                    {d.label}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.block}>
          <AppText variant="label" color="secondary">
            Heure de départ
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.track}>
            {TIMES.map((t) => {
              const selected = time === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => setSchedule(date, selected ? null : t)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[styles.chip, selected && styles.chipOn]}
                >
                  <AppText variant="bodySmall" color={selected ? 'inverse' : 'primary'}>
                    {t}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.block}>
          <AppText variant="subheading">Trajet régulier</AppText>
          <AppText variant="bodySmall" color="secondary">
            Choisissez les jours pour répéter ce trajet chaque semaine.
          </AppText>
          <View style={styles.weekdays}>
            {WEEKDAYS.map((w) => {
              const on = recurrenceDays.includes(w.day);
              return (
                <Pressable
                  key={`${w.day}`}
                  onPress={() => toggleDay(w.day)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`Jour ${w.day}`}
                  style={[styles.weekday, on && styles.chipOn]}
                >
                  <AppText variant="label" color={on ? 'inverse' : 'primary'}>
                    {w.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          {recurring ? (
            <View style={styles.block}>
              <AppText variant="label" color="secondary">
                Jusqu’au
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.track}>
                {days.slice(6).map((d) => {
                  const selected = recurrenceUntil === d.iso;
                  return (
                    <Pressable
                      key={`u-${d.iso}`}
                      onPress={() => setUntil(selected ? null : d.iso)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      style={[styles.chip, selected && styles.chipOn]}
                    >
                      <AppText variant="bodySmall" color={selected ? 'inverse' : 'primary'}>
                        {d.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}
        </View>
      </View>

      <WizardFooter
        backHref="/carpool/publish/route"
        nextDisabled={!ready}
        onNext={() => router.push('/carpool/publish/vehicle')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: { gap: spacing.xl, paddingTop: spacing.md },
  block: { gap: spacing.sm },
  track: { gap: spacing.sm, paddingVertical: spacing.xxs },
  chip: {
    minWidth: 72,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.strong,
    alignItems: 'center',
    backgroundColor: colors.background.surfaceRaised,
  },
  chipOn: { backgroundColor: colors.brand.primary, borderColor: colors.brand.primary },
  weekdays: { flexDirection: 'row', gap: spacing.sm },
  weekday: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: { marginTop: spacing.xl },
});
