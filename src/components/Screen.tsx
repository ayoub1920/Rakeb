import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, screenPadding, spacing } from '@/theme';

export type ScreenProps = {
  children: ReactNode;
  /** Wraps content in a `ScrollView`. Off by default — lists scroll themselves. */
  scrollable?: boolean;
  /** Horizontal screen padding. Off for full-bleed screens such as maps. */
  padded?: boolean;
  /** Safe-area edges to inset. A screen under a stack header does not need `top`. */
  edges?: Edge[];
  background?: 'default' | 'surface';
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * The outer container of every screen: safe-area insets, background, padding.
 *
 * Route files should render exactly one `Screen`, so insets and padding are
 * decided in one place rather than per screen.
 */
export function Screen({
  children,
  scrollable = false,
  padded = true,
  edges = ['bottom'],
  background = 'default',
  style,
  testID,
}: ScreenProps) {
  const content = padded ? styles.padded : undefined;

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.root, background === 'surface' && styles.surface]}
      testID={testID}
    >
      {scrollable ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, content, style]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, content, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  surface: {
    backgroundColor: colors.background.surface,
  },
  flex: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: screenPadding,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
});
