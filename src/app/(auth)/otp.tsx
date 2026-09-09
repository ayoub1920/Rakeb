import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { getFieldError, normalizeError } from '@/api/errors';
import { AppButton, AppText, Screen } from '@/components';
import { env } from '@/config/env';
import { useResendPhoneOtp, useVerifyPhoneOtp } from '@/features/auth/queries';
import { otpFormSchema, type OtpFormValues } from '@/features/auth/schemas';
import { colors, radius, sizes, spacing } from '@/theme';

const CODE_LENGTH = 6;
/** Step 2 of the onboarding flow's 6 progress segments — see `phone.tsx`. */
const CURRENT_STEP = 2;
const TOTAL_STEPS = 3;
const DEFAULT_RESEND_COOLDOWN_S = 60;
/** Accepted by the mock `/auth/phone/verify` route — see `api/mock/routes.ts`. */
const DEV_SKIP_CODE = '123456';
/** Never in a production build — same double guard as `dev-auth.ts`. */
const CAN_SKIP_VERIFICATION = env.isDevelopment && env.enableDevRoutes;

export default function OtpScreen() {
  const { otp_token: otpToken, phone, resend_after: resendAfter } = useLocalSearchParams<{
    otp_token?: string;
    phone?: string;
    resend_after?: string;
  }>();

  const [formError, setFormError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(
    resendAfter ? Number(resendAfter) : DEFAULT_RESEND_COOLDOWN_S,
  );
  const inputRef = useRef<TextInput>(null);
  const verifyOtp = useVerifyPhoneOtp();
  const resendOtp = useResendPhoneOtp();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: { code: '' },
  });

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => setCooldown((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function verifyCode(code: string) {
    if (!otpToken) return;
    setFormError(null);

    try {
      const session = await verifyOtp.mutateAsync({ otp_token: otpToken, code });
      router.replace(session.is_new_user ? '/(auth)/register' : '/(tabs)');
    } catch (error) {
      const fieldError = getFieldError(error, 'code');
      if (fieldError) {
        setError('code', { message: fieldError });
      } else {
        setFormError(normalizeError(error).message);
      }
    }
  }

  async function onSubmit(values: OtpFormValues) {
    await verifyCode(values.code);
  }

  async function handleDevSkip() {
    if (!otpToken) return;
    setFormError(null);

    try {
      await verifyOtp.mutateAsync({ otp_token: otpToken, code: DEV_SKIP_CODE });
      router.replace('/(auth)/register');
    } catch (error) {
      setFormError(normalizeError(error).message);
    }
  }

  async function handleResend() {
    if (!otpToken || cooldown > 0 || resendOtp.isPending) return;
    setFormError(null);

    try {
      const challenge = await resendOtp.mutateAsync({ otp_token: otpToken });
      setCooldown(challenge.resend_after);
    } catch (error) {
      setFormError(normalizeError(error).message);
    }
  }

  const minutes = Math.floor(cooldown / 60);
  const seconds = cooldown % 60;

  return (
    <Screen scrollable>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={sizes.hitSlop}
          style={styles.back}
        >
          <AppText variant="body">←</AppText>
        </Pressable>

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
        Entrez le code
      </AppText>
      <AppText variant="body" color="secondary" style={styles.subtitle}>
        Code à 6 chiffres envoyé au{' '}
        <AppText variant="body" color="primary">
          {phone}
        </AppText>
        .{' '}
        <AppText
          variant="body"
          color="brand"
          onPress={() => router.back()}
          accessibilityRole="link"
          accessibilityLabel="Modifier le numéro de téléphone"
        >
          Modifier
        </AppText>
      </AppText>

      <Controller
        control={control}
        name="code"
        render={({ field: { onChange, value } }) => (
          <Pressable
            style={styles.boxesRow}
            onPress={() => inputRef.current?.focus()}
            accessibilityRole="none"
          >
            {Array.from({ length: CODE_LENGTH }, (_, index) => {
              const digit = value[index];
              const isActive = index === value.length;
              return (
                <View key={index} style={[styles.box, isActive && styles.boxActive]}>
                  <AppText variant="heading">{digit ?? ''}</AppText>
                </View>
              );
            })}
            <TextInput
              ref={inputRef}
              value={value}
              onChangeText={(text) => {
                const digits = text.replace(/[^\d]/g, '').slice(0, CODE_LENGTH);
                onChange(digits);
                if (digits.length === CODE_LENGTH) {
                  void handleSubmit(onSubmit)();
                }
              }}
              keyboardType="number-pad"
              maxLength={CODE_LENGTH}
              autoFocus
              style={styles.hiddenInput}
              accessibilityLabel="Code de vérification à 6 chiffres"
              returnKeyType="done"
            />
          </Pressable>
        )}
      />

      {errors.code?.message ? (
        <AppText variant="bodySmall" color="error" style={styles.formError}>
          {errors.code.message}
        </AppText>
      ) : formError ? (
        <AppText variant="bodySmall" color="error" style={styles.formError}>
          {formError}
        </AppText>
      ) : null}

      <View style={styles.resendRow}>
        {cooldown > 0 ? (
          <AppText variant="bodySmall" color="tertiary">
            Renvoyer le code dans {minutes}:{seconds.toString().padStart(2, '0')}
          </AppText>
        ) : (
          <Pressable
            onPress={handleResend}
            disabled={resendOtp.isPending}
            accessibilityRole="button"
            accessibilityLabel="Renvoyer le code"
            hitSlop={sizes.hitSlop}
          >
            <AppText variant="bodySmall" color="brand">
              {resendOtp.isPending ? 'Envoi…' : 'Renvoyer le code'}
            </AppText>
          </Pressable>
        )}
      </View>

      <AppButton
        label="Vérifier"
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting || verifyOtp.isPending}
        style={styles.submit}
      />

      {CAN_SKIP_VERIFICATION ? (
        <AppButton
          label="Ignorer la vérification (dev)"
          variant="ghost"
          onPress={handleDevSkip}
          loading={verifyOtp.isPending}
          style={styles.devSkip}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.lg,
  },
  back: {
    minWidth: sizes.icon.lg,
  },
  progress: {
    flex: 1,
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
  boxesRow: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  box: {
    flex: 1,
    aspectRatio: 0.85,
    borderRadius: radius.md,
    backgroundColor: colors.background.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: {
    borderWidth: 1.5,
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primarySurface,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  formError: {
    marginTop: spacing.md,
  },
  resendRow: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  submit: {
    marginTop: spacing.xl,
  },
  devSkip: {
    marginTop: spacing.sm,
  },
});
