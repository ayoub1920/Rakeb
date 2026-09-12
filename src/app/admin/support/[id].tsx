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

import { AppButton, AppText, ErrorView, LoadingView, Screen } from '@/components';
import {
  useAdminSupportChat,
  useAdminSupportLive,
  useAdminSupportMessages,
  useMarkAdminSupportRead,
  useReplySupportChat,
  useResolveSupportChat,
} from '@/features/admin/support-chat/queries';
import type { SupportMessage } from '@/features/support/chat-api';
import { colors, radius, spacing } from '@/theme';
import { formatTime, parseIsoDate } from '@/utils/date';

/** Staff-side thread: read the user's messages and reply in real time. */
export default function AdminSupportThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversation = useAdminSupportChat(id);
  const messages = useAdminSupportMessages(id);
  const reply = useReplySupportChat(id);
  const resolve = useResolveSupportChat(id);
  const markRead = useMarkAdminSupportRead(id);
  useAdminSupportLive(id);

  const [draft, setDraft] = useState('');

  const rows = messages.data ?? [];
  const reversed = [...rows].reverse();
  const newestId = rows[rows.length - 1]?.id;
  const marked = useRef<string | null>(null);
  useEffect(() => {
    if (!id || !newestId || marked.current === newestId) return;
    if ((conversation.data?.unread_count ?? 0) === 0) return;
    marked.current = newestId;
    markRead.mutate();
  }, [id, newestId, conversation.data?.unread_count, markRead]);

  function submit() {
    const text = draft.trim();
    if (!text || reply.isPending) return;
    setDraft('');
    reply.mutate(text, { onError: () => setDraft(text) });
  }

  if (messages.isLoading && rows.length === 0) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Conversation' }} />
        <LoadingView />
      </Screen>
    );
  }

  if (messages.isError && rows.length === 0) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Conversation' }} />
        <ErrorView error={messages.error} onRetry={() => void messages.refetch()} />
      </Screen>
    );
  }

  const resolved = conversation.data?.status === 'resolved';

  return (
    <Screen padded={false}>
      <Stack.Screen options={{ title: conversation.data?.user_name ?? 'Conversation' }} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          data={reversed}
          inverted
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <Bubble message={item} />}
        />

        <View style={styles.footer}>
          {!resolved ? (
            <Pressable onPress={() => resolve.mutate()} style={styles.resolve}>
              <AppText variant="caption" color="brand">
                {resolve.isPending ? 'Résolution…' : 'Marquer comme résolue'}
              </AppText>
            </Pressable>
          ) : (
            <AppText variant="caption" color="tertiary" style={styles.resolvedNote}>
              Conversation résolue. Un nouveau message de l’utilisateur la rouvrira.
            </AppText>
          )}

          <View style={styles.composer}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Répondre à l’utilisateur…"
              placeholderTextColor={colors.text.tertiary}
              style={styles.input}
              multiline
            />
            <AppButton
              label="Envoyer"
              fullWidth={false}
              loading={reply.isPending}
              disabled={!draft.trim()}
              onPress={submit}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Bubble({ message }: { message: SupportMessage }) {
  const staff = message.sender_role === 'staff';
  const system = message.sender_role === 'system';
  const at = parseIsoDate(message.created_at);

  if (system) {
    return (
      <View style={styles.systemRow}>
        <AppText variant="caption" color="tertiary" style={styles.systemText}>
          {message.body}
        </AppText>
      </View>
    );
  }

  return (
    <View style={[styles.row, staff ? styles.rowStaff : styles.rowUser]}>
      <View style={[styles.bubble, staff ? styles.bubbleStaff : styles.bubbleUser]}>
        <AppText variant="caption" color={staff ? 'inverse' : 'brand'} style={styles.author}>
          {staff ? 'Vous (support)' : 'Utilisateur'}
        </AppText>
        <AppText variant="bodySmall" color={staff ? 'inverse' : 'primary'}>
          {message.body}
        </AppText>
        {at ? (
          <AppText
            variant="caption"
            color={staff ? 'inverse' : 'tertiary'}
            style={styles.time}
          >
            {formatTime(at)}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: spacing.lg, gap: spacing.sm },
  row: { flexDirection: 'row' },
  rowStaff: { justifyContent: 'flex-end' },
  rowUser: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '84%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    gap: spacing.xxs,
  },
  bubbleStaff: { backgroundColor: colors.brand.primary, borderBottomRightRadius: radius.sm },
  bubbleUser: { backgroundColor: colors.background.surface, borderBottomLeftRadius: radius.sm },
  author: { marginBottom: spacing.xxs },
  time: { alignSelf: 'flex-end', marginTop: spacing.xxs },
  systemRow: { alignItems: 'center', paddingVertical: spacing.xs },
  systemText: { textAlign: 'center' },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.background.default,
  },
  resolve: { alignSelf: 'flex-start' },
  resolvedNote: { paddingHorizontal: spacing.xs },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
    backgroundColor: colors.background.surface,
    borderRadius: radius.lg,
    color: colors.text.primary,
    fontSize: 15,
  },
});
