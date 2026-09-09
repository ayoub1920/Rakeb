import { useNavigation } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';

/**
 * Asks for confirmation before a screen with unsaved input is left — by the
 * header back button, the Android hardware button, or the iOS swipe.
 *
 * Built on React Navigation's `beforeRemove` event (surfaced through
 * `useNavigation`), the one hook that covers all three gestures.
 *
 * `enabled` arms it; a clean form navigates away silently. The returned
 * `bypass()` disarms it for the next navigation — call it right before a
 * programmatic `router.replace` on success, so submitting does not trigger the
 * "discard?" prompt.
 */
export function useDiscardConfirm(
  enabled: boolean,
  {
    title = 'Abandonner les modifications ?',
    message = 'Les informations saisies ne seront pas enregistrées.',
    confirmLabel = 'Abandonner',
    cancelLabel = 'Continuer',
  }: { title?: string; message?: string; confirmLabel?: string; cancelLabel?: string } = {},
) {
  const navigation = useNavigation();
  const bypassRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (bypassRef.current) return;
      event.preventDefault();
      Alert.alert(title, message, [
        { text: cancelLabel, style: 'cancel' },
        {
          text: confirmLabel,
          style: 'destructive',
          onPress: () => navigation.dispatch(event.data.action),
        },
      ]);
    });

    return unsubscribe;
  }, [enabled, navigation, title, message, confirmLabel, cancelLabel]);

  return { bypass: useCallback(() => { bypassRef.current = true; }, []) };
}
