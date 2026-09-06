import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { normalizeError } from '@/api/errors';
import { AppButton, AppCard, AppText, ErrorView, LoadingView, Screen } from '@/components';
import { usePreferences, useSetPreferences } from '@/features/profile/queries';
import { colors, radius, spacing } from '@/theme';
import type { PreferenceLevel, TravelPreferences } from '@/types/models';

const ROWS: { key: keyof TravelPreferences; label: string; hint: string }[] = [
  { key: 'chat', label: 'Discussion', hint: 'J’aime discuter pendant le trajet' },
  { key: 'music', label: 'Musique', hint: 'De la musique dans la voiture' },
  { key: 'smoking', label: 'Cigarette', hint: 'Pauses cigarette autorisées' },
  { key: 'pets', label: 'Animaux', hint: 'Les animaux sont les bienvenus' },
];

const LEVELS: { value: PreferenceLevel; label: string }[] = [
  { value: 'yes', label: 'Oui' },
  { value: 'maybe', label: 'Ça dépend' },
  { value: 'no', label: 'Non' },
];

/** Préférences de voyage — shown on the public profile. `GET · PUT /me/preferences`. */
export default function PreferencesScreen() {
  const { data, isLoading, isError, error, refetch } = usePreferences();
  const save = useSetPreferences();
  const [draft, setDraft] = useState<TravelPreferences | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (data && !draft) setDraft(data);
  }, [data, draft]);

  const current = draft ?? data;
  const dirty = Boolean(data && draft && ROWS.some((r) => data[r.key] !== draft[r.key]));

  async function onSave() {
    if (!draft) return;
    setFormError(null);
    try {
      await save.mutateAsync(draft);
      router.back();
    } catch (e) {
      setFormError(normalizeError(e).message);
    }
  }

  if (isLoading || !current) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'Préférences de voyage' }} />
        {isError ? <ErrorView error={error} onRetry={() => void refetch()} /> : <LoadingView />}
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Préférences de voyage' }} />

      <View style={styles.sections}>
        {ROWS.map((row) => (
          <AppCard key={row.key} style={styles.card}>
            <AppText variant="label">{row.label}</AppText>
            <AppText variant="caption" color="tertiary" style={styles.hint}>
              {row.hint}
            </AppText>
            <View style={styles.segment}>
              {LEVELS.map((level) => {
                const active = current[row.key] === level.value;
                return (
                  <Pressable
                    key={level.value}
                    onPress={() =>
                      setDraft((prev) => ({ ...(prev ?? current), [row.key]: level.value }))
                    }
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[styles.segmentItem, active && styles.segmentItemActive]}
                  >
                    <AppText variant="label" color={active ? 'inverse' : 'secondary'}>
                      {level.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </AppCard>
        ))}

        {formError ? (
          <AppText variant="bodySmall" color="error">
            {formError}
          </AppText>
        ) : null}

        <AppButton
          label="Enregistrer"
          loading={save.isPending}
          disabled={!dirty}
          onPress={() => void onSave()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: { gap: spacing.md, paddingTop: spacing.md },
  card: { gap: spacing.xs },
  hint: { marginBottom: spacing.xs },
  segment: {
    flexDirection: 'row',
    borderRadius: radius.md,
    backgroundColor: colors.background.surface,
    padding: spacing.xxs,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  segmentItemActive: { backgroundColor: colors.brand.primary },
});
