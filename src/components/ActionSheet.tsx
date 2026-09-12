import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { BottomPanel } from './BottomPanel';

export type ActionSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Announced when the sheet opens and used as the backdrop's dismiss label. */
  accessibilityLabel?: string;
  children: ReactNode;
};

/**
 * A modal action sheet: dimmed backdrop, a `BottomPanel`, and a grabber
 * handle. Extracted from taxi's document-upload picker and support's chat
 * sheet, which each built this shell — backdrop, handle and all — by hand.
 */
export function ActionSheet({ visible, onClose, accessibilityLabel, children }: ActionSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? 'Fermer'}
        />
        <BottomPanel>
          <View style={styles.handle} />
          {children}
        </BottomPanel>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.background.overlay,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border.strong,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
});
