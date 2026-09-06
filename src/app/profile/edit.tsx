import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';

import { getFieldError, normalizeError } from '@/api/errors';
import { AppButton, AppCard, AppInput, AppText, ErrorView, LoadingView, Screen } from '@/components';
import { profileFormSchema, type ProfileFormValues } from '@/features/profile/schemas';
import {
  useCurrentUser,
  useUpdateAvatar,
  useUpdateProfile,
  useUpdateRole,
} from '@/features/profile/queries';
import { colors, radius, spacing } from '@/theme';
import type { UserRole } from '@/types/models';

const ROLE_OPTIONS: { value: Extract<UserRole, 'rider' | 'driver' | 'both'>; label: string }[] = [
  { value: 'rider', label: 'Passager' },
  { value: 'driver', label: 'Conducteur' },
  { value: 'both', label: 'Les deux' },
];

/** Modifier mon profil — name, birth date, e-mail, bio, photo, active role. */
export default function EditProfileScreen() {
  const { data: user, isLoading, isError, error, refetch } = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const updateAvatar = useUpdateAvatar();
  const updateRole = useUpdateRole();
  const [formError, setFormError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    values: {
      first_name: user?.first_name ?? '',
      last_name: user?.last_name ?? '',
      email: user?.email ?? '',
      birth_date: user?.birth_date ?? '',
      bio: user?.bio ?? '',
    },
  });

  async function onSubmit(values: ProfileFormValues) {
    setFormError(null);
    try {
      await updateProfile.mutateAsync({
        first_name: values.first_name?.trim() || undefined,
        last_name: values.last_name?.trim() || undefined,
        email: values.email?.trim() || undefined,
        birth_date: values.birth_date?.trim() || undefined,
        bio: values.bio?.trim() ?? '',
      });
      router.back();
    } catch (e) {
      setFormError(getFieldError(e, 'email') ?? normalizeError(e).message);
    }
  }

  async function onChangePhoto() {
    setAvatarError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setAvatarError('Autorisez l’accès à vos photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0]!;
    try {
      await updateAvatar.mutateAsync({
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
      });
    } catch (e) {
      setAvatarError(normalizeError(e).message);
    }
  }

  if (isLoading) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'Modifier mon profil' }} />
        <LoadingView />
      </Screen>
    );
  }

  if (isError || !user) {
    return (
      <Screen scrollable>
        <Stack.Screen options={{ title: 'Modifier mon profil' }} />
        <ErrorView error={error} onRetry={() => void refetch()} />
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Modifier mon profil' }} />

      <View style={styles.sections}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <AppText variant="subheading" color="inverse">
              {initials(user.display_name)}
            </AppText>
          </View>
          <View style={styles.avatarActions}>
            <AppButton
              label="Changer la photo"
              variant="secondary"
              fullWidth={false}
              loading={updateAvatar.isPending}
              onPress={() => void onChangePhoto()}
            />
            {avatarError ? (
              <AppText variant="caption" color="error">
                {avatarError}
              </AppText>
            ) : null}
          </View>
        </View>

        <View style={styles.fields}>
          <Controller
            control={control}
            name="first_name"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Prénom"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.first_name?.message}
                autoCapitalize="words"
              />
            )}
          />
          <Controller
            control={control}
            name="last_name"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Nom"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.last_name?.message}
                autoCapitalize="words"
              />
            )}
          />
          <Controller
            control={control}
            name="birth_date"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Date de naissance"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.birth_date?.message}
                placeholder="AAAA-MM-JJ"
                autoCapitalize="none"
              />
            )}
          />
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="E-mail"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            )}
          />
          <Controller
            control={control}
            name="bio"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Bio"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.bio?.message}
                placeholder="Ponctuel, non-fumeur…"
                multiline
              />
            )}
          />
        </View>

        <AppCard style={styles.card}>
          <AppText variant="label" color="secondary">
            Rôle actif
          </AppText>
          <AppText variant="caption" color="tertiary" style={styles.cardHint}>
            Le mode conducteur débloque la publication de trajets.
          </AppText>
          <View style={styles.segment}>
            {ROLE_OPTIONS.map((option) => {
              const active = user.role === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => !active && updateRole.mutate(option.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[styles.segmentItem, active && styles.segmentItemActive]}
                >
                  <AppText variant="label" color={active ? 'inverse' : 'secondary'}>
                    {option.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </AppCard>

        {formError ? (
          <AppText variant="bodySmall" color="error">
            {formError}
          </AppText>
        ) : null}

        <AppButton
          label="Enregistrer"
          loading={updateProfile.isPending}
          disabled={!isDirty}
          onPress={handleSubmit(onSubmit)}
        />
      </View>
    </Screen>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase();
}

const styles = StyleSheet.create({
  sections: { gap: spacing.xl, paddingTop: spacing.md },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarActions: { flex: 1, gap: spacing.xs },
  fields: { gap: spacing.lg },
  card: { gap: spacing.xs },
  cardHint: { marginBottom: spacing.xs },
  segment: {
    flexDirection: 'row',
    borderRadius: radius.md,
    backgroundColor: colors.background.surface,
    padding: spacing.xxs,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  segmentItemActive: { backgroundColor: colors.brand.primary },
});
