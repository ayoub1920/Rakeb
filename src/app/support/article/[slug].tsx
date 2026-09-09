import { Stack, useLocalSearchParams } from 'expo-router';

import { AppText, ErrorView, LoadingView, Screen } from '@/components';
import { useHelpArticle } from '@/features/support/queries';

/** A single help article. */
export default function HelpArticleScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data, isLoading, isError, error, refetch } = useHelpArticle(slug ?? '');

  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: data?.title ?? 'Article' }} />
      {isLoading ? (
        <LoadingView />
      ) : isError || !data ? (
        <ErrorView error={error} onRetry={() => void refetch()} />
      ) : (
        <>
          <AppText variant="title">{data.title}</AppText>
          <AppText variant="body" color="secondary" style={{ marginTop: 12 }}>
            {data.body}
          </AppText>
        </>
      )}
    </Screen>
  );
}
