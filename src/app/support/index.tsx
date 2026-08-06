import { Stack, router } from 'expo-router';
import { View } from 'react-native';

import { AppButton, DevelopmentPlaceholder, Screen } from '@/components';
import { spacing } from '@/theme';

export default function HelpScreen() {
  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Aide' }} />

      <DevelopmentPlaceholder
        title="Centre d’aide"
        description="Articles d’aide consultables par thème, avec accès au support et au signalement."
        feature="support"
        endpoints={['GET /help/articles', 'GET /help/articles/{slug}']}
      />

      <View style={{ gap: spacing.sm }}>
        <AppButton
          label="Contacter le support"
          variant="secondary"
          onPress={() => router.push('/support/ticket')}
        />
        <AppButton
          label="Signaler un problème"
          variant="secondary"
          onPress={() => router.push('/support/report')}
        />
      </View>
    </Screen>
  );
}
