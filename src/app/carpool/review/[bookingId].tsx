import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { normalizeError } from '@/api/errors';
import { AppButton, AppCard, AppText, LoadingView, Screen } from '@/components';
import { useBooking } from '@/features/carpool/bookings/queries';
import { useReviewTags, useSubmitReview } from '@/features/carpool/reviews/queries';
import { colors, radius, sizes, spacing } from '@/theme';
import { useDiscardConfirm } from '@/utils/use-discard-confirm';
import { formatMillimes } from '@/utils/money';

const TIP_PRESETS = [1_000, 2_000, 5_000];

/** Rating, compliment tags, comment and an optional tip after a completed trip. */
export default function ReviewScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { data: booking } = useBooking(bookingId);
  const { data: tags, isLoading: tagsLoading } = useReviewTags();
  const submit = useSubmitReview(bookingId ?? '');

  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [tip, setTip] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const discard = useDiscardConfirm(
    (rating > 0 || selectedTags.length > 0 || comment.trim().length > 0 || tip !== null) &&
      !submit.isSuccess,
    { title: 'Abandonner votre avis ?', message: 'Votre note et votre commentaire seront perdus.' },
  );

  const peer = booking?.trip.driver.first_name;

  function toggleTag(id: string) {
    setSelectedTags((current) =>
      current.includes(id) ? current.filter((t) => t !== id) : [...current, id],
    );
  }

  async function onSubmit() {
    setFormError(null);
    if (rating === 0) {
      setFormError('Choisissez une note de 1 à 5 étoiles.');
      return;
    }
    try {
      await submit.mutateAsync({
        rating,
        tags: selectedTags,
        comment: comment.trim() || null,
        tip,
      });
      discard.bypass();
      router.dismissTo('/(tabs)/activity');
    } catch (error) {
      setFormError(normalizeError(error).message);
    }
  }

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Votre avis' }} />

      <View style={styles.sections}>
        <AppText variant="title">
          {peer ? `Comment était le trajet avec ${peer} ?` : 'Comment était le trajet ?'}
        </AppText>

        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((value) => (
            <Pressable
              key={value}
              onPress={() => setRating(value)}
              accessibilityRole="button"
              accessibilityLabel={`${value} étoile${value > 1 ? 's' : ''}`}
              accessibilityState={{ selected: value <= rating }}
              hitSlop={sizes.hitSlop}
            >
              <AppText variant="title" color={value <= rating ? 'brand' : 'tertiary'}>
                ★
              </AppText>
            </Pressable>
          ))}
        </View>

        <View style={styles.block}>
          <AppText variant="subheading">Qu’est-ce qui était bien ?</AppText>
          {tagsLoading ? (
            <LoadingView fullscreen={false} label="" />
          ) : (
            <View style={styles.tagWrap}>
              {(tags ?? []).map((tag) => {
                const active = selectedTags.includes(tag.id);
                return (
                  <Pressable
                    key={tag.id}
                    onPress={() => toggleTag(tag.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[styles.tag, active && styles.tagActive]}
                  >
                    <AppText variant="bodySmall" color={active ? 'inverse' : 'primary'}>
                      {tag.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.block}>
          <AppText variant="subheading">Commentaire (optionnel)</AppText>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Un mot pour les prochains passagers…"
            placeholderTextColor={colors.text.tertiary}
            multiline
            style={styles.comment}
          />
        </View>

        <View style={styles.block}>
          <AppText variant="subheading">Ajouter un pourboire ?</AppText>
          <View style={styles.tipRow}>
            {TIP_PRESETS.map((amount) => {
              const active = tip === amount;
              return (
                <Pressable
                  key={amount}
                  onPress={() => setTip(active ? null : amount)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[styles.tip, active && styles.tipActive]}
                >
                  <AppText variant="bodySmall" color={active ? 'inverse' : 'primary'}>
                    {formatMillimes(amount, { compact: true })}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {formError ? (
          <AppText variant="bodySmall" color="error">
            {formError}
          </AppText>
        ) : null}

        <AppButton
          label={
            tip ? `Envoyer mon avis · ${formatMillimes(tip, { compact: true })}` : 'Envoyer mon avis'
          }
          loading={submit.isPending}
          onPress={() => void onSubmit()}
        />

        {tip ? (
          <AppCard>
            <AppText variant="caption" color="tertiary">
              Le pourboire de {formatMillimes(tip)} est débité séparément et versé au conducteur.
            </AppText>
          </AppCard>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: {
    gap: spacing.xl,
    paddingTop: spacing.md,
  },
  block: {
    gap: spacing.sm,
  },
  stars: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.strong,
    backgroundColor: colors.background.surfaceRaised,
  },
  tagActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  comment: {
    minHeight: sizes.input.minHeightMultiline,
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: radius.md,
    padding: spacing.md,
    textAlignVertical: 'top',
    color: colors.text.primary,
    fontSize: 16,
  },
  tipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tip: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.strong,
    alignItems: 'center',
  },
  tipActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
});
