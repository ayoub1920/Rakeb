import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { normalizeError } from '@/api/errors';
import { AppButton, AppInput, AppText, Screen, ScreenHeader } from '@/components';
import { useForgotPassword } from '@/features/auth/queries';
import { forgotPasswordFormSchema, type ForgotPasswordFormValues } from '@/features/auth/schemas';
import { colors, radius, spacing } from '@/theme';

export default function ForgotPasswordScreen() {
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const forgotPassword = useForgotPassword();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setFormError(null);

    try {
      await forgotPassword.mutateAsync(values);
      setSentTo(values.email);
    } catch (error) {
      setFormError(normalizeError(error).message);
    }
  }

  if (sentTo) {
    return (
      <Screen scrollable>
        <ScreenHeader title="Mot de passe oublié" showBack />

        <View style={styles.confirmation}>
          <View style={styles.confirmationIcon}>
            <AppText variant="heading" color="brand">
              ✓
            </AppText>
          </View>
          <AppText variant="heading" align="center" style={styles.confirmationTitle}>
            Vérifiez votre boîte mail
          </AppText>
          <AppText variant="body" color="secondary" align="center" style={styles.confirmationBody}>
            Si un compte existe pour {sentTo}, un lien de réinitialisation vient d’être envoyé.
          </AppText>

          <AppButton
            label="Retour à la connexion"
            variant="secondary"
            onPress={() => router.back()}
            style={styles.confirmationAction}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <ScreenHeader
        title="Mot de passe oublié"
        subtitle="On vous envoie un lien pour créer un nouveau mot de passe."
        showBack
      />

      <View style={styles.fields}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label="Email"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
              placeholder="vous@exemple.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSubmit(onSubmit)}
            />
          )}
        />
      </View>

      {formError ? (
        <AppText variant="bodySmall" color="error" style={styles.formError}>
          {formError}
        </AppText>
      ) : null}

      <AppButton
        label="Envoyer le lien"
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting || forgotPassword.isPending}
        style={styles.submit}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  fields: {
    marginTop: spacing.lg,
  },
  formError: {
    marginTop: spacing.md,
  },
  submit: {
    marginTop: spacing.xl,
  },
  confirmation: {
    marginTop: spacing.xxl,
    alignItems: 'center',
  },
  confirmationIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmationTitle: {
    marginTop: spacing.lg,
  },
  confirmationBody: {
    marginTop: spacing.sm,
    maxWidth: 320,
  },
  confirmationAction: {
    marginTop: spacing.xxl,
  },
});
