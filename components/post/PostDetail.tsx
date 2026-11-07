import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import { AppHeader } from "@/components/shared/AppHeader";
import { Button } from "@/components/shared/Button";
import {
  CourseTag,
  DifficultyDot,
  PostTypeChip,
} from "@/components/shared/Chips";
import { ClockIcon, FileIcon, SendIcon } from "@/components/shared/Icons";
import { PressableScale } from "@/components/shared/PressableScale";
import { Card } from "@/components/shared/Screen";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { FormError } from "@/components/shared/AuthScreen";
import {
  ErrorState,
  LoadingState,
  SuccessBanner,
} from "@/components/shared/States";
import { usePostsStore } from "@/stores/postsStore";
import { useSessionStore } from "@/stores/sessionStore";
import { dueTone, formatDateTime, formatDue, timeAgo } from "@/utils/due";
import { formatDueStamp } from "@/utils/dates";
import { confirmAction } from "@/utils/confirm";
import { themedStyles } from "@/components/themedStyles";

// ─── Post detail (shared, both roles) ───────────────────────────────
// Reads the post from the store; unknown ids render a 404, never another
// post. Students can comment; CRs can reply and also Edit / Delete.
// Comments on a post are visible to everyone in the level (the API returns
// the whole thread), and the screen says so.

const TONE = {
  past: theme.colors.danger,
  soon: theme.colors.warning,
  later: theme.colors.text,
  none: theme.colors.text,
} as const;

