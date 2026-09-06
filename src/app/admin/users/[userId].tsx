import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { normalizeError } from '@/api/errors';
import { AppButton, AppCard, AppInput, AppText, ErrorView, LoadingView, Screen } from '@/components';
import { useAdminUserDetail, useSetUserRole, useSetUserStatus } from '@/features/admin/users/queries';
import { useCurrentUser, useIsFullAdmin } from '@/features/profile/queries';
import { colors, radius, spacing } from '@/theme';
import type { UserRole, UserStatus, VerificationStatus } from '@/types/models';
import { formatDateTime, parseIsoDate } from '@/utils/date';

const STATUS_LABEL: Record<UserStatus, string> = {
  active: 'Actif',
  suspended: 'Suspendu',
  deleted: 'Supprimé',
};

const STATUS_COLOR: Record<UserStatus, string> = {
  active: colors.status.success,
  suspended: colors.status.warning,
  deleted: colors.status.error,
};

const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  none: 'Non fourni',
  pending: 'En cours',
  approved: 'Vérifié',
  rejected: 'Refusé',
};

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'rider', label: 'Passager' },
  { value: 'driver', label: 'Conducteur' },
  { value: 'both', label: 'Passager + conducteur' },
  { value: 'admin', label: 'Admin' },
  { value: 'support', label: 'Support' },
];

type StatusAction = 'suspend' | 'delete';

