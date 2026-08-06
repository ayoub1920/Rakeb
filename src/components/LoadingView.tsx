import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme';

import { AppText } from './AppText';

export type LoadingViewProps = {
  label?: string;
  /** Fills its parent. Off when used inside a list footer. */
  fullscreen?: boolean;
  testID?: string;
};

export function LoadingView({
  label = 'Chargement…',
  fullscreen = true,
  testID,
}: LoadingViewProps) {
  return (
    <View
      style={[styles.container, fullscreen && styles.fullscreen]}
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
    >
      <ActivityIndicator size="large" color={colors.brand.primary} />
      {label ? (
        <AppText variant="bodySmall" color="secondary">
          {label}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  fullscreen: {
    flex: 1,
  },
});
