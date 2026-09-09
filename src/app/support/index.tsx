import { Stack, router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppCard,
  AppText,
  EmptyView,
  ErrorView,
  LoadingView,
  Screen,
} from '@/components';
import { useHelpArticles } from '@/features/support/queries';
import { spacing } from '@/theme';

/** Help centre: articles by theme, plus the entry points to support and reports. */
export default function HelpScreen() {
  const { data, isLoading, isError, error, refetch } = useHelpArticles();

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Aide & sécurité' }} />

      <View style={styles.sections}>
        <View style={styles.block}>
          <AppText variant="subheading">Questions fréquentes</AppText>
          {isLoading ? (
            <LoadingView fullscreen={false} />
          ) : isError ? (
            <ErrorView error={error} onRetry={() => void refetch()} />
          ) : !data || data.length === 0 ? (
            <EmptyView title="Aucun article" description="Le centre d’aide se remplit bientôt." />
          ) : (
            data.map((article) => (
              <AppCard
                key={article.slug}
                onPress={() => router.push(`/support/article/${article.slug}` as Href)}
                accessibilityLabel={article.title}
              >
                <AppText variant="body">{article.title}</AppText>
                <AppText variant="bodySmall" color="secondary">
                  {article.excerpt}
                </AppText>
              </AppCard>
            ))
          )}
        </View>

        <View style={styles.block}>
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
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sections: { gap: spacing.xl, paddingTop: spacing.md },
  block: { gap: spacing.sm },
});
