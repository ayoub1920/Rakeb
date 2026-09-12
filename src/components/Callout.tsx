import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { AppText } from './AppText';
import { Icon, type IconColor, type IconName } from './Icon';

export type CalloutTone = 'info' | 'success' | 'warning' | 'error';

const TONE_SURFACE: Record<CalloutTone, string> = {
  info: colors.status.infoSurface,
  success: colors.status.successSurface,
  warning: colors.status.warningSurface,
  error: colors.status.errorSurface,
};

const TONE_ICON: Record<CalloutTone, IconName> = {
  info: 'information-circle-outline',
  success: 'checkmark-circle-outline',
  warning: 'warning-outline',
  error: 'alert-circle-outline',
};

const TONE_ICON_COLOR: Record<CalloutTone, IconColor> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
};

export type CalloutProps = {
  message: string;
  tone?: CalloutTone;
  icon?: IconName;
  /** A secondary action rendered below the message (e.g. an `AppButton`). */
  action?: ReactNode;
};

/**
 * An inline tinted banner: icon, message, optional action.
 *
 * Unifies the taxi driver screen's rounded warning banner and the taxi
 * passenger search's un-rounded error banner — same idea, two looks — into one
 * component the rest of the app can reach for instead of a bespoke `View`.
 */
export function Callout({ message, tone = 'info', icon, action }: CalloutProps) {
  return (
    <View style={[styles.banner, { backgroundColor: TONE_SURFACE[tone] }]}>
      <View style={styles.row}>
        <Icon name={icon ?? TONE_ICON[tone]} size="md" color={TONE_ICON_COLOR[tone]} />
        <AppText variant="bodySmall" color="secondary" style={styles.text}>
          {message}
        </AppText>
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  text: {
    flex: 1,
  },
});
