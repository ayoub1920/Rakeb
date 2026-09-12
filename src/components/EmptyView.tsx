import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { AppButton } from './AppButton';
import { AppText } from './AppText';
import type { IconName } from './Icon';
import { IconMedallion } from './IconMedallion';

export type EmptyViewProps = {
  title: string;
  description?: string;
  icon?: IconName;
  /** The one thing the user can do about it — "Modifier la recherche". */
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
};

/** Shown when a request succeeded and returned nothing. Not an error state. */
export function EmptyView({
  title,
  description,
  icon = 'file-tray-outline',
  actionLabel,
  onAction,
  testID,
}: EmptyViewProps) {
  return (
    <View style={styles.container} testID={testID}>
      <IconMedallion icon={icon} tone="neutral" size="sm" />
      <AppText variant="subheading" align="center">
        {title}
      </AppText>
      {description ? (
        <AppText variant="bodySmall" color="secondary" align="center">
          {description}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <AppButton label={actionLabel} variant="secondary" onPress={onAction} fullWidth={false} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
});
