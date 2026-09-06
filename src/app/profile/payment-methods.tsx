import { Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { normalizeError } from '@/api/errors';
import { AppButton, AppCard, AppInput, AppText, ErrorView, LoadingView, Screen } from '@/components';
import {
  useAddCard,
  useAddMobileMoney,
  useDeletePaymentMethod,
  usePaymentMethods,
  useUpdatePaymentMethod,
} from '@/features/payments/queries';
import { colors, radius, spacing } from '@/theme';
import type { MobileMoneyProvider, PaymentMethod } from '@/types/models';

const PROVIDERS: { value: MobileMoneyProvider; label: string }[] = [
  { value: 'd17', label: 'D17' },
  { value: 'e_dinar', label: 'e-DINAR' },
  { value: 'flouci', label: 'Flouci' },
];

type AddMode = 'card' | 'mobile' | null;

/** Moyens de paiement — cards (PSP token), mobile money, plus the built-in cash and wallet. */
export default function PaymentMethodsScreen() {
  const { data: methods, isLoading, isError, error, refetch } = usePaymentMethods();
  const setDefault = useUpdatePaymentMethod();
  const remove = useDeletePaymentMethod();
  const addCard = useAddCard();
  const addMobile = useAddMobileMoney();

  const [mode, setMode] = useState<AddMode>(null);
  const [token, setToken] = useState('');
  const [label, setLabel] = useState('');
  const [provider, setProvider] = useState<MobileMoneyProvider>('d17');
  const [msisdn, setMsisdn] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  function resetForm() {
    setMode(null);
    setToken('');
    setLabel('');
    setMsisdn('');
    setProvider('d17');
    setActionError(null);
  }

  async function submitCard() {
    setActionError(null);
    if (!token.trim()) {
      setActionError('Collez le jeton fourni par le prestataire de paiement.');
      return;
    }
    try {
      await addCard.mutateAsync({ provider_token: token.trim(), label: label.trim() || undefined });
      resetForm();
    } catch (e) {
      setActionError(normalizeError(e).message);
    }
  }

  async function submitMobile() {
    setActionError(null);
    if (!msisdn.trim()) {
      setActionError('Indiquez le numéro de téléphone associé.');
      return;
    }
    try {
      await addMobile.mutateAsync({ provider, msisdn: msisdn.trim() });
      resetForm();
    } catch (e) {
      setActionError(normalizeError(e).message);
    }
  }

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Moyens de paiement' }} />

      {isLoading ? (
        <LoadingView />
      ) : isError || !methods ? (
        <ErrorView error={error} onRetry={() => void refetch()} />
      ) : (
        <View style={styles.sections}>
          <View style={styles.list}>
            {methods.map((method) => (
              <MethodRow
                key={method.id}
                method={method}
                onSetDefault={() =>
                  setDefault.mutate({ id: method.id, is_default: true })
                }
                onDelete={() => remove.mutate(method.id)}
                busy={setDefault.isPending || remove.isPending}
              />
            ))}
          </View>

          {mode === null ? (
            <View style={styles.addButtons}>
              <AppButton label="Ajouter une carte" variant="secondary" onPress={() => setMode('card')} />
              <AppButton
                label="Ajouter mobile money"
                variant="secondary"
                onPress={() => setMode('mobile')}
              />
            </View>
          ) : (
            <AppCard style={styles.form}>
              {mode === 'card' ? (
                <>
                  <AppText variant="label">Nouvelle carte</AppText>
                  <AppText variant="caption" color="tertiary">
                    Le numéro de carte n’est jamais saisi ici. Collez le jeton du prestataire de
                    paiement (en développement, `tok_visa_4242`).
                  </AppText>
                  <AppInput
                    label="Jeton du prestataire"
                    value={token}
                    onChangeText={setToken}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="tok_…"
                  />
                  <AppInput
                    label="Libellé (optionnel)"
                    value={label}
                    onChangeText={setLabel}
                    placeholder="Carte perso"
                  />
                  <View style={styles.formActions}>
                    <AppButton label="Annuler" variant="ghost" fullWidth={false} onPress={resetForm} />
                    <AppButton
                      label="Ajouter"
                      fullWidth={false}
                      loading={addCard.isPending}
                      onPress={() => void submitCard()}
                    />
                  </View>
                </>
              ) : (
                <>
                  <AppText variant="label">Mobile money</AppText>
                  <View style={styles.segment}>
                    {PROVIDERS.map((p) => {
                      const active = provider === p.value;
                      return (
                        <Pressable
                          key={p.value}
                          onPress={() => setProvider(p.value)}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                          style={[styles.segmentItem, active && styles.segmentItemActive]}
                        >
                          <AppText variant="label" color={active ? 'inverse' : 'secondary'}>
                            {p.label}
                          </AppText>
                        </Pressable>
                      );
                    })}
                  </View>
                  <AppInput
                    label="Numéro de téléphone"
                    value={msisdn}
                    onChangeText={setMsisdn}
                    keyboardType="phone-pad"
                    placeholder="+216 98 123 456"
                  />
                  <View style={styles.formActions}>
                    <AppButton label="Annuler" variant="ghost" fullWidth={false} onPress={resetForm} />
                    <AppButton
                      label="Ajouter"
                      fullWidth={false}
                      loading={addMobile.isPending}
                      onPress={() => void submitMobile()}
                    />
                  </View>
                </>
              )}
              {actionError ? (
                <AppText variant="caption" color="error">
                  {actionError}
                </AppText>
              ) : null}
            </AppCard>
          )}
        </View>
      )}
    </Screen>
  );
}

function MethodRow({
  method,
  onSetDefault,
  onDelete,
  busy,
}: {
  method: PaymentMethod;
  onSetDefault: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <AppCard style={styles.row}>
      <View style={styles.rowHead}>
        <View style={styles.rowText}>
          <AppText variant="label">{method.label}</AppText>
          {method.detail ? (
            <AppText variant="caption" color="tertiary">
              {method.detail}
            </AppText>
          ) : null}
        </View>
        {method.is_default ? (
          <View style={styles.badge}>
            <AppText variant="caption" color="brand">
              Par défaut
            </AppText>
          </View>
        ) : null}
      </View>

      {!method.builtin ? (
        <View style={styles.rowActions}>
          {!method.is_default ? (
            <AppButton
              label="Définir par défaut"
              variant="ghost"
              fullWidth={false}
              disabled={busy}
              onPress={onSetDefault}
            />
          ) : null}
          {confirmDelete ? (
            <>
              <AppButton
                label="Garder"
                variant="ghost"
                fullWidth={false}
                onPress={() => setConfirmDelete(false)}
              />
              <AppButton
                label="Supprimer"
                variant="danger"
                fullWidth={false}
                disabled={busy}
                onPress={onDelete}
              />
            </>
          ) : (
            <AppButton
              label="Supprimer"
              variant="ghost"
              fullWidth={false}
              onPress={() => setConfirmDelete(true)}
            />
          )}
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  sections: { gap: spacing.lg, paddingTop: spacing.md },
  list: { gap: spacing.sm },
  row: { gap: spacing.sm },
  rowHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  rowText: { flex: 1, gap: spacing.xxs },
  rowActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'flex-end' },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primarySurface,
  },
  addButtons: { gap: spacing.sm },
  form: { gap: spacing.sm },
  formActions: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' },
  segment: {
    flexDirection: 'row',
    borderRadius: radius.md,
    backgroundColor: colors.background.surface,
    padding: spacing.xxs,
  },
  segmentItem: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: 'center' },
  segmentItemActive: { backgroundColor: colors.brand.primary },
});
