import { useEffect, useMemo, useRef, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import { AppHeader } from "@/components/shared/AppHeader";
import { Button } from "@/components/shared/Button";
import { SelectChip } from "@/components/shared/Chips";
import { DifficultyPicker } from "@/components/shared/DifficultyPicker";
import { Field } from "@/components/shared/Field";
import { FormError } from "@/components/shared/AuthScreen";
import { CloseIcon, FileIcon } from "@/components/shared/Icons";
import { PressableScale } from "@/components/shared/PressableScale";
import { SuccessBanner } from "@/components/shared/States";
import { usePostDraftStore, usePostsStore } from "@/stores/postsStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useAuthStore } from "@/stores/authStore";
import type { PostDto } from "@/services/posts.service";
import type { Difficulty, PostType } from "@/types";
import {
  TIME_CHOICES,
  dueDayChoices,
  dueIso,
  formatDay,
  formatDueStamp,
  isoDay,
  type TimeChoice,
} from "@/utils/dates";
import { themedStyles } from "@/components/themedStyles";

// ─── Post composer (CR only) ────────────────────────────────────────
// One form for "New post" and "Edit post". New posts pick a course, a type and
// optionally a file; both can set title, details, difficulty and a due date.
// The due date is built from a picked day + time because the API accepts only
// a real timestamp. Publishing POSTs to the backend (which fans out the level
// notification). Drafts stay on the device so an interrupted composer
// restores on reopen.

const TYPES: { value: PostType; label: string }[] = [
  { value: "assignment", label: "Assignment" },
  { value: "test", label: "Test" },
  { value: "lecture", label: "Lecture" },
  { value: "announcement", label: "Notice" },
];

function matchTime(d: Date): TimeChoice {
  const found = TIME_CHOICES.find(
    (t) => t.hour === d.getHours() && t.minute === d.getMinutes(),
  );
  if (found) return found;
  return {
    key: "custom",
    label: d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }),
    hour: d.getHours(),
    minute: d.getMinutes(),
  };
}

