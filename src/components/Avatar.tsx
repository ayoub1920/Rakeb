import { Image, type ImageStyle } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, sizes } from '@/theme';

import { AppText } from './AppText';

export type AvatarSize = keyof typeof sizes.avatar;

const TEXT_VARIANT: Record<AvatarSize, 'caption' | 'label' | 'body' | 'subheading' | 'heading'> = {
  sm: 'label',
  md: 'body',
  lg: 'subheading',
  xl: 'subheading',
  xxl: 'heading',
};

export type AvatarProps = {
  /** A photo URL. Falls back to `name`'s initials when absent or still loading. */
  uri?: string | null;
  /** Whoever this avatar represents — only its initials are shown as a fallback. */
  name: string;
  size?: AvatarSize;
  style?: StyleProp<ViewStyle>;
};

/**
 * A user's photo, or their initials on a tinted circle when there is none.
 *
 * Replaces seven near-identical hand-rolled "initials circle" blocks (the
 * account header, the messages list, the carpool roster/request rows, trip and
 * tracking screens, and taxi's own driver avatar and candidate card) — none of
 * which rendered a real photo even where the API has one.
 */
export function Avatar({ uri, name, size = 'md', style }: AvatarProps) {
  const dimension = sizes.avatar[size];
  const dimensionStyle = { width: dimension, height: dimension, borderRadius: radius.pill };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, dimensionStyle, style] as StyleProp<ImageStyle>}
        accessibilityLabel={name}
        contentFit="cover"
      />
    );
  }

  return (
    <View style={[styles.fallback, dimensionStyle, style]}>
      <AppText variant={TEXT_VARIANT[size]} color="inverse">
        {initials(name)}
      </AppText>
    </View>
  );
}

/** First letters of the first and last name parts; falls back to the leading two characters. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.background.surface,
  },
  fallback: {
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
