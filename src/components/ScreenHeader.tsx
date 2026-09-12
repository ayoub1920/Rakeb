import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { AppText } from './AppText';
import { IconButton } from './IconButton';

export type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  /** Renders a back control. Only for screens with the native header hidden. */
  showBack?: boolean;
  /** Action rendered at the trailing edge (a filter or edit button). */
  trailing?: ReactNode;
};

/**
 * In-content header.
 *
 * Used on screens where the native stack header is hidden — tab roots, which
 * have no back button and want a large title. Screens inside a stack use the
 * native header instead (set via `Stack.Screen options`), so navigation
 * gestures and the platform back affordance keep working.
 */
export function ScreenHeader({ title, subtitle, showBack = false, trailing }: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      {showBack ? (
        <IconButton
          name="arrow-back"
          variant="plain"
          size="sm"
          onPress={() => router.back()}
          accessibilityLabel="Retour"
          style={styles.back}
        />
      ) : null}

      <View style={styles.titles}>
        <AppText variant="title" accessibilityRole="header">
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="bodySmall" color="secondary">
            {subtitle}
          </AppText>
        ) : null}
      </View>

      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  back: {
    marginTop: spacing.xxs,
  },
  titles: {
    flex: 1,
    gap: spacing.xxs,
  },
  trailing: {
    justifyContent: 'center',
  },
});
