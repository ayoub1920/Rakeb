import * as ImagePicker from 'expo-image-picker';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { getFieldError, normalizeError } from '@/api/errors';
import { AppButton, AppCard, AppText, ErrorView, LoadingView, Screen } from '@/components';
import { licenceActionLabel, LICENCE_COPY } from '@/features/profile/licence-copy';
import { useSubmitLicence, useVerifications } from '@/features/profile/queries';
import { colors, radius, spacing } from '@/theme';
import type { VerificationStatus } from '@/types/models';

const STATUS_LABEL: Record<VerificationStatus, string> = {
  none: 'Non fourni',
  pending: 'En cours',
  approved: 'Vérifié',
  rejected: 'Refusé',
};

const STATUS_COLOR: Record<VerificationStatus, string> = {
  none: colors.text.tertiary,
  pending: colors.status.warning,
  approved: colors.status.success,
  rejected: colors.status.error,
};

/**
 * Vérifications — phone / email / CIN are read-only status rows; the licence
 * is the one that gates publishing, so it carries the submission workflow.
 *
 * `API Rakeb.md` §2: `GET /me/verifications`, `POST /me/verifications/licence`.
 * CIN submission (`POST /me/verifications/cin`) is out of scope here — it does
 * not gate anything yet — and stays a read-only row until that flow is built.
 */
export default function VerificationsScreen() {
  const { data: verifications, isLoading, isError, error, refetch } = useVerifications();
  const submitLicence = useSubmitLicence();
  const [pickerError, setPickerError] = useState<string | null>(null);

  async function onSendLicence() {
    setPickerError(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPickerError('Autorisez l’accès à vos photos pour envoyer votre permis.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });
    if (result.canceled || result.assets.length === 0) return;

    const asset = result.assets[0]!;
    // 10 MB — generous for a photo, tight enough to reject a wrong file fast.
    if (asset.fileSize != null && asset.fileSize > 10 * 1024 * 1024) {
      setPickerError('Le fichier est trop volumineux (10 Mo maximum).');
      return;
    }

    try {
      await submitLicence.mutateAsync({
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
      });
    } catch (e) {
      setPickerError(getFieldError(e, 'document') ?? normalizeError(e).message);
    }
  }

  if (isLoading) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'Vérifications' }} />
        <LoadingView />
      </Screen>
    );
  }

  if (isError || !verifications) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'Vérifications' }} />
        <ErrorView error={error} onRetry={() => void refetch()} />
      </Screen>
    );
  }

  const licence = verifications.licence;
  const canSubmit = licence === 'none' || licence === 'rejected';

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Vérifications' }} />

      <View style={styles.sections}>
        <AppCard padded={false}>
          <StatusRow label="Téléphone" status={verifications.phone} />
          <Separator />
          <StatusRow label="E-mail" status={verifications.email} />
          <Separator />
          <StatusRow label="CIN" status={verifications.cin} />
        </AppCard>

        <AppCard style={styles.card}>
          <View style={styles.licenceHeader}>
            <AppText variant="subheading">Permis de conduire</AppText>
            <StatusBadge status={licence} />
          </View>

          {licence !== 'approved' ? (
            <AppText variant="bodySmall" color="secondary" style={styles.cardBody}>
              {LICENCE_COPY[licence].body}
            </AppText>
          ) : (
            <AppText variant="bodySmall" color="secondary" style={styles.cardBody}>
              Votre permis est vérifié — vous pouvez publier des trajets.
            </AppText>
          )}

          {licence === 'rejected' && verifications.licence_rejection_reason ? (
            <AppText variant="caption" color="error" style={styles.cardBody}>
              Motif : {verifications.licence_rejection_reason}
            </AppText>
          ) : null}

          {pickerError ? (
            <AppText variant="caption" color="error" style={styles.cardBody}>
              {pickerError}
            </AppText>
          ) : null}

          {canSubmit ? (
            <AppButton
              label={licenceActionLabel(licence)}
              loading={submitLicence.isPending}
              onPress={() => void onSendLicence()}
              style={styles.cardBody}
            />
          ) : null}
        </AppCard>
      </View>
    </Screen>
  );
}

function StatusRow({ label, status }: { label: string; status: VerificationStatus }) {
  return (
    <View style={styles.row}>
      <AppText variant="body">{label}</AppText>
      <AppText variant="bodySmall" style={{ color: STATUS_COLOR[status] }}>
        {STATUS_LABEL[status]}
      </AppText>
    </View>
  );
}

function StatusBadge({ status }: { status: VerificationStatus }) {
  return (
    <View style={[styles.badge, { backgroundColor: `${STATUS_COLOR[status]}1A` }]}>
      <AppText variant="caption" style={{ color: STATUS_COLOR[status] }}>
        {STATUS_LABEL[status]}
      </AppText>
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  sections: { gap: spacing.xl, paddingTop: spacing.md },
  card: { gap: spacing.xs },
  cardBody: { marginTop: spacing.xs },
  licenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
    marginLeft: spacing.lg,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
  },
});
