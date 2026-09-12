import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText, ErrorView } from '@/components';
import { colors, radius, spacing } from '@/theme';
import { formatTime, parseIsoDate } from '@/utils/date';

import type { SupportMessage } from './chat-api';
import { useMarkSupportChatRead, useSendSupportMessage, useSupportChat } from './chat-queries';
import { useSupportChatLive } from './use-support-chat-live';

/**
 * The support chat transcript + composer. Rendered inside the bottom sheet
 * (`SupportChatSheet`) and the full-screen route (`/support/chat`). Owns the
 * data hooks so both hosts stay dumb.
 */
export function SupportChat({ active = true }: { active?: boolean }) {
  const { data, isLoading, isError, error, refetch } = useSupportChat({ enabled: active });
  const conversationId = data?.conversation.id;
  const live = useSupportChatLive(conversationId, active);
  const send = useSendSupportMessage();
  const markRead = useMarkSupportChatRead();

  const [draft, setDraft] = useState('');
  const [sendFailed, setSendFailed] = useState(false);
  const typingStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const messages = useMemo(() => data?.messages ?? [], [data]);
  // FlatList is inverted for sticky-to-bottom behaviour, so feed it reversed.
  const reversed = useMemo(() => [...messages].reverse(), [messages]);

  // Mark staff replies read on open and whenever a new one lands while open.
  const newestId = messages[messages.length - 1]?.id;
  const lastMarked = useRef<string | null>(null);
  useEffect(() => {
    if (!active || !conversationId || isLoading) return;
    if ((data?.conversation.unread_count ?? 0) === 0) return;
    if (lastMarked.current === newestId) return;
    lastMarked.current = newestId ?? null;
    markRead.mutate();
  }, [active, conversationId, isLoading, newestId, data?.conversation.unread_count, markRead]);

  function onDraftChange(text: string) {
    setDraft(text);
    live.sendTyping(text.trim().length > 0);
    if (typingStopRef.current) clearTimeout(typingStopRef.current);
    typingStopRef.current = setTimeout(() => live.sendTyping(false), 3_000);
  }

  function submit() {
    const text = draft.trim();
    if (!text || send.isPending) return;
    setDraft('');
    setSendFailed(false);
    live.sendTyping(false);
    if (typingStopRef.current) clearTimeout(typingStopRef.current);
    send.mutate(text, {
      onError: () => {
        setDraft(text);
        setSendFailed(true);
      },
    });
  }

  if (isError && messages.length === 0) {
    return <ErrorView error={error} onRetry={() => void refetch()} />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
    >
      {isLoading && messages.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand.primary} />
        </View>
      ) : (
        <FlatList
          data={reversed}
          inverted
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={<IntroCard />}
          renderItem={({ item }) => <Bubble message={item} />}
        />
      )}

      <View style={styles.composerWrap}>
        {live.staffTyping ? (
          <AppText variant="caption" color="tertiary" style={styles.hint}>
            Le support est en train d’écrire…
          </AppText>
        ) : !live.connected ? (
          <AppText variant="caption" color="tertiary" style={styles.hint}>
            Reconnexion…
          </AppText>
        ) : null}

        {sendFailed ? (
          <AppText variant="caption" color="error" style={styles.hint}>
            Message non envoyé. Réessayez.
          </AppText>
        ) : null}

        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={onDraftChange}
            placeholder="Écrire au support…"
            placeholderTextColor={colors.text.tertiary}
            style={styles.input}
            multiline
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={submit}
          />
          <Pressable
            onPress={submit}
            disabled={!draft.trim() || send.isPending}
            accessibilityRole="button"
            accessibilityLabel="Envoyer"
            style={[styles.sendButton, (!draft.trim() || send.isPending) && styles.sendButtonOff]}
          >
            <Ionicons
              name="send"
              size={18}
              color={draft.trim() && !send.isPending ? colors.text.inverse : colors.text.tertiary}
            />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function IntroCard() {
  return (
    <View style={styles.intro}>
      <AppText variant="caption" color="tertiary" style={styles.introText}>
        Une question ? Notre équipe vous répond ici, généralement en quelques minutes pendant les
        heures d’ouverture.
      </AppText>
    </View>
  );
}

function Bubble({ message }: { message: SupportMessage }) {
  const mine = message.sender_role === 'user';
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
    <View style={[styles.row, mine ? styles.rowMine : styles.rowPeer]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubblePeer]}>
        {!mine ? (
          <AppText variant="caption" color="brand" style={styles.author}>
            Support Rakeb
          </AppText>
        ) : null}
        <AppText variant="bodySmall" color={mine ? 'inverse' : 'primary'}>
          {message.body}
        </AppText>
        {at ? (
          <AppText
            variant="caption"
            color={mine ? 'inverse' : 'tertiary'}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.lg, gap: spacing.sm, flexGrow: 1, justifyContent: 'flex-end' },
  intro: { paddingBottom: spacing.lg, paddingTop: spacing.xs },
  introText: { textAlign: 'center', lineHeight: 18 },
  row: { flexDirection: 'row' },
  rowMine: { justifyContent: 'flex-end' },
  rowPeer: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    gap: spacing.xxs,
  },
  bubbleMine: { backgroundColor: colors.brand.primary, borderBottomRightRadius: radius.sm },
  bubblePeer: {
    backgroundColor: colors.background.surface,
    borderBottomLeftRadius: radius.sm,
  },
  author: { marginBottom: spacing.xxs },
  time: { alignSelf: 'flex-end', marginTop: spacing.xxs },
  systemRow: { alignItems: 'center', paddingVertical: spacing.xs },
  systemText: { textAlign: 'center' },
  composerWrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.background.default,
  },
  hint: { paddingHorizontal: spacing.xs, paddingBottom: spacing.xs },
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
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.primary,
  },
  sendButtonOff: { backgroundColor: colors.background.disabled },
});
