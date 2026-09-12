import { StyleSheet, View } from 'react-native';

import { sizes, spacing } from '@/theme';

import { AppCard } from './AppCard';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { IconMedallion, type MedallionTone } from './IconMedallion';

export type ChoiceCardProps = {
  icon: IconName;
  title: string;
  description: string;
  /** Overrides `description` — e.g. a status hint once the choice has already been acted on. */
  subtitle?: string;
  tone?: MedallionTone;
  onPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
};

/**
 * A large, icon-led option row: a tinted icon tile, a title and description,
 * and a trailing chevron.
 *
 * Originated as the taxi landing page's "Passager" / "Chauffeur" cards
 * (`TaxiPathChoiceCard`) — promoted here once the services catalogue needed
 * the identical shape for its "Covoiturage" / "Taxi" rows.
 */
export function ChoiceCard({
  icon,
  title,
  description,
  subtitle,
  tone = 'brand',
  onPress,
  accessibilityLabel,
  testID,
}: ChoiceCardProps) {
  return (
    <AppCard
      onPress={onPress}
      accessibilityLabel={accessibilityLabel ?? title}
      style={styles.card}
      testID={testID}
    >
      <View style={styles.row}>
        <IconMedallion icon={icon} size="sm" shape="square" tone={tone} />
        <View style={styles.text}>
          <AppText variant="subheading">{title}</AppText>
          <AppText variant="bodySmall" color="secondary">
            {subtitle ?? description}
          </AppText>
        </View>
        <Icon name="chevron-forward" size="lg" color="tertiary" />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: sizes.minTouchTarget * 1.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  text: {
    flex: 1,
    gap: spacing.xxs,
  },
});
