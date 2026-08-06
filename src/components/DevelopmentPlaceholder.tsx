import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { AppText } from './AppText';

export type DevelopmentPlaceholderProps = {
  /** What this screen will be, in the product's words. */
  title: string;
  /** One sentence describing what the finished screen does. */
  description: string;
  /** Feature folder that will own the logic, e.g. `carpool/bookings`. */
  feature: string;
  /** Endpoints from `API Rakeb.md` this screen will call. */
  endpoints?: string[];
  /** Route parameters the screen received, so dynamic routes are verifiable. */
  params?: Record<string, string | undefined>;
};

/**
 * The body of every scaffolded route.
 *
 * It is a handover note rendered on screen: what the screen becomes, which
 * feature folder owns it, and which endpoints it consumes. That is what makes
 * these routes worth keeping until they are implemented — a developer opening
 * the app can see the whole map without reading the docs.
 *
 * Its styling is deliberately unlike the product's (dashed violet), so nothing
 * here can be mistaken for a finished screen, and every remaining instance is
 * visible at a glance.
 */
export function DevelopmentPlaceholder({
  title,
  description,
  feature,
  endpoints,
  params,
}: DevelopmentPlaceholderProps) {
  const routeParams = Object.entries(params ?? {}).filter(([, value]) => value !== undefined);

  return (
    <View style={styles.container} testID="development-placeholder">
      <View style={styles.badge}>
        <AppText variant="caption" color="development">
          ÉCRAN NON IMPLÉMENTÉ
        </AppText>
      </View>

      <AppText variant="heading" accessibilityRole="header">
        {title}
      </AppText>
      <AppText variant="bodySmall" color="secondary">
        {description}
      </AppText>

      <View style={styles.meta}>
        <AppText variant="caption" color="tertiary">
          Logique à implémenter dans src/features/{feature}
        </AppText>

        {endpoints?.length ? (
          <AppText variant="caption" color="tertiary">
            Endpoints : {endpoints.join(' · ')}
          </AppText>
        ) : null}

        {routeParams.length ? (
          <AppText variant="caption" color="tertiary">
            Paramètres : {routeParams.map(([key, value]) => `${key}=${value}`).join(', ')}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    padding: spacing.lg,
    marginVertical: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.development.border,
    backgroundColor: colors.development.surface,
  },
  badge: {
    alignSelf: 'flex-start',
  },
  meta: {
    gap: spacing.xxs,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.development.border,
  },
});
