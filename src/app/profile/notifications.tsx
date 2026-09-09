import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { AppButton, AppCard, AppText, ErrorView, LoadingView, Screen } from '@/components';
import { syncDeviceRegistration } from '@/features/notifications/device-registration';
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from '@/features/notifications/queries';
import type { NotificationSettings } from '@/features/notifications/api';
import { notificationService } from '@/services/notifications/notification-service';
import type { NotificationPermissionStatus } from '@/services/notifications/types';
import { colors, spacing } from '@/theme';

const EVENT_ROWS: { key: keyof NotificationSettings; label: string; hint: string }[] = [
  {
    key: 'booking_accepted',
    label: 'Réservation acceptée',
    hint: 'Quand un conducteur accepte votre demande',
  },
  { key: 'new_message', label: 'Nouveau message', hint: 'Quand quelqu’un vous écrit' },
  {
    key: 'departure_reminder',
    label: 'Rappel de départ',
    hint: 'La veille et une heure avant le trajet',
  },
  {
    key: 'trip_alerts',
    label: 'Alertes trajet',
    hint: 'Quand une place se libère sur un trajet suivi',
  },
  { key: 'marketing', label: 'Actualités Rakeb', hint: 'Offres et nouveautés' },
];

const CHANNEL_ROWS: { key: keyof NotificationSettings; label: string }[] = [
  { key: 'push_enabled', label: 'Notifications push' },
  { key: 'email_enabled', label: 'E-mail' },
  { key: 'sms_enabled', label: 'SMS' },
];

/** Paramètres de notification — `GET · PUT /me/notification-settings` + OS permission. */
export default function NotificationSettingsScreen() {
  const { data, isLoading, isError, error, refetch } = useNotificationSettings();
  const update = useUpdateNotificationSettings();
  const [permission, setPermission] = useState<NotificationPermissionStatus>('undetermined');

  useEffect(() => {
    void notificationService.getPermissionStatus().then(setPermission);
  }, []);

  async function requestPermission() {
    const status = await notificationService.requestPermission();
    setPermission(status);
    if (status === 'granted') void syncDeviceRegistration();
  }

  function toggle(key: keyof NotificationSettings, value: boolean) {
    if (!data) return;
    update.mutate({ ...data, [key]: value });
  }

  if (isLoading || !data) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'Notifications' }} />
        {isError ? <ErrorView error={error} onRetry={() => void refetch()} /> : <LoadingView />}
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Notifications' }} />

      <View style={styles.sections}>
        {permission !== 'granted' ? (
          <AppCard style={styles.card}>
            <AppText variant="subheading">Autoriser les notifications</AppText>
            <AppText variant="bodySmall" color="secondary">
              Recevez une alerte dès qu’un conducteur accepte votre demande, qu’un passager vous
              écrit, ou avant chaque départ — même quand l’application est fermée.
            </AppText>
            <AppButton
              label={permission === 'denied' ? 'Ouvrir les réglages' : 'Activer'}
              onPress={() => void requestPermission()}
            />
            {permission === 'denied' ? (
              <AppText variant="caption" color="tertiary">
                Les notifications sont bloquées. Activez-les dans les réglages du téléphone.
              </AppText>
            ) : null}
          </AppCard>
        ) : null}

        <AppCard style={styles.card}>
          <AppText variant="label" color="secondary">
            Me prévenir pour
          </AppText>
          {EVENT_ROWS.map((row) => (
            <ToggleRow
              key={row.key}
              label={row.label}
              hint={row.hint}
              value={data[row.key]}
              onChange={(v) => toggle(row.key, v)}
            />
          ))}
        </AppCard>

        <AppCard style={styles.card}>
          <AppText variant="label" color="secondary">
            Canaux
          </AppText>
          {CHANNEL_ROWS.map((row) => (
            <ToggleRow
              key={row.key}
              label={row.label}
              value={data[row.key]}
              onChange={(v) => toggle(row.key, v)}
            />
          ))}
        </AppCard>

        {update.isError ? (
          <AppText variant="bodySmall" color="error">
            La modification n’a pas pu être enregistrée. Réessayez.
          </AppText>
        ) : null}
      </View>
    </Screen>
  );
}

function ToggleRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <AppText variant="body">{label}</AppText>
        {hint ? (
          <AppText variant="caption" color="tertiary">
            {hint}
          </AppText>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.brand.primary, false: colors.border.strong }}
        thumbColor={colors.background.default}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sections: { gap: spacing.md, paddingTop: spacing.md },
  card: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  rowText: { flex: 1, gap: spacing.xxs },
});
