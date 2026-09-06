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
  ErrorView,
  LoadingView,
  Screen,
  ScreenHeader,
} from '@/components';
import { colors, radius, spacing } from '@/theme';
import type { User } from '@/types/models';
import { formatMonthYear, parseIsoDate } from '@/utils/date';

type MenuItem = { label: string; href: Href };

const MENU: MenuItem[] = [
  { label: 'Modifier mon profil', href: '/profile/edit' },
  { label: 'Mes trajets publiés', href: '/carpool/trips/mine' },
  { label: 'Mes véhicules', href: '/carpool/vehicles' },
  { label: 'Préférences de voyage', href: '/profile/preferences' },
  { label: 'Moyens de paiement', href: '/profile/payment-methods' },
  { label: 'Portefeuille', href: '/profile/wallet' },
  { label: 'Vérifications', href: '/profile/verifications' },
  { label: 'Aide et sécurité', href: '/support' },
];

const ADMIN_MENU: MenuItem[] = [{ label: 'Console admin', href: '/admin' }];

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

        <AppButton label={t('auth.signOut')} variant="ghost" onPress={() => void signOut()} />
      </View>
    </Screen>
  );
}

function ProfileHeader({ user }: { user: User }) {
  const { locale } = useLocale();

  const memberSince = parseIsoDate(user.member_since);
  const stats = [
    typeof user.rating === 'number' && user.rating > 0 ? `★ ${user.rating.toFixed(1)}` : null,
    typeof user.trips_count === 'number'
      ? `${user.trips_count} trajet${user.trips_count === 1 ? '' : 's'}`
      : null,
  ].filter(Boolean);

  return (
    <AppCard>
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <AppText variant="subheading" color="inverse">
            {initials(user.display_name)}
          </AppText>
        </View>

        <View style={styles.headerText}>
          <AppText variant="subheading">{user.display_name}</AppText>
          {stats.length > 0 ? (
            <AppText variant="bodySmall" color="secondary">
              {stats.join(' · ')}
            </AppText>
          ) : null}
          {memberSince ? (
            <AppText variant="caption" color="tertiary">
              Membre depuis {formatMonthYear(memberSince, locale)}
            </AppText>
          ) : null}
        </View>
      </View>
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
      <AppText variant="body">{item.label}</AppText>
      <AppText variant="body" color="tertiary">
        ›
      </AppText>
    </Pressable>
  );
}

/** First letters of the first and last name parts; falls back to the leading two characters. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
}

const styles = StyleSheet.create({
  sections: {
    gap: spacing.xl,
    paddingTop: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: spacing.xxs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
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
