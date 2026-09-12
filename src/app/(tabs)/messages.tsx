import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Avatar,
  EmptyView,
  ErrorView,
  LoadingView,
  Screen,
  ScreenHeader,
} from '@/components';
import { useConversations } from '@/features/carpool/conversations/queries';
import { colors, opacity, radius, spacing } from '@/theme';
import type { Conversation } from '@/types/models';
import { formatRelative, parseIsoDate } from '@/utils/date';

/** Messages — the conversation list. A conversation is created with a booking. */
export default function MessagesScreen() {
  const { t } = useTranslation();
  const query = useConversations();
  const conversations = query.data ?? [];

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title={t('tabs.messages')} subtitle="Vos échanges avec les conducteurs" />

      {query.isLoading ? (
        <LoadingView />
      ) : query.isError && conversations.length === 0 ? (
        <ErrorView error={query.error} onRetry={() => void query.refetch()} />
      ) : conversations.length === 0 ? (
        <EmptyView
          icon="chatbubbles-outline"
          title="Aucune conversation"
          description="Une discussion s’ouvre dès que vous réservez un trajet."
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => <ConversationRow conversation={item} />}
        />
      )}
    </Screen>
  );
}

function ConversationRow({ conversation }: { conversation: Conversation }) {
  const at = parseIsoDate(conversation.last_message_at);

  return (
    <Pressable
      onPress={() => router.push(`/carpool/conversation/${conversation.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`Conversation avec ${conversation.peer.first_name}, ${conversation.trip_label}`}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Avatar name={conversation.peer.first_name} size="md" />

      <View style={styles.body}>
        <View style={styles.topLine}>
          <AppText variant="subheading">{conversation.peer.first_name}</AppText>
          {at ? (
            <AppText variant="caption" color="tertiary">
              {formatRelative(at)}
            </AppText>
          ) : null}
        </View>
        <AppText variant="caption" color="tertiary">
          {conversation.trip_label}
        </AppText>
        {conversation.last_message ? (
          <AppText variant="bodySmall" color="secondary" numberOfLines={1}>
            {conversation.last_message}
          </AppText>
        ) : null}
      </View>

      {conversation.unread_count > 0 ? (
        <View style={styles.badge}>
          <AppText variant="caption" color="inverse">
            {conversation.unread_count}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  rowPressed: {
    opacity: opacity.pressed,
  },
  body: {
    flex: 1,
    gap: spacing.xxs,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
  },
});
