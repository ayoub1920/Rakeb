import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, AppText } from '@/components';
import { uploadFile, type UploadPurpose } from '@/features/uploads/api';
import { colors, radius, sizes, spacing } from '@/theme';
import { createLogger } from '@/utils/logger';

const log = createLogger('taxi.document-upload');

export type DocumentSlotValue = { uploadId: string; localUri: string; mimeType: string };
type DocumentSlotState = 'empty' | 'picking' | 'uploading' | 'uploaded' | 'error';

export type DocumentUploadSlotProps = {
  label: string;
  purpose: UploadPurpose;
  value: DocumentSlotValue | null;
  onChange: (next: DocumentSlotValue | null) => void;
  required?: boolean;
  hint?: string;
  error?: string;
  disabled?: boolean;
  /** Default `4/3` — pass `1` for a face photo. */
  aspectRatio?: number;
  /** Default 10 MB. */
  maxBytes?: number;
  testID?: string;
};

/**
 * Reusable upload slot — pick (camera or gallery), real sign→PUT→confirm
 * upload (`uploadFile`, no mock path), local preview, replace, remove.
 *
 * Written with zero taxi-specific imports so it can be promoted to
 * `@/components` later if a second feature needs it.
 */
export function DocumentUploadSlot({
  label,
  purpose,
  value,
  onChange,
  required = false,
  hint,
  error: externalError,
  disabled = false,
  aspectRatio = 4 / 3,
  maxBytes = 10 * 1024 * 1024,
  testID,
}: DocumentUploadSlotProps) {
  const [state, setState] = useState<DocumentSlotState>(value ? 'uploaded' : 'empty');
  const [localError, setLocalError] = useState<string | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const error = externalError ?? localError;
  const busy = state === 'picking' || state === 'uploading';

  async function pick(source: 'camera' | 'library') {
    setSheetVisible(false);
    setLocalError(null);
    setState('picking');

    try {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setLocalError(
          source === 'camera'
            ? 'Autorisez l’appareil photo pour prendre une photo.'
            : 'Autorisez l’accès à vos photos pour en choisir une.',
        );
        setState('error');
        return;
      }

      const pickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        quality: 0.85,
        allowsEditing: true,
        aspect: [aspectRatio, 1].map((n) => Math.round(n * 100)) as [number, number],
      };
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(pickerOptions)
          : await ImagePicker.launchImageLibraryAsync(pickerOptions);
      if (result.canceled || result.assets.length === 0) {
        setState(value ? 'uploaded' : 'empty');
        return;
      }

      const asset = result.assets[0]!;
      if (asset.fileSize != null && asset.fileSize > maxBytes) {
        setLocalError(`Le fichier est trop volumineux (${Math.round(maxBytes / (1024 * 1024))} Mo maximum).`);
        setState('error');
        return;
      }

      setState('uploading');
      const uploadId = await uploadFile(purpose, {
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
      });
      onChange({ uploadId, localUri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' });
      setState('uploaded');
    } catch (err) {
      log.warn(`upload failed for ${purpose}`, err);
      setLocalError('Le téléversement a échoué. Réessayez.');
      setState('error');
    }
  }

  function remove() {
    onChange(null);
    setLocalError(null);
    setState('empty');
  }

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.labelRow}>
        <AppText variant="label">{label}</AppText>
        {required ? (
          <AppText variant="label" color="error">
            {' '}
            *
          </AppText>
        ) : null}
      </View>
      {hint ? (
        <AppText variant="caption" color="tertiary" style={styles.hint}>
          {hint}
        </AppText>
      ) : null}

      {state === 'uploaded' && value ? (
        <View style={[styles.tile, { aspectRatio }]}>
          <Image source={{ uri: value.localUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark-circle" size={22} color={colors.status.success} />
          </View>
          <View style={styles.footer}>
            <AppButton
              label="Remplacer"
              variant="ghost"
              size="sm"
              fullWidth={false}
              disabled={disabled}
              onPress={() => setSheetVisible(true)}
            />
            <AppButton
              label="Supprimer"
              variant="ghost"
              size="sm"
              fullWidth={false}
              disabled={disabled}
              onPress={remove}
            />
          </View>
        </View>
      ) : (
        <Pressable
          disabled={disabled || busy}
          onPress={() => setSheetVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={label}
          style={({ pressed }) => [
            styles.tile,
            styles.empty,
            { aspectRatio },
            pressed && !busy && styles.emptyPressed,
            error ? styles.emptyError : null,
          ]}
        >
          {busy ? (
            <>
              <ActivityIndicator color={colors.brand.primary} />
              <AppText variant="caption" color="tertiary" style={styles.emptyCaption}>
                {state === 'uploading' ? 'Téléversement…' : 'Ouverture…'}
              </AppText>
            </>
          ) : (
            <>
              <Ionicons name="camera-outline" size={28} color={colors.text.tertiary} />
              <AppText variant="caption" color="tertiary" style={styles.emptyCaption}>
                Ajouter une photo
              </AppText>
            </>
          )}
        </Pressable>
      )}

      {error ? (
        <AppText variant="caption" color="error" style={styles.errorText}>
          {error}
        </AppText>
      ) : null}

      <Modal
        visible={sheetVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setSheetVisible(false)}
      >
        <View style={styles.sheetRoot}>
          <Pressable
            style={styles.sheetBackdrop}
            accessibilityRole="button"
            accessibilityLabel="Fermer"
            onPress={() => setSheetVisible(false)}
          />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <View style={styles.sheetHandle} />
            <AppText variant="subheading" style={styles.sheetTitle}>
              {label}
            </AppText>
            <AppButton label="Prendre une photo" onPress={() => void pick('camera')} />
            <AppButton
              label="Choisir dans la galerie"
              variant="secondary"
              onPress={() => void pick('library')}
              style={styles.sheetGap}
            />
            <AppButton
              label="Annuler"
              variant="ghost"
              onPress={() => setSheetVisible(false)}
              style={styles.sheetGap}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xxs,
  },
  labelRow: {
    flexDirection: 'row',
  },
  hint: {
    marginBottom: spacing.xxs,
  },
  tile: {
    width: '100%',
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.background.surface,
  },
  empty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: sizes.minTouchTarget * 2,
  },
  emptyPressed: {
    opacity: 0.7,
  },
  emptyError: {
    borderColor: colors.status.error,
  },
  emptyCaption: {
    marginTop: spacing.xxs,
  },
  checkBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: colors.background.default,
    borderRadius: radius.pill,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    backgroundColor: colors.background.overlay,
  },
  errorText: {
    marginTop: spacing.xxs,
  },
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: colors.background.overlay },
  sheet: {
    backgroundColor: colors.background.default,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border.strong,
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    marginBottom: spacing.sm,
  },
  sheetGap: {
    marginTop: spacing.xs,
  },
});