export function PostDetail({ role }: { role: "student" | "cr" }) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isCR = role === "cr";
  const {
    posts,
    comments,
    addComment,
    deletePost,
    loadComments,
    load,
    status,
  } = usePostsStore();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [openError, setOpenError] = useState("");

  // Cold deep-link: the feed may be empty before the first load finishes.
  useEffect(() => {
    if (posts.length === 0 && status === "idle") {
      load(useSessionStore.getState().levelId ?? undefined);
    }
  }, [posts.length, status, load]);
  useEffect(() => {
    if (id) loadComments(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const post = posts.find((p) => p.id === id);
  const title = isCR ? "Post · CR" : "Post";

  if (status === "loading" && !post) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <AppHeader title={title} showBack />
        <LoadingState variant="detail" message="Loading post…" />
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <AppHeader title={title} showBack />
        <ErrorState
          title="Post not found"
          message="This update may have been deleted."
          actionLabel="Go back"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const thread = comments[post.id] ?? [];
  const due = formatDue(post.dueDate);
  const tone = dueTone(post.dueDate);

  const send = async () => {
    if (!draft.trim()) {
      setError("Write something first.");
      return;
    }
    setError("");
    setSending(true);
    try {
      await addComment(post.id, draft.trim());
      setDraft("");
      setSent(true);
    } catch {
      setError("Could not send. Check your connection and retry.");
    } finally {
      setSending(false);
    }
  };

  const remove = async () => {
    const ok = await confirmAction({
      title: "Delete post?",
      message: "Everyone in the level loses this update and its comments.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    setError("");
    setDeleting(true);
    try {
      await deletePost(post.id);
      router.back();
    } catch {
      setDeleting(false);
      setError("Could not delete. Check your connection and retry.");
    }
  };

  const openFile = async () => {
    setOpenError("");
    try {
      if (post.fileUrl) await Linking.openURL(post.fileUrl);
    } catch {
      setOpenError("Couldn't open the attachment.");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <AppHeader title={title} showBack />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Card>
            <View style={styles.top}>
              <CourseTag code={post.courseCode} />
              <PostTypeChip type={post.postType} />
              <DifficultyDot level={post.difficulty} />
            </View>
            <Text style={styles.title}>{post.title}</Text>
            <Text style={styles.meta}>
              {post.author} · {formatDateTime(post.createdAt)}
            </Text>

            {due ? (
              <View style={styles.due}>
                <ClockIcon color={TONE[tone]} />
                <View>
                  <Text style={[styles.dueMain, { color: TONE[tone] }]}>
                    {due}
                  </Text>
                  <Text style={styles.dueSub}>
                    {formatDueStamp(post.dueDate)}
                  </Text>
                </View>
              </View>
            ) : null}

            <Text style={styles.content}>{post.content}</Text>

            {!!post.fileUrl && (
              <PressableScale
                onPress={openFile}
                style={styles.attach}
                accessibilityRole="link"
                accessibilityLabel="Open attached file"
              >
                <FileIcon color={theme.colors.accent} />
                <Text style={styles.attachText}>
                  Open attachment · {(post.fileType ?? "file").toUpperCase()}
                </Text>
              </PressableScale>
            )}
            <FormError message={openError} />
          </Card>

          {isCR && (
            <View style={styles.crActions}>
              <View style={styles.flex}>
                <Button
                  title="Edit post"
                  variant="secondary"
                  onPress={() =>
                    router.push(`/(cr)/posts/${post.id}/edit` as never)
                  }
                />
              </View>
              <View style={styles.flex}>
                <Button
                  title="Delete"
                  variant="danger"
                  onPress={remove}
                  loading={deleting}
                />
              </View>
            </View>
          )}

          <SectionHeader title={`Comments (${thread.length})`} />
          {thread.length === 0 ? (
            <Text style={styles.empty}>
              {isCR
                ? "No comments yet. Replies you send appear here."
                : "No comments yet. Ask your CR a question below."}
            </Text>
          ) : (
            thread.map((c) => (
              <View key={c.id} style={styles.comment}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(c.author || "?").slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.commentBody}>
                  <View style={styles.commentHead}>
                    <Text style={styles.cAuthor} numberOfLines={1}>
                      {c.author}
                    </Text>
                    <Text style={styles.cMeta}>{timeAgo(c.createdAt)}</Text>
                  </View>
                  <Text style={styles.cBody}>{c.content}</Text>
                </View>
              </View>
            ))
          )}
          <Text style={styles.visibility}>
            Comments on this post are visible to everyone in your level.
          </Text>

          {sent && (
            <SuccessBanner
              message={
                isCR ? "Reply sent." : "Sent. Your CR has been notified."
              }
            />
          )}
          <FormError message={error} />
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={(t) => {
              setDraft(t);
              if (error) setError("");
              if (sent) setSent(false);
            }}
            placeholder={
              isCR ? "Reply to this thread…" : "Ask your CR something…"
            }
            placeholderTextColor={theme.colors.secondary}
            style={styles.input}
            multiline
            maxLength={1000}
            accessibilityLabel="Write a comment"
          />
          <PressableScale
            onPress={send}
            haptic="light"
            disabled={sending || !draft.trim()}
            style={[styles.send, (sending || !draft.trim()) && styles.sendOff]}
            accessibilityRole="button"
            accessibilityLabel="Send comment"
          >
            <SendIcon color={theme.colors.onPrimary} />
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.surface },
    flex: { flex: 1 },
    body: { padding: theme.spacing.md, paddingBottom: theme.spacing.lg },
    top: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
    },
    title: { ...theme.type.hero, color: theme.colors.text },
    meta: {
      ...theme.type.caption,
      color: theme.colors.secondary,
      marginTop: theme.spacing.xs,
      marginBottom: theme.spacing.sm,
    },
    due: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      backgroundColor: theme.colors.muted,
      borderRadius: theme.radius.md,
      padding: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    dueMain: { ...theme.type.mono },
    dueSub: { ...theme.type.caption, color: theme.colors.secondary },
    content: { ...theme.type.body, color: theme.colors.body },
    attach: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.xs,
      marginTop: theme.spacing.sm,
      backgroundColor: theme.colors.softBlue,
      borderRadius: theme.radius.md,
      minHeight: 48,
      paddingHorizontal: theme.spacing.sm,
    },
    attachText: {
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.accent,
    },
    crActions: {
      flexDirection: "row",
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xs,
    },

    empty: { ...theme.type.body, color: theme.colors.secondary },
    comment: {
      flexDirection: "row",
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.sm,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.softBlue,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.accent,
    },
    commentBody: {
      flex: 1,
      backgroundColor: theme.colors.muted,
      borderRadius: theme.radius.md,
      padding: theme.spacing.sm,
      gap: 2,
    },
    commentHead: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: theme.spacing.xs,
    },
    cAuthor: {
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
      flex: 1,
    },
    cMeta: { ...theme.type.caption, color: theme.colors.secondary },
    cBody: { ...theme.type.body, color: theme.colors.body },
    visibility: {
      ...theme.type.caption,
      color: theme.colors.secondary,
      marginBottom: theme.spacing.sm,
    },

    composer: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    input: {
      flex: 1,
      maxHeight: 120,
      minHeight: 48,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      paddingHorizontal: theme.spacing.md,
      paddingTop: 12,
      paddingBottom: 12,
      ...theme.type.body,
      fontSize: 16,
      color: theme.colors.text,
    },
    send: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    sendOff: { opacity: 0.35 },
  }),
);
