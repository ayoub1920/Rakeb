import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';

import { getFieldError, normalizeError } from '@/api/errors';
import { AppButton, AppInput, AppText, Screen } from '@/components';
import { useStartPhoneAuth } from '@/features/auth/queries';
import { phoneFormSchema, toE164, type PhoneFormValues } from '@/features/auth/schemas';
import { colors, radius, sizes, spacing } from '@/theme';

/** Step 1 of the onboarding flow's 6 progress segments. */
const CURRENT_STEP = 1;
const TOTAL_STEPS = 3;

export default function PhoneScreen() {
  const [formError, setFormError] = useState<string | null>(null);
  const startPhoneAuth = useStartPhoneAuth();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneFormSchema),
    defaultValues: { phone: '' },
  });

  async function onSubmit(values: PhoneFormValues) {
    setFormError(null);
    const phone = toE164(values.phone);

    try {
      const challenge = await startPhoneAuth.mutateAsync({ phone });
      router.push({
        pathname: '/(auth)/otp',
        params: {
          otp_token: challenge.otp_token,
          phone,
          resend_after: String(challenge.resend_after),
        },
      });
    } catch (error) {
      const fieldError = getFieldError(error, 'phone');
      if (fieldError) {
        setError('phone', { message: fieldError });
      } else {
        setFormError(normalizeError(error).message);
      }
    }
  }

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
        Votre numéro
      </AppText>
      <AppText variant="body" color="secondary" style={styles.subtitle}>
        On vous envoie un code par SMS pour vérifier que c’est bien vous. Jamais de spam.
      </AppText>

      <View style={styles.fieldRow}>
        <View style={styles.callingCode}>
          <AppText variant="body">+216</AppText>
        </View>

        <View style={styles.input}>
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                value={value}
                onChangeText={(text) => onChange(text.replace(/[^\d]/g, ''))}
                onBlur={onBlur}
                error={errors.phone?.message}
                placeholder="98 123 456"
                keyboardType="number-pad"
                maxLength={8}
                autoFocus
                accessibilityLabel="Numéro de téléphone"
                returnKeyType="done"
                onSubmitEditing={handleSubmit(onSubmit)}
              />
            )}
          />
        </View>
      </View>

      {formError ? (
        <AppText variant="bodySmall" color="error" style={styles.formError}>
          {formError}
        </AppText>
      ) : null}

      <AppText variant="caption" color="tertiary" style={styles.legal}>
        En continuant, vous acceptez nos conditions d’utilisation et notre politique de
        confidentialité.
      </AppText>

      <AppButton
        label="Recevoir le code"
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting || startPhoneAuth.isPending}
        style={styles.submit}
      />
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
  fieldRow: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  callingCode: {
    height: sizes.input.height,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: radius.md,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
  },
  formError: {
    marginTop: spacing.md,
  },
  legal: {
    marginTop: spacing.lg,
  },
  submit: {
    marginTop: spacing.xl,
  },
});


