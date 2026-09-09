import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { AppButton } from './AppButton';

export type WizardFooterProps = {
  /** Label for the forward button. Defaults to « Continuer ». */
  nextLabel?: string;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  /**
   * Where « Précédent » goes when the stack cannot pop (deep link / cold start
   * into a middle step). Omit to hide the back button (first step).
   */
  backHref?: Parameters<typeof router.replace>[0];
  backLabel?: string;
};

/**
 * The « Précédent » / « Continuer » row shared by every wizard step.
 *
 * « Précédent » pops the native stack when it can (preserving the draft, which
 * lives in a store), and otherwise navigates to `backHref` so a step opened
 * directly still has a way back.
 */
export function WizardFooter({
  nextLabel = 'Continuer',
  onNext,
  nextDisabled = false,
  nextLoading = false,
  backHref,
  backLabel = 'Précédent',
}: WizardFooterProps) {
  const showBack = backHref !== undefined;

  function goBack() {
    if (router.canGoBack()) router.back();
    else if (backHref !== undefined) router.replace(backHref);
  }

  return (
    <View style={styles.row}>
      {showBack ? (
        <View style={styles.back}>
          <AppButton label={backLabel} variant="secondary" onPress={goBack} />
        </View>
      ) : null}
      <View style={styles.next}>
        <AppButton
          label={nextLabel}
          onPress={onNext}
          disabled={nextDisabled}
          loading={nextLoading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  back: {
    flex: 1,
  },
  next: {
    flex: 2,
  },
});
