import { useRef, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { StyleSheet, Text, View, type TextInputInstance } from "react-native";
import { theme } from "@/constants/theme";
import { BottomSheet } from "@/components/shared/BottomSheet";
import { Button } from "@/components/shared/Button";
import { Field } from "@/components/shared/Field";
import { FormError } from "@/components/shared/AuthScreen";
import { CloseIcon, FileIcon } from "@/components/shared/Icons";
import { PressableScale } from "@/components/shared/PressableScale";
import { MascotLoader } from "@/components/mascot/MascotLoader";
import {
  MAX_UPLOAD_BYTES,
  UPLOAD_EXTENSIONS,
  sessionApi,
  type CourseDto,
} from "@/services/session.service";
import { ApiError } from "@/services/api";
import { themedStyles } from "@/components/themedStyles";

// ─── Upload a library file (CR / admin) ─────────────────────────────
// Pick a file, name it, upload it into the course. The app refuses types the
// server would reject (same allowlist, 25MB) before spending an upload, and
// shows the server's own message if it still says no. The parent remounts this
// per open (keyed), so every open starts with a clean form.

interface Picked {
  uri: string;
  name: string;
  mimeType: string;
}

function extOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
}

export function UploadSheet({
  visible,
  onClose,
  course,
  semester,
  onUploaded,
}: {
  visible: boolean;
  onClose: () => void;
  course: CourseDto;
  semester: string;
  onUploaded: () => void;
}) {
  const [title, setTitle] = useState("");
  const [picked, setPicked] = useState<Picked | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const titleRef = useRef<TextInputInstance>(null);

  const pick = async () => {
    setError("");
    try {
      const res = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.[0]) return;
      const a = res.assets[0];
      if (!(UPLOAD_EXTENSIONS as readonly string[]).includes(extOf(a.name))) {
        setError(
          `That file type isn't supported. Use ${UPLOAD_EXTENSIONS.join(", ")}.`,
        );
        return;
      }
      if (a.size !== undefined && a.size > MAX_UPLOAD_BYTES) {
        setError("That file is over the 25MB limit.");
        return;
      }
      setPicked({
        uri: a.uri,
        name: a.name,
        mimeType: a.mimeType ?? "application/octet-stream",
      });
      // Suggest a title from the file name the first time.
      setTitle((t) => t || a.name.replace(/\.[^.]+$/, ""));
    } catch {
      setError("Couldn't open the file picker. Try again.");
    }
  };

  const submit = async () => {
    if (!picked) {
      setError("Choose a file first.");
      return;
    }
    if (!title.trim()) {
      setError("Give the file a title.");
      titleRef.current?.focus();
      return;
    }
    setError("");
    setBusy(true);
    try {
      await sessionApi.uploadResource({
        levelId: course.levelId,
        semester,
        courseId: course.id,
        title: title.trim(),
        uri: picked.uri,
        name: picked.name,
        mimeType: picked.mimeType,
      });
      onUploaded();
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Upload failed. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={busy ? () => {} : onClose}
      title={`Upload to ${course.courseCode}`}
    >
      {busy ? (
        <View style={styles.busy}>
          <MascotLoader message="Uploading your file…" />
        </View>
      ) : (
        <>
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
                accessibilityLabel="Remove file"
              >
                <CloseIcon size={18} />
              </PressableScale>
            </View>
          ) : (
            <Button title="Choose a file" variant="secondary" onPress={pick} />
          )}
          <Field
            label="Title"
            value={title}
            onChangeText={(t) => {
              setTitle(t);
              if (error) setError("");
            }}
            placeholder="e.g. Week 4 lecture slides"
            hint="Students see this title."
            inputRef={titleRef}
            returnKeyType="done"
            onSubmitEditing={submit}
          />
          <Text style={styles.note}>
            PDF, Word, PowerPoint, Excel, text, images or zip, up to 25MB.
          </Text>
          <FormError message={error} />
          <Button title="Upload" onPress={submit} />
        </>
      )}
    </BottomSheet>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    busy: { paddingVertical: theme.spacing.lg },
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
    note: { ...theme.type.caption, color: theme.colors.secondary },
  }),
);
