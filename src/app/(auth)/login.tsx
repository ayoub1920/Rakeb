import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';

import { getFieldError, normalizeError } from '@/api/errors';
import { AppButton, AppInput, AppText, Screen, ScreenHeader } from '@/components';
import { useLogin } from '@/features/auth/queries';
import { loginFormSchema, type LoginFormValues } from '@/features/auth/schemas';
import { colors, sizes, spacing } from '@/theme';

export default function LoginScreen() {
  const [formError, setFormError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const login = useLogin();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);

    try {
      await login.mutateAsync(values);
      router.replace('/(tabs)');
    } catch (error) {
      const emailError = getFieldError(error, 'email');
      const passwordError = getFieldError(error, 'password');
      if (emailError) {
        setError('email', { message: emailError });
      } else if (passwordError) {
        setError('password', { message: passwordError });
      } else {
        setFormError(normalizeError(error).message);
      }
    }
  }

  return (
    <Screen scrollable>
      <ScreenHeader title="Connexion" subtitle="Email et mot de passe" showBack />

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
              returnKeyType="next"
              autoFocus
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label="Mot de passe"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
              placeholder="••••••••"
              secureTextEntry={!passwordVisible}
              autoCapitalize="none"
              autoComplete="current-password"
              returnKeyType="done"
              onSubmitEditing={handleSubmit(onSubmit)}
              rightAccessory={
                <Pressable
                  onPress={() => setPasswordVisible((visible) => !visible)}
                  accessibilityRole="button"
                  accessibilityLabel={passwordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  hitSlop={sizes.hitSlop}
                >
                  <AppText variant="label" color="brand">
                    {passwordVisible ? 'Masquer' : 'Afficher'}
                  </AppText>
                </Pressable>
              }
            />
          )}
        />
      </View>

      <AppButton
        label="Mot de passe oublié"
        variant="ghost"
        onPress={() => router.push('/(auth)/forgot-password')}
        style={styles.forgot}
      />

      {formError ? (
        <AppText variant="bodySmall" color="error" style={styles.formError}>
          {formError}
        </AppText>
      ) : null}

      <AppButton
        label="Se connecter"
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting || login.isPending}
        style={styles.submit}
      />

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <AppText variant="caption" color="tertiary">
          ou
        </AppText>
        <View style={styles.dividerLine} />
      </View>

      <AppButton
        label="Recevoir un code par SMS"
        variant="secondary"
        onPress={() => router.replace('/(auth)/phone')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  fields: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  forgot: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  formError: {
    marginTop: spacing.sm,
  },
  submit: {
    marginTop: spacing.xl,
  },
  divider: {
    marginVertical: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
  },
});
