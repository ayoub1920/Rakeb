import { Stack, router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { flattenPages } from '@/api/pagination';
import {
  AppButton,
  AppCard,
  AppText,
  EmptyView,
  ErrorView,
  LoadingView,
  Screen,
} from '@/components';
import { usePublicProfile, useUserReviews } from '@/features/profile/queries';
import { colors, radius, spacing } from '@/theme';
import type { UserReview } from '@/types/models';
import { formatLongDate, parseIsoDate } from '@/utils/date';

const BADGE_LABEL: Record<string, string> = {
  verified_phone: 'Téléphone vérifié',
  verified_email: 'Email vérifié',
  verified_id: 'Pièce d’identité vérifiée',
  verified_licence: 'Permis vérifié',
  superdriver: 'Super conducteur',
};

/** Another member's public profile: identity, stats, badges, reviews. */
export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = usePublicProfile(id ?? '');
  const reviews = useUserReviews(id ?? '');
  const rows = flattenPages(reviews.data);

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Profil' }} />

      {profile.isLoading ? (
        <LoadingView />
      ) : profile.isError || !profile.data ? (
        <ErrorView error={profile.error} onRetry={() => void profile.refetch()} />
      ) : (
        <View style={styles.sections}>
          <View style={styles.header}>
            <View style={styles.avatar}>
              <AppText variant="title" color="inverse">
                {profile.data.display_name.slice(0, 1).toUpperCase()}
              </AppText>
            </View>
            <AppText variant="title">{profile.data.display_name}</AppText>
            <AppText variant="bodySmall" color="secondary">
              {profile.data.rating != null
                ? `★ ${profile.data.rating.toFixed(1)} · ${profile.data.reviews_count} avis`
                : 'Pas encore noté'}
            </AppText>
            <AppText variant="caption" color="tertiary">
              Membre depuis {formatLongDate(parseIsoDate(profile.data.member_since) ?? new Date())}
            </AppText>
          </View>

          <View style={styles.statRow}>
            <Stat value={profile.data.trips_as_driver} label="trajets conduits" />
            <Stat value={profile.data.trips_as_rider} label="trajets passager" />
          </View>

          {profile.data.badges.length > 0 ? (
            <View style={styles.badges}>
              {profile.data.badges.map((b) => (
                <View key={b} style={styles.badge}>
                  <AppText variant="caption" color="brand">
                    {BADGE_LABEL[b] ?? b}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}

          {profile.data.bio ? (
            <AppText variant="body" color="secondary">
              {profile.data.bio}
            </AppText>
          ) : null}

          <View style={styles.block}>
            <AppText variant="subheading">Avis reçus</AppText>
            {reviews.isLoading ? (
              <LoadingView fullscreen={false} />
            ) : rows.length === 0 ? (
              <EmptyView title="Aucun avis" description="Ce membre n’a pas encore d’avis." />
            ) : (
              rows.map((review) => <ReviewRow key={review.id} review={review} />)
            )}
            {reviews.hasNextPage ? (
              <AppButton
                label="Voir plus"
                variant="secondary"
                loading={reviews.isFetchingNextPage}
                onPress={() => void reviews.fetchNextPage()}
              />
            ) : null}
          </View>

          <AppButton
            label="Signaler ce membre"
            variant="ghost"
            onPress={() =>
              router.push({
                pathname: '/support/report',
                params: { target_type: 'user', target_id: id },
              })
            }
          />
        </View>
      )}
    </Screen>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <AppCard style={styles.stat}>
      <AppText variant="title" color="brand">
        {value}
      </AppText>
      <AppText variant="caption" color="tertiary">
        {label}
      </AppText>
    </AppCard>
  );
}

function ReviewRow({ review }: { review: UserReview }) {
  return (
    <AppCard>
      <AppText variant="bodySmall" color="brand">
        {'★'.repeat(review.rating)}
        <AppText variant="bodySmall" color="tertiary">
          {'★'.repeat(5 - review.rating)}
        </AppText>
      </AppText>
      {review.comment ? (
        <AppText variant="bodySmall" style={styles.reviewComment}>
          « {review.comment} »
        </AppText>
      ) : null}
      <AppText variant="caption" color="tertiary">
        {review.author_name}
        {review.tags.length > 0 ? ` · ${review.tags.join(' · ')}` : ''}
      </AppText>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  sections: { gap: spacing.xl, paddingTop: spacing.md },
  header: { alignItems: 'center', gap: spacing.xs },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statRow: { flexDirection: 'row', gap: spacing.md },
  stat: { flex: 1, alignItems: 'center', gap: spacing.xxs },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primarySurface,
  },
  block: { gap: spacing.sm },
  reviewComment: { marginVertical: spacing.xxs },
});
