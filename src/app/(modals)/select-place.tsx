import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { AppInput, AppText, EmptyView, ErrorView, LoadingView, Screen } from '@/components';
import {
  MIN_AUTOCOMPLETE_LENGTH,
  usePlaceAutocomplete,
} from '@/features/carpool/places/queries';
import { useCarpoolSearchStore } from '@/stores/carpool-search-store';
import { usePublishDraftStore } from '@/stores/publish-draft-store';
import { colors, spacing } from '@/theme';
import type { Place } from '@/types/models';
import { useDebouncedValue } from '@/utils/use-debounced-value';

type PlaceField = 'origin' | 'destination' | 'stop';
type PlaceTarget = 'search' | 'publish';

/**
 * Place picker.
 *
 * A modal because it is opened from two different flows — passenger search and
 * the driver publish wizard — and must return to whichever one opened it.
 * `field` says which slot the chosen place fills; `target` says which store to
 * write it to (`search` by default).
 */
export default function SelectPlaceModal() {
  const { field, target = 'search' } = useLocalSearchParams<{
    field?: PlaceField;
    target?: PlaceTarget;
  }>();
  const [term, setTerm] = useState('');
  const debounced = useDebouncedValue(term, 250);

  const searchSetOrigin = useCarpoolSearchStore((s) => s.setOrigin);
  const searchSetDestination = useCarpoolSearchStore((s) => s.setDestination);
  const publishSetOrigin = usePublishDraftStore((s) => s.setOrigin);
  const publishSetDestination = usePublishDraftStore((s) => s.setDestination);
  const publishAddStop = usePublishDraftStore((s) => s.addStop);

  const { data, isLoading, isError, error, refetch, isPlaceholderData } =
    usePlaceAutocomplete(debounced);

  const title =
    field === 'origin' ? 'Point de départ' : field === 'stop' ? 'Étape' : 'Destination';

  function choose(place: Place) {
    if (target === 'publish') {
      if (field === 'origin') publishSetOrigin(place);
      else if (field === 'stop') publishAddStop(place);
      else publishSetDestination(place);
    } else {
      if (field === 'origin') searchSetOrigin(place);
      else searchSetDestination(place);
    }
    router.back();
  }

  const tooShort = debounced.trim().length < MIN_AUTOCOMPLETE_LENGTH;

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Choisir un lieu' }} />

      <View style={styles.field}>
        <AppInput
          label={title}
          value={term}
          onChangeText={setTerm}
          placeholder="Ville ou point de rendez-vous"
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      {tooShort ? (
        <EmptyView
          title="Cherchez un lieu"
          description="Saisissez au moins deux lettres — Tunis, Sousse, Sfax…"
        />
      ) : isLoading ? (
        <LoadingView fullscreen label="Recherche…" />
      ) : isError && !data ? (
        <ErrorView error={error} onRetry={() => void refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyView title="Aucun lieu trouvé" description="Essayez une autre orthographe." />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(place) => place.id}
          keyboardShouldPersistTaps="handled"
          style={isPlaceholderData ? styles.stale : undefined}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => choose(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.label}, ${item.governorate}`}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <AppText variant="body">{item.label}</AppText>
              <AppText variant="caption" color="tertiary">
                {item.governorate}
              </AppText>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  list: {
    paddingBottom: spacing.xxl,
  },
  stale: {
    opacity: 0.6,
  },
  row: {
    paddingVertical: spacing.md,
    gap: spacing.xxs,
  },
  rowPressed: {
    opacity: 0.6,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
  },
});
