import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { normalizeError } from '@/api/errors';
import { AppButton, AppCard, AppInput, AppText, ErrorView, LoadingView, Screen } from '@/components';
import {
  useAdminTaxiApplication,
  useApproveTaxiApplication,
  useRejectTaxiApplication,
} from '@/features/admin/taxi/queries';
import type { TaxiApplicationStatus, TaxiDocumentSlotId } from '@/features/taxi/types';
import { useLocale } from '@/localization/use-locale';
import { colors, radius, spacing } from '@/theme';
import { formatDateTime, parseIsoDate } from '@/utils/date';

const STATUS_LABEL: Record<TaxiApplicationStatus, string> = {
  pending: 'En attente',
  approved: 'Approuvée',
  rejected: 'Refusée',
};

const STATUS_COLOR: Record<TaxiApplicationStatus, string> = {
  pending: colors.status.warning,
  approved: colors.status.success,
  rejected: colors.status.error,
};

const DOCUMENT_LABELS: { key: TaxiDocumentSlotId; label: string }[] = [
  { key: 'driver_photo', label: 'Photo du chauffeur' },
  { key: 'vehicle_photo', label: 'Photo du taxi' },
  { key: 'licence_front', label: 'Permis (recto)' },
  { key: 'licence_back', label: 'Permis (verso)' },
  { key: 'cin_front', label: 'CIN (recto)' },
  { key: 'cin_back', label: 'CIN (verso)' },
];

/** One taxi driver application — identity, plate, documents, approve/reject. */
export default function AdminTaxiApplicationDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { data: application, isLoading, isError, error, refetch } = useAdminTaxiApplication(userId);
  const approve = useApproveTaxiApplication(userId);
  const reject = useRejectTaxiApplication(userId);
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
        <Stack.Screen options={{ title: 'Candidature chauffeur' }} />
        <LoadingView />
      </Screen>
    );
  }

  if (isError || !application) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'Candidature chauffeur' }} />
        <ErrorView error={error} onRetry={() => void refetch()} />
      </Screen>
    );
  }

  const submitted = parseIsoDate(application.submitted_at);
  const reviewed = parseIsoDate(application.reviewed_at);
  const isPending = application.status === 'pending';

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Candidature chauffeur' }} />

      <View style={styles.sections}>
        <AppCard style={styles.card}>
          <View style={styles.headerRow}>
            <AppText variant="subheading">{application.display_name}</AppText>
            <View style={[styles.badge, { backgroundColor: `${STATUS_COLOR[application.status]}1A` }]}>
              <AppText variant="caption" style={{ color: STATUS_COLOR[application.status] }}>
                {STATUS_LABEL[application.status]}
              </AppText>
            </View>
          </View>
          <AppText variant="bodySmall" color="secondary">
            {application.phone}
            {application.email ? ` · ${application.email}` : ''}
          </AppText>
          <AppText variant="bodySmall" color="secondary" style={styles.spaced}>
            Plaque : {application.plate_number}
          </AppText>
          {submitted ? (
            <AppText variant="caption" color="tertiary">
              Envoyée le {formatDateTime(submitted, locale)}
            </AppText>
          ) : null}
          {reviewed ? (
            <AppText variant="caption" color="tertiary">
              Traitée le {formatDateTime(reviewed, locale)}
            </AppText>
          ) : null}
          {application.status === 'rejected' && application.rejection_reason ? (
            <AppText variant="bodySmall" color="error" style={styles.spaced}>
              Motif : {application.rejection_reason}
            </AppText>
          ) : null}
        </AppCard>

        <View style={styles.documentGrid}>
          {DOCUMENT_LABELS.map(({ key, label }) => {
            const slot = application.documents[key];
            return (
              <AppCard key={key} style={styles.documentCard}>
                <AppText variant="label" color="secondary" style={styles.spaced}>
                  {label}
                </AppText>
                {slot.url ? (
                  <Image
                    source={{ uri: slot.url }}
                    style={styles.document}
                    contentFit="cover"
                    accessibilityLabel={label}
                  />
                ) : (
                  <View style={[styles.document, styles.documentPlaceholder]}>
                    <AppText variant="caption" color="tertiary" align="center">
                      {slot.upload_id ? 'Indisponible' : 'Non fourni'}
                    </AppText>
                  </View>
                )}
              </AppCard>
            );
          })}
        </View>

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
                  placeholder="Document illisible, plaque incohérente…"
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
  documentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  documentCard: {
    width: '47%',
  },
  document: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: radius.md,
    backgroundColor: colors.background.surface,
  },
  documentPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
  },
  actions: { gap: spacing.md },
  actionRow: { flexDirection: 'row', gap: spacing.md },
});
