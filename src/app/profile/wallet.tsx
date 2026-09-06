import { Stack } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { flattenPages } from '@/api/pagination';
import { normalizeError } from '@/api/errors';
import { AppButton, AppCard, AppInput, AppText, EmptyView, ErrorView, LoadingView, Screen } from '@/components';
import { usePaymentMethods } from '@/features/payments/queries';
import { useTopupWallet, useWalletBalance, useWalletTransactions, useWithdrawFromWallet } from '@/features/wallet/queries';
import { colors, radius, spacing } from '@/theme';
import type { PaymentMethod, WalletTransaction, WalletTransactionType } from '@/types/models';
import { formatDateTime, parseIsoDate } from '@/utils/date';
import { dinarsToMillimes, formatMillimes } from '@/utils/money';

const TXN_LABEL: Record<WalletTransactionType, string> = {
  trip_earning: 'Revenu de trajet',
  trip_payment: 'Paiement de trajet',
  topup: 'Recharge',
  withdrawal: 'Retrait',
  refund: 'Remboursement',
  referral_credit: 'Parrainage',
  tip: 'Pourboire',
  adjustment: 'Ajustement',
};

type Panel = 'topup' | 'withdraw' | null;

/** Portefeuille — balance, top-up, withdraw, and the ledger. */
export default function WalletScreen() {
  const balance = useWalletBalance();
  const txns = useWalletTransactions();
  const { data: methods } = usePaymentMethods();
  const topup = useTopupWallet();
  const withdraw = useWithdrawFromWallet();

  const [panel, setPanel] = useState<Panel>(null);
  const [amount, setAmount] = useState('');
  const [methodId, setMethodId] = useState<string | null>(null);
  const [rib, setRib] = useState('');
  const [panelError, setPanelError] = useState<string | null>(null);

  const fundingMethods = (methods ?? []).filter(
    (m) => m.kind === 'card' || m.kind === 'mobile_money',
  );
  const rows = flattenPages(txns.data);

  function reset() {
    setPanel(null);
    setAmount('');
    setMethodId(null);
    setRib('');
    setPanelError(null);
  }

  async function submitTopup() {
    setPanelError(null);
    const millimes = dinarsToMillimes(Number(amount.replace(',', '.')));
    if (!Number.isFinite(millimes) || millimes < 1000) {
      setPanelError('Montant minimum : 1 DT.');
      return;
    }
    if (!methodId) {
      setPanelError('Choisissez un moyen de paiement.');
      return;
    }
    try {
      await topup.mutateAsync({ amount: millimes, paymentMethodId: methodId });
      reset();
    } catch (e) {
      setPanelError(normalizeError(e).message);
    }
  }

  async function submitWithdraw() {
    setPanelError(null);
    const millimes = dinarsToMillimes(Number(amount.replace(',', '.')));
    if (!Number.isFinite(millimes) || millimes < 1000) {
      setPanelError('Montant minimum : 1 DT.');
      return;
    }
    if (rib.trim().length < 8) {
      setPanelError('Saisissez un RIB valide.');
      return;
    }
    try {
      await withdraw.mutateAsync({ amount: millimes, destination_type: 'rib', rib: rib.trim() });
      reset();
    } catch (e) {
      setPanelError(normalizeError(e).message);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Portefeuille' }} />

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (txns.hasNextPage && !txns.isFetchingNextPage) void txns.fetchNextPage();
        }}
        refreshing={txns.isFetching && !txns.isFetchingNextPage}
        onRefresh={() => {
          void balance.refetch();
          void txns.refetch();
        }}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            {balance.isLoading ? (
              <LoadingView fullscreen={false} />
            ) : balance.isError || !balance.data ? (
              <ErrorView error={balance.error} onRetry={() => void balance.refetch()} />
            ) : (
              <AppCard style={styles.balanceCard}>
                <AppText variant="caption" color="tertiary">
                  Solde disponible
                </AppText>
                <AppText variant="title" color="brand">
                  {formatMillimes(balance.data.available)}
                </AppText>
                {balance.data.pending > 0 ? (
                  <AppText variant="caption" color="tertiary">
                    {formatMillimes(balance.data.pending)} en attente de déblocage
                  </AppText>
                ) : null}
              </AppCard>
            )}

            {panel === null ? (
              <View style={styles.actions}>
                <AppButton label="Recharger" variant="secondary" onPress={() => setPanel('topup')} />
                <AppButton label="Retirer" variant="secondary" onPress={() => setPanel('withdraw')} />
              </View>
            ) : (
              <AppCard style={styles.form}>
                <AppText variant="label">
                  {panel === 'topup' ? 'Recharger le portefeuille' : 'Retirer vers un RIB'}
                </AppText>
                <AppInput
                  label="Montant (DT)"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="20"
                />

                {panel === 'topup' ? (
                  fundingMethods.length === 0 ? (
                    <AppText variant="caption" color="tertiary">
                      Ajoutez d’abord une carte ou un compte mobile money dans « Moyens de paiement ».
                    </AppText>
                  ) : (
                    <View style={styles.methodPicker}>
                      {fundingMethods.map((m: PaymentMethod) => {
                        const active = methodId === m.id;
                        return (
                          <Pressable
                            key={m.id}
                            onPress={() => setMethodId(m.id)}
                            accessibilityRole="button"
                            accessibilityState={{ selected: active }}
                            style={[styles.methodChip, active && styles.methodChipActive]}
                          >
                            <AppText variant="caption" color={active ? 'inverse' : 'secondary'}>
                              {m.label}
                            </AppText>
                          </Pressable>
                        );
                      })}
                    </View>
                  )
                ) : (
                  <AppInput
                    label="RIB"
                    value={rib}
                    onChangeText={setRib}
                    autoCapitalize="characters"
                    placeholder="TN59 …"
                  />
                )}

                {panelError ? (
                  <AppText variant="caption" color="error">
                    {panelError}
                  </AppText>
                ) : null}

                <View style={styles.formActions}>
                  <AppButton label="Annuler" variant="ghost" fullWidth={false} onPress={reset} />
                  <AppButton
                    label={panel === 'topup' ? 'Recharger' : 'Demander le retrait'}
                    fullWidth={false}
                    loading={topup.isPending || withdraw.isPending}
                    onPress={() => void (panel === 'topup' ? submitTopup() : submitWithdraw())}
                  />
                </View>
              </AppCard>
            )}

            <AppText variant="label" color="secondary" style={styles.ledgerTitle}>
              Historique
            </AppText>
          </View>
        }
        ListEmptyComponent={
          txns.isLoading ? (
            <LoadingView fullscreen={false} />
          ) : txns.isError ? (
            <ErrorView error={txns.error} onRetry={() => void txns.refetch()} />
          ) : (
            <EmptyView title="Aucune opération" description="Vos revenus et paiements apparaîtront ici." />
          )
        }
        renderItem={({ item }) => <TransactionRow txn={item} />}
      />
    </Screen>
  );
}

function TransactionRow({ txn }: { txn: WalletTransaction }) {
  const at = parseIsoDate(txn.created_at);
  const credit = txn.amount >= 0;

  return (
    <View style={styles.txnRow}>
      <View style={styles.txnText}>
        <AppText variant="bodySmall">{txn.description || TXN_LABEL[txn.type]}</AppText>
        <AppText variant="caption" color="tertiary">
          {at ? formatDateTime(at) : ''}
          {txn.status === 'pending' ? ' · en attente' : ''}
        </AppText>
      </View>
      <AppText variant="bodySmall" color={credit ? 'success' : 'primary'}>
        {credit ? '+' : ''}
        {formatMillimes(txn.amount)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing.xxl },
  header: { gap: spacing.lg, paddingTop: spacing.md },
  balanceCard: { gap: spacing.xxs },
  actions: { flexDirection: 'row', gap: spacing.sm },
  form: { gap: spacing.sm },
  formActions: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' },
  methodPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  methodChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.background.surface,
  },
  methodChipActive: { backgroundColor: colors.brand.primary },
  ledgerTitle: { marginTop: spacing.sm },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
  },
  txnText: { flex: 1, gap: spacing.xxs },
});
