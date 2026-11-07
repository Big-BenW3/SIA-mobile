import { useEffect, useRef, useState } from "react";
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
import { Field } from "@/components/shared/Field";
import { Button } from "@/components/shared/Button";
import { SelectChip } from "@/components/shared/Chips";
import { TrashIcon } from "@/components/shared/Icons";
import { PressableScale } from "@/components/shared/PressableScale";
import { SuccessBanner } from "@/components/shared/States";
import { gpaFor, useCgpaStore, type CourseInput } from "@/stores/cgpaStore";
import type { Grade } from "@/types";
import { themedStyles } from "@/components/themedStyles";

// ─── SemesterForm (shared, both roles) ──────────────────────────────
// Validates before it saves: label required, every row needs a code and a
// positive whole unit. Errors sit on the field that caused them. A live GPA
// preview sits in the footer next to Save so the result never surprises.

const GRADES: Grade[] = ["A", "B", "C", "D", "E", "F"];

type Row = CourseInput & { k: number };
type RowErrors = { code?: string; unit?: string };

export function SemesterForm() {
  const router = useRouter();
  const { addSemester } = useCgpaStore();
  const nextKey = useRef(1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [label, setLabel] = useState("");
  const [rows, setRows] = useState<Row[]>([
    { k: 0, code: "", title: "", creditUnit: 3, grade: "A" },
  ]);
  const [labelError, setLabelError] = useState("");
  const [rowErrors, setRowErrors] = useState<Record<number, RowErrors>>({});
  const [savedGpa, setSavedGpa] = useState<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const patch = (k: number, p: Partial<CourseInput>) => {
    setRows((rs) => rs.map((x) => (x.k === k ? { ...x, ...p } : x)));
    setRowErrors((e) => (e[k] ? { ...e, [k]: {} } : e));
  };

  const addRow = () =>
    setRows((rs) => [
      ...rs,
      { k: nextKey.current++, code: "", title: "", creditUnit: 2, grade: "B" },
    ]);

  const removeRow = (k: number) => {
    setRows((rs) => (rs.length > 1 ? rs.filter((x) => x.k !== k) : rs));
    setRowErrors((e) => {
      const { [k]: _gone, ...rest } = e;
      void _gone;
      return rest;
    });
  };

  const submit = () => {
    if (savedGpa !== null) return; // already saved; the screen is closing
    const errs: Record<number, RowErrors> = {};
    let bad = false;
    if (!label.trim()) {
      setLabelError("Give this semester a label first.");
      bad = true;
    } else setLabelError("");
    for (const r of rows) {
      const e: RowErrors = {};
      if (!r.code.trim()) e.code = "Enter a course code.";
      if (!Number.isInteger(r.creditUnit) || r.creditUnit <= 0)
        e.unit = "Whole number above 0.";
      if (e.code || e.unit) {
        errs[r.k] = e;
        bad = true;
      }
    }
    setRowErrors(errs);
    if (bad) return;

    const courses: CourseInput[] = rows.map(({ k: _k, ...r }) => {
      void _k;
      return {
        ...r,
        code: r.code.trim().toUpperCase(),
        title: r.title.trim() || r.code.trim().toUpperCase(),
      };
    });
    const gpa = gpaFor(courses);
    // SQLite writes are synchronous — save for real, then confirm and go.
    addSemester(label.trim(), courses);
    setSavedGpa(gpa);
    timer.current = setTimeout(() => router.back(), 900);
  };

  const preview = gpaFor(rows.filter((r) => r.code.trim() && r.creditUnit > 0));
  const saved = savedGpa !== null;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <AppHeader title="Add semester" showBack />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Field
            label="Semester label"
            value={label}
            onChangeText={(t) => {
              setLabel(t);
              if (labelError) setLabelError("");
            }}
            placeholder="e.g. 1st Semester 300L"
            returnKeyType="next"
            error={labelError || undefined}
            editable={!saved}
          />

          {rows.map((r, i) => {
            const err = rowErrors[r.k] ?? {};
            return (
              <View key={r.k} style={styles.course}>
                <View style={styles.courseHead}>
                  <Text style={styles.courseTitle}>Course {i + 1}</Text>
                  {rows.length > 1 && !saved && (
                    <PressableScale
                      onPress={() => removeRow(r.k)}
                      haptic="light"
                      hitSlop={8}
                      style={styles.remove}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove course ${i + 1}`}
                    >
                      <TrashIcon color={theme.colors.danger} />
                    </PressableScale>
                  )}
                </View>
                <View style={styles.fieldRow}>
                  <View style={styles.codeCol}>
                    <Field
                      label="Course code"
                      value={r.code}
                      onChangeText={(t) => patch(r.k, { code: t })}
                      placeholder="CSC 301"
                      autoCapitalize="characters"
                      autoCorrect={false}
                      returnKeyType="next"
                      error={err.code}
                      editable={!saved}
                    />
                  </View>
                  <View style={styles.unitCol}>
                    <Field
                      label="Unit"
                      value={r.creditUnit ? String(r.creditUnit) : ""}
                      onChangeText={(t) =>
                        patch(r.k, {
                          creditUnit:
                            Number.parseInt(t.replace(/[^0-9]/g, ""), 10) || 0,
                        })
                      }
                      placeholder="3"
                      keyboardType="number-pad"
                      maxLength={2}
                      error={err.unit}
                      editable={!saved}
                    />
                  </View>
                </View>

                <Text style={styles.label}>
                  {r.code.trim() || `Course ${i + 1}`} grade
                </Text>
                <View style={styles.grades} accessibilityRole="radiogroup">
                  {GRADES.map((g) => (
                    <SelectChip
                      key={g}
                      label={g}
                      selected={r.grade === g}
                      onPress={() => patch(r.k, { grade: g })}
                    />
                  ))}
                </View>
              </View>
            );
          })}

          <Button
            title="Add course"
            variant="secondary"
            onPress={addRow}
            disabled={saved}
          />
          {saved && (
            <View style={styles.banner}>
              <SuccessBanner
                message={`Saved. GPA ${savedGpa.toFixed(2)}, CGPA updated.`}
              />
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.previewCol}>
            <Text style={styles.previewLabel}>Semester GPA</Text>
            <Text style={styles.previewValue} accessibilityLiveRegion="polite">
              {preview.toFixed(2)}
            </Text>
          </View>
          <Button
            title="Save & calculate"
            onPress={submit}
            disabled={saved}
            style={styles.save}
          />
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
    course: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    courseHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: theme.spacing.xs,
    },
    courseTitle: { ...theme.type.title, color: theme.colors.text },
    remove: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      marginRight: -theme.spacing.xs,
    },
    fieldRow: { flexDirection: "row", gap: theme.spacing.xs },
    codeCol: { flex: 1 },
    unitCol: { width: 88 },
    label: {
      ...theme.type.caption,
      fontFamily: theme.font.bold,
      fontWeight: "700",
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    grades: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.xs },
    banner: { marginTop: theme.spacing.sm },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    previewCol: { gap: 2 },
    previewLabel: { ...theme.type.caption, color: theme.colors.secondary },
    previewValue: {
      ...theme.type.hero,
      color: theme.colors.text,
      fontVariant: ["tabular-nums"],
    },
    save: { flex: 1 },
  }),
);
