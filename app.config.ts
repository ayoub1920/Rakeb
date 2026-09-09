import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Dynamic Expo config.
 *
 * Everything static still lives in `app.json`; this file only layers in the
 * native Google Maps API keys, and only when they are present in the
 * environment. That keeps secrets out of version control and keeps Expo Go
 * working with no keys at all:
 *
 *   - Expo Go renders the map already (Android → Google via Expo's shared key,
 *     iOS → Apple Maps). No key required.
 *   - A **custom** key only takes effect in a development / production build.
 *     Set the vars below in `.env`, then `eas build` (or a local prebuild).
 *
 * Vars (see `.env.example`):
 *   EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY  — Android "Maps SDK for Android" key
 *   EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY      — iOS "Maps SDK for iOS" key
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const androidKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY;
  const iosKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY;

  return {
    ...(config as ExpoConfig),
    android: {
      ...config.android,
      ...(androidKey
        ? { config: { ...config.android?.config, googleMaps: { apiKey: androidKey } } }
        : {}),
    },
    ios: {
      ...config.ios,
      ...(iosKey ? { config: { ...config.ios?.config, googleMapsApiKey: iosKey } } : {}),
    },
  };
};
