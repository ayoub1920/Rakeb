import { Stack, router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppText, LoadingView, Screen } from '@/components';
import { usePriceSuggestion } from '@/features/carpool/publishing/queries';
import { usePublishDraftStore } from '@/stores/publish-draft-store';
import { colors, radius, sizes, spacing } from '@/theme';
import { formatMillimes } from '@/utils/money';

/** Adjust the per-seat price by this step, in millimes. */
const STEP = 500;

/**
 * Step 5 — price per seat.
 *
 * The recommended price and its min/max come from `GET /trips/price-suggestion`.
 * The client renders the range and clamps to it; it never computes a suggestion.
 */
export default function PublishPriceScreen() {
  const origin = usePublishDraftStore((s) => s.origin);
  const destination = usePublishDraftStore((s) => s.destination);
  const date = usePublishDraftStore((s) => s.departureDate);
  const price = usePublishDraftStore((s) => s.pricePerSeat);
  const setPrice = usePublishDraftStore((s) => s.setPrice);

  const { data: suggestion, isLoading } = usePriceSuggestion(origin?.id, destination?.id, date);

  // Anchor on the recommended price the first time it arrives.
  useEffect(() => {
    if (suggestion && price === null) setPrice(suggestion.suggested);
  }, [suggestion, price, setPrice]);

  if (isLoading || !suggestion) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'Prix' }} />
        <LoadingView label="Estimation du prix…" />
      </Screen>
    );
  }

  const current = price ?? suggestion.suggested;
  const clamp = (value: number) => Math.min(suggestion.max, Math.max(suggestion.min, value));

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Prix' }} />

      <View style={styles.sections}>
        <AppText variant="title" align="center">
          {formatMillimes(current)}
        </AppText>
        <AppText variant="bodySmall" color="secondary" align="center">
          par place
        </AppText>

        <View style={styles.stepper}>
          <StepButton
            label="Baisser le prix"
            symbol="−"
            disabled={current <= suggestion.min}
            onPress={() => setPrice(clamp(current - STEP))}
          />
          <View style={styles.rangeText}>
            <AppText variant="caption" color="tertiary">
              min {formatMillimes(suggestion.min, { compact: true })}
            </AppText>
            <AppText variant="caption" color="tertiary">
              max {formatMillimes(suggestion.max, { compact: true })}
            </AppText>
          </View>
          <StepButton
            label="Augmenter le prix"
            symbol="+"
            disabled={current >= suggestion.max}
            onPress={() => setPrice(clamp(current + STEP))}
          />
        </View>

        <Pressable
          onPress={() => setPrice(suggestion.suggested)}
          accessibilityRole="button"
          accessibilityLabel="Revenir au prix recommandé"
        >
          <AppCard style={styles.recommend}>
            <AppText variant="bodySmall" color="secondary">
              Recommandé pour ce trajet
            </AppText>
            <AppText variant="subheading" color="brand">
              {formatMillimes(suggestion.suggested)}
            </AppText>
          </AppCard>
        </Pressable>
      </View>

      <AppButton
        label="Continuer"
        onPress={() => {
          setPrice(clamp(current));
          router.push('/carpool/publish/review');
        }}
        style={styles.cta}
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

const styles = StyleSheet.create({
  sections: { gap: spacing.md, paddingTop: spacing.xl },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  rangeText: { alignItems: 'center', gap: spacing.xxs },
  stepButton: {
    width: sizes.button.lg,
    height: sizes.button.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonOff: { borderColor: colors.border.default },
  recommend: { alignItems: 'center', gap: spacing.xxs, marginTop: spacing.lg },
  cta: { marginTop: spacing.xxl },
});
