import { StyleSheet, View } from 'react-native';

import { normalizeError } from '@/api/errors';
import { env } from '@/config/env';
import { spacing } from '@/theme';

import { AppButton } from './AppButton';
import { AppText } from './AppText';

export type ErrorViewProps = {
  /** Anything thrown by a query or mutation; normalized to `ApiError` here. */
  error: unknown;
  onRetry?: () => void;
  testID?: string;
};

/**
 * Failure state for a query.
 *
 * Shows the backend's `message`, which is already user-facing text. The `code`
 * and `requestId` are only rendered in development — in production they are
 * noise to the user, but they are exactly what a support ticket needs, so
 * surfacing them through the support flow is a TODO for `features/support`.
 */
export function ErrorView({ error, onRetry, testID }: ErrorViewProps) {
  const apiError = normalizeError(error);

  return (
    <View style={styles.container} testID={testID}>
      <AppText variant="subheading" align="center">
        Oups
      </AppText>
      <AppText variant="bodySmall" color="secondary" align="center">
        {apiError.message}
      </AppText>

      {env.isDevelopment ? (
        <AppText variant="caption" color="tertiary" align="center">
          {apiError.code}
          {apiError.status ? ` · ${apiError.status}` : ''}
          {apiError.requestId ? ` · ${apiError.requestId}` : ''}
        </AppText>
      ) : null}

      {onRetry ? (
        <AppButton label="Réessayer" variant="secondary" onPress={onRetry} fullWidth={false} />
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
