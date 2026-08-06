import { forwardRef, useId } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radius, sizes, spacing, textVariants } from '@/theme';

import { AppText } from './AppText';

export type AppInputProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  /** Validation message. Its presence is what puts the field in an error state. */
  error?: string;
  /** Shown only when there is no error. */
  helperText?: string;
  multiline?: boolean;
};

/**
 * Text field.
 *
 * `forwardRef` so React Hook Form can focus the first invalid field, and so a
 * multi-step form can move focus with `returnKeyType="next"`.
 *
 * Accessibility: the label is bound to the input, and the error is announced
 * through `accessibilityState.invalid` plus a live region — colour alone never
 * carries the error.
 */
export const AppInput = forwardRef<TextInput, AppInputProps>(function AppInput(
  { label, error, helperText, multiline = false, ...rest },
  ref,
) {
  const inputId = useId();
  const hasError = Boolean(error);

  return (
    <View style={styles.container}>
      {label ? (
        <AppText variant="label" color="secondary" nativeID={`${inputId}-label`}>
          {label}
        </AppText>
      ) : null}

      <TextInput
        ref={ref}
        style={[styles.input, multiline && styles.multiline, hasError && styles.inputError]}
        placeholderTextColor={colors.text.tertiary}
        accessibilityLabel={label}
        accessibilityLabelledBy={label ? `${inputId}-label` : undefined}
        accessibilityState={{ disabled: rest.editable === false }}
        aria-invalid={hasError}
        multiline={multiline}
        {...rest}
      />

      {hasError ? (
        <AppText variant="caption" color="error" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : helperText ? (
        <AppText variant="caption" color="tertiary">
          {helperText}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  input: {
    height: sizes.input.height,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: radius.md,
    backgroundColor: colors.background.default,
    color: colors.text.primary,
    fontSize: textVariants.body.fontSize,
  },
  multiline: {
    height: undefined,
    minHeight: sizes.input.minHeightMultiline,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: colors.border.error,
  },
});
