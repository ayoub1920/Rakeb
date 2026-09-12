import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Fragment } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/use-auth';
import { useCurrentUser, useIsAdmin } from '@/features/profile/queries';
import { useLocale } from '@/localization/use-locale';
import {
  AppButton,
  AppCard,
  AppText,
  Avatar,
  ErrorView,
  Icon,
  type IconName,
  LoadingView,
  Rating,
  Screen,
  ScreenHeader,
} from '@/components';
import { colors, spacing } from '@/theme';
import type { User } from '@/types/models';
import { formatMonthYear, parseIsoDate } from '@/utils/date';

type MenuItem = { label: string; href: Href; icon: IconName };

const MENU: MenuItem[] = [
  { label: 'Modifier mon profil', href: '/profile/edit', icon: 'person-outline' },
  { label: 'Mes trajets publiés', href: '/carpool/trips/mine', icon: 'map-outline' },
  { label: 'Mes véhicules', href: '/carpool/vehicles', icon: 'car-outline' },
  { label: 'Préférences de voyage', href: '/profile/preferences', icon: 'options-outline' },
  { label: 'Moyens de paiement', href: '/profile/payment-methods', icon: 'card-outline' },
  { label: 'Portefeuille', href: '/profile/wallet', icon: 'wallet-outline' },
  { label: 'Vérifications', href: '/profile/verifications', icon: 'shield-checkmark-outline' },
  { label: 'Aide et sécurité', href: '/support', icon: 'help-buoy-outline' },
];

const ADMIN_MENU: MenuItem[] = [{ label: 'Console admin', href: '/admin', icon: 'construct-outline' }];

/**
 * Compte — the hub for profile, payments, wallet and support.
 *
 * The header is real (`GET /me`). Profile / preferences / payment methods /
 * wallet / verifications are wired; notifications and support are still
 * placeholders. The admin console row shows only for staff (`useIsAdmin`).
 */
export default function AccountScreen() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const { data: user, isLoading, isError, error, refetch } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const menu = isAdmin ? [...MENU, ...ADMIN_MENU] : MENU;

  return (
    <Screen scrollable edges={['top', 'bottom']}>
      <ScreenHeader title={t('tabs.account')} />

      <View style={styles.sections}>
        {isLoading ? (
          <LoadingView fullscreen={false} />
        ) : isError ? (
          <ErrorView error={error} onRetry={() => void refetch()} />
        ) : user ? (
          <ProfileHeader user={user} />
        ) : null}

        <AppCard padded={false}>
          {menu.map((item, index) => (
            <Fragment key={item.href as string}>
              {index > 0 ? <View style={styles.separator} /> : null}
              <MenuRow item={item} />
            </Fragment>
          ))}
        </AppCard>

        <AppButton
          label={t('auth.signOut')}
          variant="ghost"
          iconLeft="log-out-outline"
          onPress={() => void signOut()}
        />
      </View>
    </Screen>
  );
}

function ProfileHeader({ user }: { user: User }) {
  const { locale } = useLocale();

  const memberSince = parseIsoDate(user.member_since);
  const hasRating = typeof user.rating === 'number' && user.rating > 0;
  const tripsLabel =
    typeof user.trips_count === 'number'
      ? `${user.trips_count} trajet${user.trips_count === 1 ? '' : 's'}`
      : null;

  return (
    <AppCard leading={<Avatar name={user.display_name} size="xl" />}>
      <AppText variant="subheading">{user.display_name}</AppText>
      {hasRating || tripsLabel ? (
        <View style={styles.stats}>
          {hasRating ? <Rating value={user.rating as number} size="sm" /> : null}
          {tripsLabel ? (
            <AppText variant="bodySmall" color="secondary">
              {hasRating ? `· ${tripsLabel}` : tripsLabel}
            </AppText>
          ) : null}
        </View>
      ) : null}
      {memberSince ? (
        <AppText variant="caption" color="tertiary">
          Membre depuis {formatMonthYear(memberSince, locale)}
        </AppText>
      ) : null}
    </AppCard>
  );
}

function MenuRow({ item }: { item: MenuItem }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={item.label}
      onPress={() => router.push(item.href)}
    >
      <Icon name={item.icon} size="md" color="secondary" />
      <AppText variant="body" style={styles.rowLabel}>
        {item.label}
      </AppText>
      <Icon name="chevron-forward" size="md" color="tertiary" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sections: {
    gap: spacing.xl,
    paddingTop: spacing.md,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  rowLabel: {
    flex: 1,
  },
  rowPressed: {
    backgroundColor: colors.background.surface,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
    marginLeft: spacing.lg,
  },
});
