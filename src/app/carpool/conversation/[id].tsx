import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { flattenPages } from '@/api/pagination';
import { AppText, EmptyView, ErrorView, LoadingView, Screen } from '@/components';
import {
  useMarkConversationRead,
  useMessages,
  useQuickReplies,
  useSendMessage,
} from '@/features/carpool/conversations/queries';
import { useConversationLiveUpdates } from '@/features/carpool/conversations/use-live-updates';
import { colors, radius, sizes, spacing } from '@/theme';
import type { Message } from '@/types/models';
import { formatTime, parseIsoDate } from '@/utils/date';

/**
 * A conversation thread.
 *
 * The list is inverted: newest at the bottom, `fetchNextPage` loads older
 * history upward. Sent messages are appended optimistically by the mutation;
 * the driver's replies arrive live over `/ws/conversations`.
 */
export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [draft, setDraft] = useState('');

  const live = useConversationLiveUpdates(id);
  const query = useMessages(id, { live: live.connected });
  const messages = flattenPages(query.data);
  const send = useSendMessage(id ?? '');
  const { data: quickReplies } = useQuickReplies();

  // Emit "typing" while the composer has focus + text, and stop shortly after
  // the user pauses or sends.
  const typingStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function onDraftChange(text: string) {
    setDraft(text);
    if (!text.trim()) {
      live.sendTyping(false);
      return;
    }
    live.sendTyping(true);
    if (typingStopRef.current) clearTimeout(typingStopRef.current);
    typingStopRef.current = setTimeout(() => live.sendTyping(false), 3_000);
  }

  // Mark read on open and again whenever the newest message id changes (a
  // reply came in while the thread was on screen).
  const markRead = useMarkConversationRead(id);
  const newestId = messages[0]?.id;
  const lastMarked = useRef<string | null>(null);
  useEffect(() => {
    if (!id || query.isLoading) return;
    if (lastMarked.current === (newestId ?? 'empty')) return;
    lastMarked.current = newestId ?? 'empty';
    markRead.mutate();
  }, [id, newestId, query.isLoading, markRead]);

  function submit(body: string) {
    const text = body.trim();
    if (!text) return;
    setDraft('');
    if (typingStopRef.current) clearTimeout(typingStopRef.current);
    live.sendTyping(false);
    send.mutate(text);
  }

  return (
    <Screen padded={false}>
      <Stack.Screen options={{ title: 'Conversation' }} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {query.isLoading ? (
          <LoadingView />
        ) : query.isError && messages.length === 0 ? (
          <ErrorView error={query.error} onRetry={() => void query.refetch()} />
        ) : messages.length === 0 ? (
          <EmptyView title="Aucun message" description="Écrivez le premier message ci-dessous." />
        ) : (
          <FlatList
            data={messages}
            inverted
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            onEndReachedThreshold={0.3}
            onEndReached={() => {
              if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
            }}
            renderItem={({ item }) => <Bubble message={item} />}
          />
        )}

        <View style={styles.composerWrap}>
          {live.peerTyping ? (
            <AppText variant="caption" color="tertiary" style={styles.typing}>
              En train d’écrire…
            </AppText>
          ) : null}

          {quickReplies && quickReplies.length > 0 ? (
            <FlatList
              data={quickReplies}
              horizontal
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickTrack}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => submit(item.body)}
                  accessibilityRole="button"
                  accessibilityLabel={item.body}
                  style={styles.quickChip}
                >
                  <AppText variant="caption" color="brand">
                    {item.body}
                  </AppText>
                </Pressable>
              )}
            />
          ) : null}

          <View style={styles.composer}>
            <TextInput
              value={draft}
              onChangeText={onDraftChange}
              onSubmitEditing={() => submit(draft)}
              placeholder="Écrire un message…"
              placeholderTextColor={colors.text.tertiary}
              returnKeyType="send"
              style={styles.textInput}
              multiline
            />
            <Pressable
              onPress={() => submit(draft)}
              disabled={!draft.trim()}
              accessibilityRole="button"
              accessibilityLabel="Envoyer"
              style={[styles.sendButton, !draft.trim() && styles.sendButtonDisabled]}
            >
              <AppText variant="label" color={draft.trim() ? 'inverse' : 'tertiary'}>
                ➤
              </AppText>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Bubble({ message }: { message: Message }) {
  const mine = message.author === 'me';
  const at = parseIsoDate(message.created_at);

  return (
    <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowPeer]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubblePeer]}>
        <AppText variant="bodySmall" color={mine ? 'inverse' : 'primary'}>
          {message.body}
        </AppText>
        {at ? (
          <AppText variant="caption" color={mine ? 'inverse' : 'tertiary'} style={styles.time}>
            {formatTime(at)}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  bubbleRowMine: {
    justifyContent: 'flex-end',
  },
  bubbleRowPeer: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    gap: spacing.xxs,
  },
  bubbleMine: {
    backgroundColor: colors.brand.primary,
    borderBottomRightRadius: radius.sm,
  },
  bubblePeer: {
    backgroundColor: colors.background.surface,
    borderBottomLeftRadius: radius.sm,
  },
  time: {
    alignSelf: 'flex-end',
  },
  composerWrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
    backgroundColor: colors.background.default,
    paddingBottom: spacing.md,
  },
  typing: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  quickTrack: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  quickChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.brand.primary,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  textInput: {
    flex: 1,
    minHeight: sizes.input.height,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    color: colors.text.primary,
    fontSize: 16,
  },
  sendButton: {
    width: sizes.input.height,
    height: sizes.input.height,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.background.disabled,
  },
});