export function PostForm({ post }: { post?: PostDto }) {
  const edit = !!post;
  const router = useRouter();
  const { user } = useAuthStore();
  const { addPost, updatePost } = usePostsStore();
  const { draft, saveDraft } = usePostDraftStore();
  const { courses, levelName } = useSessionStore();
  const seed = edit ? undefined : draft;

  const [course, setCourse] = useState(
    seed?.courseCode ?? courses[0]?.courseCode ?? "",
  );
  const [type, setType] = useState<PostType>(seed?.postType ?? "assignment");
  const [title, setTitle] = useState(post?.title ?? seed?.title ?? "");
  const [content, setContent] = useState(post?.content ?? seed?.content ?? "");
  const [diff, setDiff] = useState<Difficulty | null>(
    post ? post.difficulty : (seed?.difficulty ?? "medium"),
  );

  const seedDue =
    post?.dueDate ?? (typeof seed?.dueDate === "string" ? seed.dueDate : null);
  const seedDate =
    seedDue && !Number.isNaN(new Date(seedDue).getTime())
      ? new Date(seedDue)
      : null;
  const [dueDay, setDueDay] = useState<string | null>(
    seedDate ? isoDay(seedDate) : null,
  );
  const [dueTime, setDueTime] = useState<TimeChoice>(
    seedDate ? matchTime(seedDate) : TIME_CHOICES[2],
  );

  const [picked, setPicked] = useState<{
    uri: string;
    name: string;
    mimeType: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  // Day chips: the quick picks, plus the restored/current day if it isn't one.
  const dayChoices = useMemo(() => {
    const base = dueDayChoices();
    if (dueDay && !base.some((c) => c.value === dueDay)) {
      return [
        base[0],
        { key: "current", label: formatDay(dueDay), value: dueDay },
        ...base.slice(1),
      ];
    }
    return base;
  }, [dueDay]);
  const timeChoices = useMemo(
    () =>
      TIME_CHOICES.some((t) => t.key === dueTime.key)
        ? TIME_CHOICES
        : [...TIME_CHOICES, dueTime],
    [dueTime],
  );

  const dueValue = dueDay ? dueIso(dueDay, dueTime) : null;

  const pickFile = async () => {
    try {
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
    } catch {
      setError("Couldn't open the file picker. Try again.");
    }
  };

  const validate = () => {
    if (!title.trim()) return "Give your post a title.";
    if (!content.trim()) return "Add the details students need.";
    if (!edit && !courses.find((c) => c.courseCode === course))
      return "Pick a course for this post.";
    return "";
  };

  const submit = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setBusy(true);
    try {
      if (post) {
        await updatePost(post.id, {
          title: title.trim(),
          content: content.trim(),
          difficulty: diff,
          dueDate: dueValue,
        });
      } else {
        const match = courses.find((c) => c.courseCode === course);
        await addPost({
          courseId: match?.id ?? "",
          courseCode: course,
          author: user?.fullName ? `${user.fullName} (CR)` : "CR",
          title: title.trim(),
          content: content.trim(),
          postType: type,
          difficulty: diff,
          dueDate: dueValue,
          file: picked,
        });
        saveDraft(null);
      }
      setDone(true);
      timer.current = setTimeout(() => router.back(), edit ? 700 : 900);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : edit
            ? "Could not save. Check your connection."
            : "Could not publish. Check your connection.",
      );
    } finally {
      setBusy(false);
    }
  };

  const saveAsDraft = () => {
    const match = courses.find((c) => c.courseCode === course);
    saveDraft({
      courseId: match?.id ?? "",
      courseCode: course,
      postType: type,
      title,
      content,
      dueDate: dueValue,
      difficulty: diff,
    });
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <AppHeader title={edit ? "Edit post" : "New post"} showBack />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.column}>
            {!edit && (
              <>
                <Group label="Course">
                  {courses.length === 0 ? (
                    <Text style={styles.note}>
                      No courses for your level yet. An admin adds them for the
                      semester.
                    </Text>
                  ) : (
                    courses.map((c) => (
                      <SelectChip
                        key={c.id}
                        label={c.courseCode}
                        selected={course === c.courseCode}
                        onPress={() => setCourse(c.courseCode)}
                      />
                    ))
                  )}
                </Group>
                <Group label="Type">
                  {TYPES.map((t) => (
                    <SelectChip
                      key={t.value}
                      label={t.label}
                      selected={type === t.value}
                      onPress={() => setType(t.value)}
                    />
                  ))}
                </Group>
              </>
            )}

            <Field
              label="Title"
              value={title}
              onChangeText={(t) => {
                setTitle(t);
                if (error) setError("");
              }}
              placeholder="e.g. Assignment 3: Graphs"
              returnKeyType="next"
              submitBehavior="blurAndSubmit"
            />
            <Field
              label="Details"
              value={content}
              onChangeText={(t) => {
                setContent(t);
                if (error) setError("");
              }}
              placeholder="What students need to do, links, submission format…"
              multiline
            />

            <Group label="Due">
              {dayChoices.map((c) => (
                <SelectChip
                  key={c.key}
                  label={c.label}
                  selected={dueDay === c.value}
                  onPress={() => setDueDay(c.value)}
                />
              ))}
            </Group>
            {dueDay && (
              <Group label="Time">
                {timeChoices.map((t) => (
                  <SelectChip
                    key={t.key}
                    label={t.label}
                    selected={dueTime.key === t.key}
                    onPress={() => setDueTime(t)}
                  />
                ))}
              </Group>
            )}
            {dueValue && (
              <Text style={styles.summary}>Due {formatDueStamp(dueValue)}</Text>
            )}

            <DifficultyPicker
              value={diff}
              onChange={setDiff}
              allowNone
              label="Difficulty (optional; skip for simple notices)"
            />

            {!edit && (
              <View style={styles.attachBlock}>
                <Text style={styles.label}>Attachment (optional)</Text>
                {picked ? (
                  <View style={styles.file}>
                    <FileIcon color={theme.colors.accent} />
                    <Text style={styles.fileName} numberOfLines={1}>
                      {picked.name}
                    </Text>
                    <PressableScale
                      onPress={() => setPicked(null)}
                      hitSlop={8}
                      style={styles.remove}
                      accessibilityRole="button"
                      accessibilityLabel="Remove attachment"
                    >
                      <CloseIcon size={18} />
                    </PressableScale>
                  </View>
                ) : (
                  <Button
                    title="Attach a file or image"
                    variant="secondary"
                    onPress={pickFile}
                  />
                )}
              </View>
            )}

            <FormError message={error} />
            {done && (
              <SuccessBanner
                message={
                  edit
                    ? "Changes saved."
                    : `Published. ${levelName || "Your level"} has been notified.`
                }
              />
            )}

            <Button
              title={edit ? "Save changes" : "Post to level"}
              onPress={submit}
              loading={busy}
              disabled={done}
            />
            {!edit && (
              <>
                <Text style={styles.note}>
                  Everyone in {levelName || "your level"} gets a notification.
                </Text>
                <Button
                  title="Save as draft"
                  variant="secondary"
                  onPress={saveAsDraft}
                  disabled={busy || done}
                />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.group} accessibilityRole="radiogroup">
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.surface },
    flex: { flex: 1 },
    body: {
      padding: theme.spacing.md,
      paddingBottom: theme.spacing.xl,
      flexGrow: 1,
      alignItems: "center",
    },
    column: { width: "100%", maxWidth: 560, gap: theme.spacing.xs },
    group: { marginBottom: theme.spacing.sm },
    label: {
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.xs },
    summary: {
      ...theme.type.mono,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    attachBlock: { marginBottom: theme.spacing.sm },
    file: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      backgroundColor: theme.colors.softBlue,
      borderRadius: theme.radius.md,
      paddingLeft: theme.spacing.sm,
    },
    fileName: {
      ...theme.type.body,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
      flex: 1,
    },
    remove: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    note: {
      ...theme.type.caption,
      color: theme.colors.secondary,
      textAlign: "center",
    },
  }),
);
