import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components';
import { colors, radius, spacing } from '@/theme';
import type { PromoBanner } from '@/types/models';

import { usePromoBanners } from '../queries';

/**
 * Horizontal promo strip for the home screen.
 *
 * Renders nothing while loading, on error, or when the campaign list is empty —
 * a promo strip that shows a spinner or an error is worse than no strip. The
 * home screen can mount it unconditionally.
 */
export function PromoBannerStrip() {
  const { data } = usePromoBanners();

  if (!data || data.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.track}
    >
      {data.map((banner) => (
        <BannerCard key={banner.id} banner={banner} />
      ))}
    </ScrollView>
  );
}

function BannerCard({ banner }: { banner: PromoBanner }) {
  const target = banner.cta_route as Href | null;

  const body = (
    <>
      <AppText variant="label" color="inverse">
        {banner.title}
      </AppText>
      {banner.subtitle ? (
        <AppText variant="caption" color="inverse">
          {banner.subtitle}
        </AppText>
      ) : null}
    </>
  );

  if (!target) {
    return <View style={styles.card}>{body}</View>;
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${banner.title}${banner.subtitle ? `. ${banner.subtitle}` : ''}`}
      onPress={() => router.push(target)}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  card: {
    width: 260,
    minHeight: 96,
    borderRadius: radius.lg,
    padding: spacing.lg,
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.brand.primary,
  },
  pressed: {
    opacity: 0.9,
  },
});
