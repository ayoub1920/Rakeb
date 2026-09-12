import { colors } from './colors';

/**
 * The native stack header, themed.
 *
 * Was copy-pasted verbatim into seven `_layout.tsx` files (taxi, taxi/passenger,
 * taxi/driver, carpool, admin, profile, support) — one place to change the
 * header look for every stack that keeps the native header.
 *
 * Untyped against `Stack`'s own options prop deliberately — `@react-navigation`
 * isn't a direct dependency here (expo-router vendors its own fork), so this
 * stays a plain object and is checked structurally at each `<Stack
 * screenOptions={stackScreenOptions}>` call site instead.
 */
export const stackScreenOptions = {
  headerBackButtonDisplayMode: 'minimal' as const,
  headerTintColor: colors.brand.primary,
  headerTitleStyle: { color: colors.text.primary },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.background.default },
};
