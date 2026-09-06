import { Stack, router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppText, Screen } from '@/components';
import { usePublishDraftStore } from '@/stores/publish-draft-store';
import { colors, sizes, spacing } from '@/theme';

/** Step 1 — origin, intermediate stops, destination. */
export default function PublishRouteScreen() {
  const origin = usePublishDraftStore((s) => s.origin);
  const destination = usePublishDraftStore((s) => s.destination);
  const stops = usePublishDraftStore((s) => s.stops);
  const removeStop = usePublishDraftStore((s) => s.removeStop);

  const ready = origin !== null && destination !== null;

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Itinéraire' }} />

      <View style={styles.sections}>
        <AppCard>
          <PlaceRow
            label="Départ"
            value={origin?.label}
            placeholder="D’où partez-vous ?"
            onPress={() => router.push('/(modals)/select-place?field=origin&target=publish')}
          />
          <View style={styles.divider} />
          <PlaceRow
            label="Arrivée"
            value={destination?.label}
            placeholder="Où allez-vous ?"
            onPress={() => router.push('/(modals)/select-place?field=destination&target=publish')}
          />
        </AppCard>

        <View style={styles.block}>
          <AppText variant="label" color="secondary">
            Étapes (optionnel)
          </AppText>
          {stops.map((stop, index) => (
            <View key={`${stop.id}-${index}`} style={styles.stopRow}>
              <AppText variant="body" style={styles.stopLabel}>
                {stop.label}
              </AppText>
              <Pressable
                onPress={() => removeStop(index)}
                accessibilityRole="button"
                accessibilityLabel={`Retirer l’étape ${stop.label}`}
                hitSlop={sizes.hitSlop}
              >
                <AppText variant="label" color="brand">
                  Retirer
                </AppText>
              </Pressable>
            </View>
          ))}
          <AppButton
            label="Ajouter une étape"
            variant="secondary"
            onPress={() => router.push('/(modals)/select-place?field=stop&target=publish')}
          />
        </View>
      </View>

      <AppButton
        label="Continuer"
        disabled={!ready}
        onPress={() => router.push('/carpool/publish/schedule')}
        style={styles.cta}
      />
    </Screen>
  );
}

function PlaceRow({
  label,
  value,
  placeholder,
  onPress,
}: {
  label: string;
  value?: string;
  placeholder: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label} : ${value}` : `${label} : ${placeholder}`}
      style={styles.placeRow}
    >
      <AppText variant="caption" color="tertiary">
        {label}
      </AppText>
      <AppText variant="body" color={value ? 'primary' : 'tertiary'}>
        {value ?? placeholder}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sections: { gap: spacing.xl, paddingTop: spacing.md },
  block: { gap: spacing.sm },
  placeRow: { paddingVertical: spacing.sm, gap: spacing.xxs },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
    marginVertical: spacing.xs,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  stopLabel: { flex: 1 },
  cta: { marginTop: spacing.xl },
});
