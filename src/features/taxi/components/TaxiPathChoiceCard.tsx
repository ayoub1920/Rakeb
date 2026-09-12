import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppCard, AppText } from '@/components';
import { colors, radius, sizes, spacing } from '@/theme';

/** Large illustrated option card for the taxi landing page — "Passager" / "Chauffeur". */
export function TaxiPathChoiceCard({
  icon,
  title,
  description,
  subtitle,
  onPress,
  testID,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  /** Overrides `description` when the driver already has an application (status hint). */
  subtitle?: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <AppCard onPress={onPress} accessibilityLabel={title} style={styles.card} testID={testID}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={28} color={colors.brand.primary} />
        </View>
        <View style={styles.text}>
          <AppText variant="subheading">{title}</AppText>
          <AppText variant="bodySmall" color="secondary">
            {subtitle ?? description}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.text.tertiary} />
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
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.brand.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: spacing.xxs,
  },
});
