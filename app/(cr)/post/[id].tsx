import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AppHeader } from "@/components/shared/AppHeader";
import {
  CourseTag,
  DifficultyDot,
  PostTypeChip,
} from "@/components/shared/Chips";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Screen";
import { ErrorState, LoadingState } from "@/components/shared/States";
import { usePostsStore } from "@/stores/postsStore";
import { useSessionStore } from "@/stores/sessionStore";
import { theme } from "@/constants/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { themedStyles } from "@/components/themedStyles";

// ─── CR PostDetail ──────────────────────────────────────────────────
// Same store as the student view, CR affordances on top: Edit/Delete,
// the correctly-counted comment thread for THIS post, and a reply box
// so the CR answers inside the app instead of elsewhere.

export default function CRPostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    posts,
    comments,
    addComment,
    deletePost,
    loadComments,
    load,
    status,
  } = usePostsStore();
  const [reply, setReply] = useState("");
  const [replyError, setReplyError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Cold deep-link: feed may be empty before first load finishes.
  useEffect(() => {
    if (posts.length === 0 && status === "idle") {
      const levelId = useSessionStore.getState().levelId ?? undefined;
      load(levelId);
    }
  }, [posts.length, status, load]);
  useEffect(() => {
    if (id) loadComments(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const post = posts.find((p) => p.id === id);

  if (status === "loading" && !post) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.surface }}
        edges={["top", "bottom"]}
      >
        <AppHeader title="Post · CR" showBack />
        <LoadingState variant="detail" message="Loading post…" />
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.surface }}
        edges={["top", "bottom"]}
      >
        <AppHeader title="Post · CR" showBack />
        <ErrorState
          title="Post not found"
          message="This update may have been deleted."
          actionLabel="Back to posts"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const thread = comments[post.id] ?? [];

  const remove = () =>
    Alert.alert("Delete post?", "Everyone in the level loses this update.", [
      { text: "Keep" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeleteError("");
          setDeleting(true);
          try {
            await deletePost(post.id);
            router.back();
          } catch {
            setDeleting(false);
            setDeleteError(
              "Could not delete. Check your connection and retry.",
            );
          }
        },
      },
    ]);

  const sendReply = async () => {
    if (!reply.trim()) return;
    setReplyError("");
    try {
      await addComment(post.id, reply.trim());
      setReply("");
    } catch {
      setReplyError("Could not send. Check your connection and retry.");
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.surface }}
      edges={["top", "bottom"]}
    >
      <AppHeader title="Post · CR" showBack />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.md }}>
        <Card>
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 8,
            }}
          >
            <CourseTag code={post.courseCode} />
            <PostTypeChip type={post.postType} />
            <DifficultyDot level={post.difficulty} />
          </View>
          <Text style={styles.title}>{post.title}</Text>
          <Text style={styles.meta}>
            {post.author} · {post.createdAt}
          </Text>
          <Text style={styles.content}>{post.content}</Text>
          {!!post.fileUrl && (
            <Pressable
              onPress={() => post.fileUrl && Linking.openURL(post.fileUrl)}
              style={styles.attach}
            >
              <Text style={styles.attachText}>
                Attached file · {(post.fileType ?? "file").toUpperCase()} — tap
                to open
              </Text>
            </Pressable>
          )}
        </Card>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Button
              title="Edit post"
              variant="secondary"
              onPress={() =>
                router.push(`/(cr)/posts/${post.id}/edit` as never)
              }
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title={deleting ? "Deleting…" : "Delete"}
              variant="danger"
              onPress={remove}
            />
          </View>
        </View>
        {!!deleteError && <Text style={styles.error}>{deleteError}</Text>}
        <Text style={styles.section}>Student comments ({thread.length})</Text>
        {thread.map((c) => (
          <Card key={c.id}>
            <Text style={styles.cAuthor}>{c.author}</Text>
            <Text style={styles.cBody}>{c.content}</Text>
          </Card>
        ))}
        {!!replyError && <Text style={styles.error}>{replyError}</Text>}
        <View style={styles.composer}>
          <TextInput
            value={reply}
            onChangeText={setReply}
            placeholder="Reply to this thread…"
            placeholderTextColor={theme.colors.secondary}
            style={styles.input}
          />
          <Pressable onPress={sendReply} style={styles.send}>
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    title: { ...theme.type.title, color: theme.colors.text },
    meta: {
      ...theme.type.caption,
      color: theme.colors.secondary,
      marginBottom: 8,
    },
    content: { ...theme.type.body, color: theme.colors.body },
    attach: {
      marginTop: 12,
      backgroundColor: theme.colors.softBlue,
      borderRadius: theme.radius.md,
      padding: theme.spacing.sm,
      alignItems: "center",
    },
    attachText: {
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.accent,
    },
    row: { flexDirection: "row", gap: 8, marginVertical: 8 },
    section: {
      ...theme.type.title,
      color: theme.colors.text,
      marginVertical: 8,
    },
    cAuthor: { fontFamily: theme.font.bold, fontWeight: "700", fontSize: 13 },
    cBody: { ...theme.type.body, color: theme.colors.body },
    error: {
      ...theme.type.caption,
      color: theme.colors.danger,
      marginVertical: 8,
    },
    composer: { flexDirection: "row", gap: 8, marginTop: 8, marginBottom: 16 },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      paddingHorizontal: 16,
      minHeight: 48,
      ...theme.type.body,
      color: theme.colors.text,
    },
    send: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radius.lg,
      paddingHorizontal: 24,
      justifyContent: "center",
      minHeight: 48,
    },
    sendText: {
      color: theme.colors.onPrimary,
      fontFamily: theme.font.bold,
      fontWeight: "700",
    },
  }),
);
