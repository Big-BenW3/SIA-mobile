import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import { AppHeader } from "@/components/shared/AppHeader";
import { Field } from "@/components/shared/Field";
import { Button } from "@/components/shared/Button";
import { ErrorState, SuccessBanner } from "@/components/shared/States";
import { usePostsStore } from "@/stores/postsStore";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── EditPost (CR only) ─────────────────────────────────────────────
// Unknown ids 404. Saves validate, persist to the store and confirm;
// delete confirms, removes post + thread, and returns.

export default function EditPost() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { posts, updatePost, deletePost } = usePostsStore();
  const post = posts.find((p) => p.id === id);
  const [title, setTitle] = useState(post?.title ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!post) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.surface }}
        edges={["top", "bottom"]}
      >
        <AppHeader title="Edit post" showBack />
        <ErrorState
          title="Post not found"
          message="This update may have been deleted."
          actionLabel="Back to posts"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const save = async () => {
    if (!title.trim()) {
      setError("Give your post a title.");
      return;
    }
    if (!content.trim()) {
      setError("Add the details students need.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await updatePost(post.id, {
        title: title.trim(),
        content: content.trim(),
      });
      setBusy(false);
      setSaved(true);
      setTimeout(() => router.back(), 700);
    } catch (err) {
      setBusy(false);
      setError(
        err instanceof Error
          ? err.message
          : "Could not save. Check your connection.",
      );
    }
  };

  const remove = () =>
    Alert.alert(
      "Delete post?",
      "Main CRs can remove any post in the level; assistants only their own.",
      [
        { text: "Keep" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePost(post.id);
              router.back();
            } catch {
              setError("Could not delete. Check your connection and retry.");
            }
          },
        },
      ],
    );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.surface }}
      edges={["top", "bottom"]}
    >
      <AppHeader title="Edit post" showBack />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.md }}>
        <Field label="Title" value={title} onChangeText={setTitle} />
        <Field
          label="Content"
          value={content}
          onChangeText={setContent}
          multiline
        />
        {!!error && <ErrorState title="Check this entry" message={error} />}
        {saved && <SuccessBanner message="Changes saved." />}
        <Button title={busy ? "Saving…" : "Save changes"} onPress={save} />
        <View style={{ height: 8 }} />
        <Button title="Delete post" variant="danger" onPress={remove} />
      </ScrollView>
    </SafeAreaView>
  );
}
