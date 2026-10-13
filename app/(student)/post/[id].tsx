import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '@/constants/theme';
import { AppHeader } from '@/components/shared/AppHeader';
import { CourseTag, DifficultyDot, PostTypeChip } from '@/components/shared/Chips';
import { Card } from '@/components/shared/Screen';
import { ErrorState, LoadingState, SuccessBanner } from '@/components/shared/States';
import { usePostsStore } from '@/stores/postsStore';
import { useSessionStore } from '@/stores/sessionStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { themedStyles } from '@/components/themedStyles';

// ─── Student PostDetail ─────────────────────────────────────────────
// Reads the post from the store. Unknown ids render a 404, never
// another post. Comments persist to the store with sending +
// empty-input states; the success banner confirms the CR was notified.

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { posts, comments, addComment, loadComments, load, status } = usePostsStore();
  const [draft, setDraft] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Cold deep-link: feed may be empty before first load finishes.
  useEffect(() => {
    if (posts.length === 0 && status === 'idle') {
      const levelId = useSessionStore.getState().levelId ?? undefined;
      load(levelId);
    }
  }, [posts.length, status, load]);
  useEffect(() => {
    if (id) loadComments(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const post = posts.find((p) => p.id === id);

  if (status === 'loading' && !post) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }} edges={['top', 'bottom']}>
        <AppHeader title="Post" showBack />
        <LoadingState variant="detail" message="Loading post…" />
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }} edges={['top', 'bottom']}>
        <AppHeader title="Post" showBack />
        <ErrorState title="Post not found" message="This update may have been deleted by your CR." actionLabel="Back to feed" onAction={() => router.back()} />
      </SafeAreaView>
    );
  }

  const thread = comments[post.id] ?? [];

  const send = () => {
    if (!draft.trim()) {
      setError('Write something first.');
      return;
    }
    setError('');
    setSending(true);
    addComment(post.id, draft.trim()).then(
      () => {
        setDraft('');
        setSending(false);
        setSent(true);
      },
      () => {
        setSending(false);
        setError('Could not send. Check your connection and retry.');
      },
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }} edges={['top', 'bottom']}>
      <AppHeader title="Post" showBack />
      <ScrollView contentContainerStyle={styles.body}>
        <Card>
          <View style={styles.top}>
            <CourseTag code={post.courseCode} />
            <PostTypeChip type={post.postType} />
            <DifficultyDot level={post.difficulty} />
          </View>
          <Text style={styles.title}>{post.title}</Text>
          <Text style={styles.meta}>
            {post.author} · {post.createdAt}
            {post.dueDate ? ` · Due ${post.dueDate}` : ''}
          </Text>
          <Text style={styles.content}>{post.content}</Text>
          {!!post.fileUrl && (
            <Pressable onPress={() => post.fileUrl && Linking.openURL(post.fileUrl)} style={styles.attach}>
              <Text style={styles.attachText}>
                Attached file · {(post.fileType ?? 'file').toUpperCase()} — tap to open
              </Text>
            </Pressable>
          )}
        </Card>

        <Text style={styles.section}>Comments</Text>
        {thread.map((c) => (
          <View key={c.id} style={styles.comment}>
            <Text style={styles.cAuthor}>{c.author}</Text>
            <Text style={styles.cBody}>{c.content}</Text>
            <Text style={styles.cMeta}>{c.createdAt}</Text>
          </View>
        ))}
        <Text style={styles.private}>Only you and your CR see this exchange.</Text>

        {sent && <SuccessBanner message="Sent — your CR has been notified." />}
        {!!error && <Text style={styles.error}>{error}</Text>}
        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={(t) => {
              setDraft(t);
              if (error) setError('');
              setSent(false);
            }}
            placeholder="Ask your CR something…"
            placeholderTextColor={theme.colors.secondary}
            style={styles.input}
          />
          <Pressable onPress={send} style={[styles.send, sending && { opacity: 0.6 }]} disabled={sending}>
            <Text style={styles.sendText}>{sending ? '…' : 'Send'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  body: { padding: theme.spacing.md, paddingBottom: 32 },
  top: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  title: { ...theme.type.title, color: theme.colors.text, marginBottom: 4 },
  meta: { ...theme.type.caption, color: theme.colors.secondary, marginBottom: 8 },
  content: { ...theme.type.body, color: theme.colors.body },
  attach: {
    marginTop: 12, backgroundColor: theme.colors.softBlue, borderRadius: theme.radius.md,
    padding: theme.spacing.sm, alignItems: 'center',
  },
  attachText: { ...theme.type.caption, fontFamily: theme.font.bold, fontWeight: '700', color: theme.colors.accent },
  section: { ...theme.type.title, color: theme.colors.text, marginVertical: 16 },
  comment: { backgroundColor: theme.colors.muted, borderRadius: theme.radius.md, padding: theme.spacing.sm, marginBottom: 8 },
  cAuthor: { fontFamily: theme.font.bold, fontWeight: '700', fontSize: 13, color: theme.colors.text },
  cBody: { ...theme.type.body, color: theme.colors.body },
  cMeta: { ...theme.type.caption, color: theme.colors.secondary },
  private: { ...theme.type.caption, color: theme.colors.secondary, marginBottom: 8 },
  error: { ...theme.type.caption, color: theme.colors.danger, marginBottom: 8 },
  composer: { flexDirection: 'row', gap: 8, marginTop: 8 },
  input: {
    flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg,
    paddingHorizontal: 16, minHeight: 48, ...theme.type.body, color: theme.colors.text,
  },
  send: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.lg, paddingHorizontal: 24, justifyContent: 'center', minHeight: 48 },
  sendText: { color: theme.colors.onPrimary, fontFamily: theme.font.bold, fontWeight: '700' },
}));
