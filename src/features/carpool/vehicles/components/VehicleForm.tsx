import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton, AppInput, AppText } from '@/components';
import { colors, radius, spacing } from '@/theme';
import type { Vehicle } from '@/types/models';

import type { VehicleInput } from '../api';
import { normalisePlate, vehicleFormSchema, type VehicleFormValues } from '../schemas';

const SEAT_OPTIONS = [1, 2, 3, 4, 5, 6];

export type VehicleFormProps = {
  initial?: Vehicle;
  submitLabel: string;
  loading?: boolean;
  error?: string | null;
  onSubmit: (input: VehicleInput) => void;
};

/** Shared add / edit form for a vehicle. */
export function VehicleForm({ initial, submitLabel, loading, error, onSubmit }: VehicleFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      make: initial?.make ?? '',
      model: initial?.model ?? '',
      color: initial?.color ?? '',
      plate: initial?.plate ?? '',
      year: initial?.year ? String(initial.year) : '',
      seats: initial?.seats ?? 4,
    },
  });

  function submit(values: VehicleFormValues) {
    onSubmit({
      make: values.make.trim(),
      model: values.model.trim(),
      color: values.color.trim(),
      plate: normalisePlate(values.plate),
      year: values.year ? Number(values.year) : null,
      seats: values.seats,
    });
  }

  return (
    <View style={styles.fields}>
      <Controller
        control={control}
        name="make"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInput
            label="Marque"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.make?.message}
            placeholder="Volkswagen"
            autoCapitalize="words"
          />
        )}
      />
      <Controller
        control={control}
        name="model"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInput
            label="Modèle"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.model?.message}
            placeholder="Golf 7"
          />
        )}
      />
      <Controller
        control={control}
        name="color"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInput
            label="Couleur"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.color?.message}
            placeholder="Gris"
            autoCapitalize="words"
          />
        )}
      />
      <Controller
        control={control}
        name="plate"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInput
            label="Plaque"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.plate?.message}
            placeholder="204 TU 3456"
            autoCapitalize="characters"
            autoCorrect={false}
          />
        )}
      />
      <Controller
        control={control}
        name="year"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInput
            label="Année (optionnel)"
            value={value ?? ''}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.year?.message}
            placeholder="2019"
            keyboardType="number-pad"
          />
        )}
      />

      <Controller
        control={control}
        name="seats"
        render={({ field: { onChange, value } }) => (
          <View style={styles.seatsField}>
            <AppText variant="label" color="secondary">
              Places passagers
            </AppText>
            <View style={styles.seatsRow}>
              {SEAT_OPTIONS.map((n) => (
                <Pressable
                  key={n}
                  onPress={() => onChange(n)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: value === n }}
                  style={[styles.seatChip, value === n && styles.seatChipOn]}
                >
                  <AppText variant="label" color={value === n ? 'inverse' : 'primary'}>
                    {n}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      />

      {error ? (
        <AppText variant="bodySmall" color="error">
          {error}
        </AppText>
      ) : null}

      <AppButton
        label={submitLabel}
        loading={loading}
        onPress={handleSubmit(submit)}
        style={styles.submit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing.md, paddingTop: spacing.md },
  seatsField: { gap: spacing.sm },
  seatsRow: { flexDirection: 'row', gap: spacing.sm },
  seatChip: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatChipOn: { backgroundColor: colors.brand.primary, borderColor: colors.brand.primary },
  submit: { marginTop: spacing.lg },
});
