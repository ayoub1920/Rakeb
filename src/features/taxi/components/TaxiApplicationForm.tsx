import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { AppButton, AppInput, AppText } from '@/components';
import type { UploadPurpose } from '@/features/uploads/api';
import { spacing } from '@/theme';

import type { SubmitTaxiApplicationInput } from '../api';
import { normaliseTaxiPlate, taxiApplicationSchema, type TaxiApplicationFormValues } from '../schemas';
import type { TaxiApplication } from '../types';
import { DocumentUploadSlot, type DocumentSlotValue } from './DocumentUploadSlot';

export type TaxiApplicationFormProps = {
  firstName: string;
  lastName: string;
  /** Pre-fills the form after a rejection — the driver corrects and resubmits. */
  initial?: TaxiApplication;
  loading?: boolean;
  error?: string | null;
  onSubmit: (input: SubmitTaxiApplicationInput) => void;
};

type SlotId =
  | 'licence_front_upload_id'
  | 'licence_back_upload_id'
  | 'cin_front_upload_id'
  | 'cin_back_upload_id'
  | 'driver_photo_upload_id'
  | 'vehicle_photo_upload_id';

const SLOTS: {
  field: SlotId;
  purpose: UploadPurpose;
  label: string;
  required: boolean;
  aspectRatio: number;
  documentKey: keyof TaxiApplication['documents'];
}[] = [
  {
    field: 'licence_front_upload_id',
    purpose: 'taxi_licence_front',
    label: 'Permis de conduire (recto)',
    required: true,
    aspectRatio: 4 / 3,
    documentKey: 'licence_front',
  },
  {
    field: 'licence_back_upload_id',
    purpose: 'taxi_licence_back',
    label: 'Permis de conduire (verso)',
    required: false,
    aspectRatio: 4 / 3,
    documentKey: 'licence_back',
  },
  {
    field: 'cin_front_upload_id',
    purpose: 'taxi_cin_front',
    label: 'CIN (recto)',
    required: true,
    aspectRatio: 4 / 3,
    documentKey: 'cin_front',
  },
  {
    field: 'cin_back_upload_id',
    purpose: 'taxi_cin_back',
    label: 'CIN (verso)',
    required: false,
    aspectRatio: 4 / 3,
    documentKey: 'cin_back',
  },
  {
    field: 'driver_photo_upload_id',
    purpose: 'taxi_driver_photo',
    label: 'Votre photo',
    required: true,
    aspectRatio: 1,
    documentKey: 'driver_photo',
  },
  {
    field: 'vehicle_photo_upload_id',
    purpose: 'taxi_vehicle_photo',
    label: 'Photo du taxi',
    required: true,
    aspectRatio: 4 / 3,
    documentKey: 'vehicle_photo',
  },
];

/**
 * Taxi driver application form. First/last name come from the authenticated
 * user's own profile and are shown read-only — never re-entered.
 */
export function TaxiApplicationForm({
  firstName,
  lastName,
  initial,
  loading,
  error,
  onSubmit,
}: TaxiApplicationFormProps) {
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TaxiApplicationFormValues>({
    resolver: zodResolver(taxiApplicationSchema),
    defaultValues: {
      plate_number: initial?.plate_number ?? '',
      licence_front_upload_id: initial?.documents.licence_front.upload_id ?? '',
      licence_back_upload_id: initial?.documents.licence_back.upload_id ?? undefined,
      cin_front_upload_id: initial?.documents.cin_front.upload_id ?? '',
      cin_back_upload_id: initial?.documents.cin_back.upload_id ?? undefined,
      driver_photo_upload_id: initial?.documents.driver_photo.upload_id ?? '',
      vehicle_photo_upload_id: initial?.documents.vehicle_photo.upload_id ?? '',
    },
  });

  function submit(values: TaxiApplicationFormValues) {
    onSubmit({
      plate_number: normaliseTaxiPlate(values.plate_number),
      licence_front_upload_id: values.licence_front_upload_id,
      licence_back_upload_id: values.licence_back_upload_id || undefined,
      cin_front_upload_id: values.cin_front_upload_id,
      cin_back_upload_id: values.cin_back_upload_id || undefined,
      driver_photo_upload_id: values.driver_photo_upload_id,
      vehicle_photo_upload_id: values.vehicle_photo_upload_id,
    });
  }

  return (
    <View style={styles.fields}>
      <View style={styles.identity}>
        <ReadOnlyField label="Prénom" value={firstName} />
        <ReadOnlyField label="Nom" value={lastName} />
      </View>

      <Controller
        control={control}
        name="plate_number"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInput
            label="Plaque d’immatriculation du taxi"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.plate_number?.message}
            placeholder="204 TU 3456"
            autoCapitalize="characters"
            autoCorrect={false}
          />
        )}
      />

      {SLOTS.map((slot) => (
        <Controller
          key={slot.field}
          control={control}
          name={slot.field}
          render={({ field: { value } }) => {
            const initialSlot = initial?.documents[slot.documentKey];
            const slotValue: DocumentSlotValue | null = value
              ? {
                  uploadId: value,
                  localUri: initialSlot?.url ?? '',
                  mimeType: 'image/jpeg',
                }
              : null;
            return (
              <DocumentUploadSlot
                label={slot.label}
                purpose={slot.purpose}
                required={slot.required}
                aspectRatio={slot.aspectRatio}
                value={slotValue}
                error={errors[slot.field]?.message}
                onChange={(next) =>
                  setValue(slot.field, next?.uploadId ?? '', { shouldValidate: true })
                }
              />
            );
          }}
        />
      ))}

      {error ? (
        <AppText variant="bodySmall" color="error">
          {error}
        </AppText>
      ) : null}

      <AppButton
        label="Envoyer ma candidature"
        loading={loading}
        onPress={handleSubmit(submit)}
        style={styles.submit}
      />
    </View>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.readOnly}>
      <AppText variant="label" color="secondary">
        {label}
      </AppText>
      <AppText variant="body">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing.md, paddingTop: spacing.md },
  identity: { flexDirection: 'row', gap: spacing.md },
  readOnly: { flex: 1, gap: spacing.xxs },
  submit: { marginTop: spacing.lg },
});
