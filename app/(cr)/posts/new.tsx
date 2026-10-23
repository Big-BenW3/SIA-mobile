import { useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import { AppHeader } from "@/components/shared/AppHeader";
import { Field } from "@/components/shared/Field";
import { Button } from "@/components/shared/Button";
import { ErrorState, SuccessBanner } from "@/components/shared/States";
import { usePostDraftStore, usePostsStore } from "@/stores/postsStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useAuthStore } from "@/stores/authStore";
import type { Difficulty, PostType } from "@/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { themedStyles } from "@/components/themedStyles";

// ─── NewPost (CR only) ──────────────────────────────────────────────
// Publishing validates, POSTs to the backend (which fans out the level
// push), and confirms. Drafts stay local so an interrupted composer
// restores on reopen.

const TYPES: PostType[] = ["assignment", "test", "lecture", "announcement"];
const DIFFS: Difficulty[] = ["easy", "medium", "hard"];

export default function NewPost() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addPost } = usePostsStore();
  const { draft, saveDraft } = usePostDraftStore();
  const { courses } = useSessionStore();
  const [course, setCourse] = useState(
    draft?.courseCode ?? courses[0]?.courseCode ?? "",
  );
  const [type, setType] = useState<PostType>(draft?.postType ?? "assignment");
  const [title, setTitle] = useState(draft?.title ?? "");
  const [content, setContent] = useState(draft?.content ?? "");
  const [due, setDue] = useState(
    typeof draft?.dueDate === "string" ? draft.dueDate : "",
  );
  const [diff, setDiff] = useState<Difficulty | null>(
    draft?.difficulty ?? "medium",
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  // Optional attachment from the device picker — sent multipart with the post.
  const [picked, setPicked] = useState<{
    uri: string;
    name: string;
    mimeType: string;
  } | null>(null);

  const pickFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    setPicked({
      uri: a.uri,
      name: a.name,
      mimeType: a.mimeType ?? "application/octet-stream",
    });
  };

  const snapshot = () => {
    const match = courses.find((c) => c.courseCode === course);
    return {
      courseId: match?.id ?? "",
      courseCode: course,
      postType: type,
      title,
      content,
      dueDate: due.trim() || null,
      difficulty: diff,
    };
  };

  const publish = async () => {
    if (!title.trim()) {
      setError("Give your post a title.");
      return;
    }
    if (!content.trim()) {
      setError("Add the details students need.");
      return;
    }
    const s = snapshot();
    if (!s.courseId) {
      setError("Pick a course for this post.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await addPost({
        courseId: s.courseId,
        courseCode: s.courseCode,
        author: user?.fullName ? `${user.fullName} (CR)` : "CR",
        title: s.title.trim(),
        content: s.content.trim(),
        postType: s.postType,
        difficulty: s.difficulty,
        dueDate: s.dueDate,
        file: picked,
      });
      saveDraft(null);
      setBusy(false);
      setDone(true);
      setTimeout(() => router.back(), 900);
    } catch (err) {
      setBusy(false);
      setError(
        err instanceof Error
          ? err.message
          : "Could not publish. Check your connection.",
      );
    }
  };

  const saveAsDraft = () => {
    saveDraft({ ...snapshot(), title, content });
    router.back();
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.surface }}
      edges={["top", "bottom"]}
    >
      <AppHeader title="New post" showBack />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.label}>Course (mandatory)</Text>
        <View style={styles.wrap}>
          {courses.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => setCourse(c.courseCode)}
              style={[
                styles.chip,
                course === c.courseCode && styles.chipActive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  course === c.courseCode && { color: theme.colors.onPrimary },
                ]}
              >
                {c.courseCode}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Post type</Text>
        <View style={styles.wrap}>
          {TYPES.map((t) => (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              style={[styles.chip, type === t && styles.chipActive]}
            >
              <Text
                style={[
                  styles.chipText,
                  type === t && { color: theme.colors.onPrimary },
                ]}
              >
                {t}
              </Text>
            </Pressable>
          ))}
        </View>
        <Field
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Assignment 3 — Graphs due Friday"
        />
        <Field
          label="Content"
          value={content}
          onChangeText={setContent}
          placeholder="Details, links, submission format…"
          multiline
        />
        <Field
          label="Due date (optional)"
          value={due}
          onChangeText={setDue}
          placeholder="e.g. Friday, 5pm"
        />
        <Text style={styles.label}>
          Difficulty (optional — leave blank for simple notices)
        </Text>
        <View style={styles.wrap}>
          {DIFFS.map((d) => (
            <Pressable
              key={d}
              onPress={() => setDiff(diff === d ? null : d)}
              style={[styles.chip, diff === d && styles.chipActive]}
            >
              <Text
                style={[
                  styles.chipText,
                  diff === d && { color: theme.colors.onPrimary },
                ]}
              >
                {d}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Attachment (optional — image or file)</Text>
        <Button
          title={picked ? `Attached: ${picked.name}` : "Attach from device"}
          variant="secondary"
          onPress={pickFile}
        />
        {!!picked && (
          <Button
            title="Remove attachment"
            variant="ghost"
            onPress={() => setPicked(null)}
          />
        )}
        {!!error && <ErrorState title="Check this entry" message={error} />}
        {done && (
          <SuccessBanner message="Published. Your level has been notified." />
        )}
        <Button
          title={busy ? "Publishing…" : "Post to level"}
          onPress={publish}
        />
        <View style={{ height: 8 }} />
        <Button
          title="Save as draft (local)"
          variant="secondary"
          onPress={saveAsDraft}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    body: { padding: theme.spacing.md, paddingBottom: 32 },
    label: {
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
      marginBottom: 8,
      marginTop: 8,
    },
    wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
    chip: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 999,
      paddingHorizontal: 16,
      minHeight: 44,
      justifyContent: "center",
    },
    chipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    chipText: {
      fontFamily: theme.font.bold,
      fontWeight: "700",
      fontSize: 13,
      color: theme.colors.text,
      textTransform: "capitalize",
    },
  }),
);