/** One user's profile — for `support`, read-only; for `admin`, status and role can change here too. */
export default function AdminUserDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { data: user, isLoading, isError, error, refetch } = useAdminUserDetail(userId);
  const { data: viewer } = useCurrentUser();
  const isFullAdmin = useIsFullAdmin();
  const setStatus = useSetUserStatus(userId);
  const setRole = useSetUserRole(userId);

  const [pendingAction, setPendingAction] = useState<StatusAction | null>(null);
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const isSelf = viewer?.id === userId;
  const canManage = isFullAdmin && !isSelf;

  function startAction(action: StatusAction) {
    setActionError(null);
    setReason('');
    setPendingAction(action);
  }

  async function confirmAction() {
    if (!pendingAction) return;
    setActionError(null);
    try {
      await setStatus.mutateAsync({
        status: pendingAction === 'delete' ? 'deleted' : 'suspended',
        reason: reason.trim() || undefined,
      });
      setPendingAction(null);
      setReason('');
    } catch (e) {
      setActionError(normalizeError(e).message);
    }
  }

  async function onReactivate() {
    setActionError(null);
    try {
      await setStatus.mutateAsync({ status: 'active' });
    } catch (e) {
      setActionError(normalizeError(e).message);
    }
  }

  async function onSetRole(role: UserRole) {
    setActionError(null);
    try {
      await setRole.mutateAsync(role);
    } catch (e) {
      setActionError(normalizeError(e).message);
    }
  }

  if (isLoading) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'Utilisateur' }} />
        <LoadingView />
      </Screen>
    );
  }

  if (isError || !user) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'Utilisateur' }} />
        <ErrorView error={error} onRetry={() => void refetch()} />
      </Screen>
    );
  }

  const memberSince = parseIsoDate(user.created_at);
  const lastSeen = parseIsoDate(user.last_seen_at);

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: user.display_name }} />

      <View style={styles.sections}>
        <AppCard style={styles.card}>
          <View style={styles.headerRow}>
            <AppText variant="subheading">{user.display_name}</AppText>
            <View style={[styles.badge, { backgroundColor: `${STATUS_COLOR[user.status]}1A` }]}>
              <AppText variant="caption" style={{ color: STATUS_COLOR[user.status] }}>
                {STATUS_LABEL[user.status]}
              </AppText>
            </View>
          </View>
          <Row label="Téléphone" value={`${user.phone}${user.phone_verified ? ' ✓' : ''}`} />
          <Row label="E-mail" value={user.email ? `${user.email}${user.email_verified ? ' ✓' : ''}` : '—'} />
          <Row label="Rôle" value={ROLE_OPTIONS.find((r) => r.value === user.role)?.label ?? user.role} />
          <Row label="Note" value={user.rating > 0 ? `★ ${user.rating.toFixed(2)}` : '—'} />
          <Row
            label="Trajets"
            value={`${user.trips_as_driver} en tant que conducteur · ${user.trips_as_rider} en tant que passager`}
          />
          <Row label="Avis reçus" value={String(user.reviews_count)} />
          <Row label="Code de parrainage" value={user.referral_code} />
          {memberSince ? <Row label="Membre depuis" value={formatDateTime(memberSince)} /> : null}
          {lastSeen ? <Row label="Dernière connexion" value={formatDateTime(lastSeen)} /> : null}
        </AppCard>

        <AppCard style={styles.card}>
          <AppText variant="label" color="secondary">
            Vérifications
          </AppText>
          <Row label="CIN" value={VERIFICATION_LABEL[user.verifications.cin]} />
          <Row label="Permis" value={VERIFICATION_LABEL[user.verifications.licence]} />
        </AppCard>

        {actionError ? (
          <AppText variant="bodySmall" color="error">
            {actionError}
          </AppText>
        ) : null}

        {isSelf ? (
          <AppText variant="caption" color="tertiary">
            Vous ne pouvez pas modifier votre propre statut ou rôle.
          </AppText>
        ) : !isFullAdmin ? (
          <AppText variant="caption" color="tertiary">
            Lecture seule — le rôle support ne peut pas modifier les comptes.
          </AppText>
        ) : null}

        {canManage ? (
          <>
            <AppCard style={styles.card}>
              <AppText variant="label" color="secondary" style={styles.cardTitle}>
                Rôle
              </AppText>
              <View style={styles.chipRow}>
                {ROLE_OPTIONS.map((option) => (
                  <AppButton
                    key={option.value}
                    label={option.label}
                    variant={user.role === option.value ? 'primary' : 'secondary'}
                    fullWidth={false}
                    disabled={user.role === option.value}
                    loading={setRole.isPending}
                    onPress={() => void onSetRole(option.value)}
                    style={styles.chipButton}
                  />
                ))}
              </View>
            </AppCard>

            <View style={styles.actions}>
              {pendingAction ? (
                <View style={styles.confirm}>
                  <AppText variant="bodySmall" color="secondary">
                    {pendingAction === 'delete'
                      ? 'Supprimer ce compte ? Il ne pourra plus se connecter. Ce n’est pas un effacement définitif des données.'
                      : 'Suspendre ce compte ? Il ne pourra plus se connecter jusqu’à réactivation.'}
                  </AppText>
                  <AppInput
                    label="Motif (optionnel)"
                    value={reason}
                    onChangeText={setReason}
                    placeholder="Signalements répétés, fraude…"
                    multiline
                  />
                  <View style={styles.confirmRow}>
                    <AppButton
                      label="Annuler"
                      variant="ghost"
                      fullWidth={false}
                      onPress={() => setPendingAction(null)}
                    />
                    <AppButton
                      label={pendingAction === 'delete' ? 'Supprimer' : 'Suspendre'}
                      variant="danger"
                      fullWidth={false}
                      loading={setStatus.isPending}
                      onPress={() => void confirmAction()}
                    />
                  </View>
                </View>
              ) : (
                <>
                  {user.status !== 'active' ? (
                    <AppButton
                      label="Réactiver le compte"
                      variant="secondary"
                      loading={setStatus.isPending}
                      onPress={() => void onReactivate()}
                    />
                  ) : (
                    <AppButton
                      label="Suspendre le compte"
                      variant="danger"
                      onPress={() => startAction('suspend')}
                    />
                  )}
                  {user.status !== 'deleted' ? (
                    <AppButton
                      label="Supprimer le compte"
                      variant="ghost"
                      onPress={() => startAction('delete')}
                    />
                  ) : null}
                </>
              )}
            </View>
          </>
        ) : null}
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <AppText variant="bodySmall" color="tertiary">
        {label}
      </AppText>
      <AppText variant="bodySmall" style={styles.rowValue}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  sections: { gap: spacing.lg, paddingTop: spacing.md },
  card: { gap: spacing.xs },
  cardTitle: { marginBottom: spacing.xs },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.xxs,
  },
  rowValue: { flex: 1, textAlign: 'right' },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chipButton: { marginBottom: 0 },
  actions: { gap: spacing.sm },
  confirm: { gap: spacing.sm },
  confirmRow: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' },
});
