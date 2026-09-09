import { zodResolver } from '@hookform/resolvers/zod';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';

import { getFieldError, normalizeError } from '@/api/errors';
import { AppButton, AppInput, AppText, Screen } from '@/components';
import { useRegister } from '@/features/auth/queries';
import {
  getPasswordStrength,
  registerFormSchema,
  type PasswordStrength,
  type RegisterFormValues,
} from '@/features/auth/schemas';
import { colors, radius, sizes, spacing } from '@/theme';

/** Step 3 of the onboarding flow's 6 progress segments — see `phone.tsx`. */
const CURRENT_STEP = 3;
const TOTAL_STEPS = 3;

const STRENGTH_LABEL: Record<PasswordStrength, string> = {
  weak: 'Faible',
  medium: 'Moyen',
  strong: 'Correct',
};

const STRENGTH_SEGMENTS: Record<PasswordStrength, number> = {
  weak: 1,
  medium: 2,
  strong: 3,
};

const STRENGTH_COLOR: Record<PasswordStrength, string> = {
  weak: colors.status.error,
  medium: colors.status.warning,
  strong: colors.status.success,
};

/** Reached when `POST /auth/phone/verify` returns `is_new_user: true`. */
export default function RegisterScreen() {
  const [formError, setFormError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const registerAccount = useRegister();

  const {
    control,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '', marketingOptIn: false },
  });

  const password = watch('password');
  const strength = password.length > 0 ? getPasswordStrength(password) : null;

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null);

    try {
      await registerAccount.mutateAsync({
        first_name: values.firstName,
        last_name: values.lastName,
        email: values.email,
        password: values.password,
        marketing_opt_in: values.marketingOptIn,
      });
      router.replace('/(tabs)');
    } catch (error) {
      const firstNameError = getFieldError(error, 'first_name');
      const lastNameError = getFieldError(error, 'last_name');
      const emailError = getFieldError(error, 'email');
      const passwordError = getFieldError(error, 'password');
      if (firstNameError) {
        setError('firstName', { message: firstNameError });
      } else if (lastNameError) {
        setError('lastName', { message: lastNameError });
      } else if (emailError) {
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
      {/* The user is already signed in by the time they reach Register; a
          swipe-back into OTP would replay a spent otp_token. */}
      <Stack.Screen options={{ gestureEnabled: false }} />
      <View style={styles.header}>
        <View style={styles.progress}>
          {Array.from({ length: TOTAL_STEPS }, (_, index) => (
            <View
              key={index}
              style={[styles.progressSegment, index < CURRENT_STEP && styles.progressSegmentDone]}
            />
          ))}
        </View>
      </View>

      <AppText variant="title" style={styles.title}>
        Sécurisez votre compte
      </AppText>
      <AppText variant="body" color="secondary" style={styles.subtitle}>
        Votre email sert à récupérer votre compte et à recevoir vos billets.
      </AppText>

      <View style={styles.fields}>
        <Controller
          control={control}
          name="firstName"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label="Prénom"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.firstName?.message}
              placeholder="Amine"
              autoCapitalize="words"
              autoComplete="given-name"
              returnKeyType="next"
            />
          )}
        />

        <Controller
          control={control}
          name="lastName"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInput
              label="Nom"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.lastName?.message}
              placeholder="Ben Salah"
              autoCapitalize="words"
              autoComplete="family-name"
              returnKeyType="next"
            />
          )}
        />

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
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <View>
              <AppInput
                label="Mot de passe"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                placeholder="8 caractères minimum"
                secureTextEntry={!passwordVisible}
                autoCapitalize="none"
                autoComplete="new-password"
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

              {strength ? (
                <View style={styles.strengthRow}>
                  {[0, 1, 2].map((segment) => (
                    <View
                      key={segment}
                      style={[
                        styles.strengthBar,
                        segment < STRENGTH_SEGMENTS[strength] && {
                          backgroundColor: STRENGTH_COLOR[strength],
                        },
                      ]}
                    />
                  ))}
                  <AppText
                    variant="caption"
                    style={[styles.strengthLabel, { color: STRENGTH_COLOR[strength] }]}
                  >
                    {STRENGTH_LABEL[strength]}
                  </AppText>
                </View>
              ) : null}
            </View>
          )}
        />
      </View>

      <Controller
        control={control}
        name="marketingOptIn"
        render={({ field: { onChange, value } }) => (
          <Pressable
            style={styles.consentRow}
            onPress={() => onChange(!value)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: value }}
            accessibilityLabel="Recevoir les bons plans et réductions Rakeb"
          >
            <View style={[styles.checkbox, value && styles.checkboxChecked]}>
              {value ? (
                <AppText variant="caption" color="inverse">
                  ✓
                </AppText>
              ) : null}
            </View>
            <AppText variant="bodySmall" color="secondary" style={styles.consentText}>
              Recevoir les bons plans et réductions Rakeb (2 emails par mois maxi).
            </AppText>
          </Pressable>
        )}
      />

      {formError ? (
        <AppText variant="bodySmall" color="error" style={styles.formError}>
          {formError}
        </AppText>
      ) : null}

      <AppButton
        label="Continuer"
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting || registerAccount.isPending}
        style={styles.submit}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.lg,
  },
  progress: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.background.surface,
  },
  progressSegmentDone: {
    backgroundColor: colors.brand.primary,
  },
  title: {
    marginTop: spacing.xl,
  },
  subtitle: {
    marginTop: spacing.sm,
  },
  fields: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  strengthRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.border.default,
  },
  strengthLabel: {
    marginLeft: spacing.xs,
    fontWeight: '700',
  },
  consentRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  checkbox: {
    flex: 0,
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  consentText: {
    flex: 1,
  },
  formError: {
    marginTop: spacing.md,
  },
  submit: {
    marginTop: spacing.xl,
  },
});
