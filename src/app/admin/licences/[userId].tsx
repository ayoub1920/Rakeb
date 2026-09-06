import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { normalizeError } from '@/api/errors';
import { AppButton, AppCard, AppInput, AppText, ErrorView, LoadingView, Screen } from '@/components';
import {
  useApproveLicenceVerification,
  useLicenceVerification,
  useRejectLicenceVerification,
} from '@/features/admin/licences/queries';
import { useLocale } from '@/localization/use-locale';
import { colors, radius, spacing } from '@/theme';
import type { LicenceReviewStatus } from '@/types/models';
import { formatDateTime, parseIsoDate } from '@/utils/date';

const STATUS_LABEL: Record<LicenceReviewStatus, string> = {
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Refusé',
};

const STATUS_COLOR: Record<LicenceReviewStatus, string> = {
  pending: colors.status.warning,
  approved: colors.status.success,
  rejected: colors.status.error,
};

/** One submission — the document, the applicant, and the approve/reject actions. */
export default function AdminLicenceDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { data: verification, isLoading, isError, error, refetch } = useLicenceVerification(userId);
  const approve = useApproveLicenceVerification(userId);
  const reject = useRejectLicenceVerification(userId);
  const { locale } = useLocale();

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  async function onApprove() {
    setActionError(null);
    try {
      await approve.mutateAsync();
    } catch (e) {
      setActionError(normalizeError(e).message);
    }
  }

  async function onReject() {
    setActionError(null);
    if (!reason.trim()) {
      setActionError('Indiquez le motif du refus.');
      return;
    }
    try {
      await reject.mutateAsync(reason.trim());
      setShowRejectForm(false);
      setReason('');
    } catch (e) {
      setActionError(normalizeError(e).message);
    }
  }

  if (isLoading) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'Vérification' }} />
        <LoadingView />
      </Screen>
    );
  }

  if (isError || !verification) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'Vérification' }} />
        <ErrorView error={error} onRetry={() => void refetch()} />
      </Screen>
    );
  }

  const submitted = parseIsoDate(verification.submitted_at);
  const reviewed = parseIsoDate(verification.reviewed_at);
  const isPending = verification.status === 'pending';

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Vérification' }} />

      <View style={styles.sections}>
        <AppCard style={styles.card}>
          <View style={styles.headerRow}>
            <AppText variant="subheading">{verification.user.display_name}</AppText>
            <View style={[styles.badge, { backgroundColor: `${STATUS_COLOR[verification.status]}1A` }]}>
              <AppText variant="caption" style={{ color: STATUS_COLOR[verification.status] }}>
                {STATUS_LABEL[verification.status]}
              </AppText>
            </View>
          </View>
          <AppText variant="bodySmall" color="secondary">
            {verification.user.phone}
          </AppText>
          {submitted ? (
            <AppText variant="caption" color="tertiary">
              Envoyé le {formatDateTime(submitted, locale)}
            </AppText>
          ) : null}
          {reviewed ? (
            <AppText variant="caption" color="tertiary">
              Traité le {formatDateTime(reviewed, locale)}
            </AppText>
          ) : null}
          {verification.status === 'rejected' && verification.rejection_reason ? (
            <AppText variant="bodySmall" color="error" style={styles.spaced}>
              Motif : {verification.rejection_reason}
            </AppText>
          ) : null}
        </AppCard>

        <AppCard>
          <AppText variant="label" color="secondary" style={styles.spaced}>
            Document
          </AppText>
          {verification.front_document_url ? (
            <Image
              source={{ uri: verification.front_document_url }}
              style={styles.document}
              contentFit="contain"
              accessibilityLabel="Photo du permis de conduire"
            />
          ) : (
            <View style={[styles.document, styles.documentPlaceholder]}>
              <AppText variant="bodySmall" color="tertiary" align="center">
                Document indisponible — le fichier n’a peut-être pas fini de se téléverser.
              </AppText>
            </View>
          )}
        </AppCard>

        {actionError ? (
          <AppText variant="bodySmall" color="error">
            {actionError}
          </AppText>
        ) : null}

        {isPending ? (
          <View style={styles.actions}>
            {showRejectForm ? (
              <>
                <AppInput
                  label="Motif du refus"
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Photo illisible, permis expiré…"
                  multiline
                />
                <View style={styles.actionRow}>
                  <AppButton
                    label="Annuler"
                    variant="ghost"
                    fullWidth={false}
                    onPress={() => {
                      setShowRejectForm(false);
                      setReason('');
                      setActionError(null);
                    }}
                  />
                  <AppButton
                    label="Confirmer le refus"
                    variant="danger"
                    fullWidth={false}
                    loading={reject.isPending}
                    onPress={() => void onReject()}
                  />
                </View>
              </>
            ) : (
              <View style={styles.actionRow}>
                <AppButton
                  label="Refuser"
                  variant="danger"
                  fullWidth={false}
                  onPress={() => setShowRejectForm(true)}
                />
                <AppButton
                  label="Approuver"
                  fullWidth={false}
                  loading={approve.isPending}
                  onPress={() => void onApprove()}
                />
              </View>
            )}
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: { gap: spacing.lg, paddingTop: spacing.md },
  card: { gap: spacing.xxs },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spaced: { marginTop: spacing.sm },
  document: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: radius.md,
    backgroundColor: colors.background.surface,
  },
  documentPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
  },
  actions: { gap: spacing.md },
  actionRow: { flexDirection: 'row', gap: spacing.md },
});
