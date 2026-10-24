import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import { AppHeader } from "@/components/shared/AppHeader";
import { Button } from "@/components/shared/Button";
import { Field } from "@/components/shared/Field";
import { ChevronIcon } from "@/components/shared/Icons";
import { Card } from "@/components/shared/Screen";
import { useAuthStore } from "@/stores/authStore";
import { usersApi } from "@/services/users.service";
import { ApiError } from "@/services/api";
import { useCgpaStore } from "@/stores/cgpaStore";
import { useGoalsStore } from "@/stores/goalsStore";
import { useSessionStore } from "@/stores/sessionStore";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { themedStyles } from "@/components/themedStyles";

// ─── Profile ────────────────────────────────────────────────────────
// Grouped sections, one concern each: identity → academics → goals →
// notifications → support → account. Destructive action (logout) sits last
// and alone. Goals persist in on-device SQLite via goalsStore.

export default function StudentProfile() {
  const router = useRouter();
  const { user, logout, updateProfile } = useAuthStore();
  // The update sheet claims the bottom edge, so it owns the home-indicator
  // inset rather than relying on a magic number.
  const insets = useSafeAreaInsets();

  // Editable identity (profile update sheet).
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.fullName ?? "");
  const [email] = useState(user?.email ?? "");
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState("");

  const saveProfile = async () => {
    if (!name.trim()) {
      setNameError("Enter your full name.");
      return;
    }
    setNameError("");
    setSaving(true);
    try {
      await updateProfile(name.trim());
      setSaving(false);
      setEditing(false);
    } catch {
      setSaving(false);
      setNameError("Could not save. Check your connection.");
    }
  };

  // Change password. The backend verifies the current one before re-hashing,
  // so the old password is mandatory — there is no reset-by-email in v1.
  const [pwOpen, setPwOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const savePassword = async () => {
    if (!currentPw) {
      setPwError("Enter your current password.");
      return;
    }
    if (newPw.length < 6) {
      setPwError("New password must be at least 6 characters.");
      return;
    }
    setPwError("");
    setPwSaving(true);
    try {
      await usersApi.updateMe({
        currentPassword: currentPw,
        newPassword: newPw,
      });
      setPwSaving(false);
      setPwOpen(false);
      setCurrentPw("");
      setNewPw("");
    } catch (err) {
      setPwSaving(false);
      setPwError(
        err instanceof ApiError
          ? err.message
          : "Could not change your password.",
      );
    }
  };

  // Notification preferences (real backend; load once, save per toggle).
  const [postAlerts, setPostAlerts] = useState(true);
  const [reminders, setReminders] = useState(true);

  useEffect(() => {
    usersApi.prefs().then(
      (p) => {
        setPostAlerts(p.postAlerts);
        setReminders(p.reminders);
      },
      () => {},
    );
  }, []);

  const flipPref = (key: "postAlerts" | "reminders", value: boolean) => {
    if (key === "postAlerts") setPostAlerts(value);
    else setReminders(value);
    usersApi.updatePrefs({ [key]: value }).catch(() => {
      // Revert on failure so the switch never lies.
      if (key === "postAlerts") setPostAlerts(!value);
      else setReminders(!value);
    });
  };

  // Goals live in on-device SQLite (goalsStore) — personal, never synced.
  const { goals, addGoal } = useGoalsStore();
  const [adding, setAdding] = useState(false);
  const [gTitle, setGTitle] = useState("");
  const [gDetail, setGDetail] = useState("");
  const [gError, setGError] = useState("");

  // Derived academics from the CGPA store (credit-weighted, shared).
  const { semesters, cgpa: calcCgpa } = useCgpaStore();
  const { courses, semester: currentSemester, sessionYear } = useSessionStore();
  const cgpa = semesters.length ? calcCgpa().toFixed(2) : "—";
  const levelLine =
    [
      user?.level,
      currentSemester ? `${currentSemester} Semester` : null,
      sessionYear || null,
    ]
      .filter(Boolean)
      .join(" · ") || "No level set";

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <AppHeader title="Profile" />

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Identity: who the app is serving ── */}
        <Card>
          <View style={styles.idRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user?.fullName ?? "S").slice(0, 1)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{user?.fullName ?? "Student"}</Text>
              <Text style={styles.meta}>{user?.email}</Text>
              <View style={styles.pill}>
                <Text style={styles.pillText}>{levelLine}</Text>
              </View>
            </View>
          </View>
          <Button
            title="Update profile"
            variant="secondary"
            onPress={() => setEditing(true)}
          />
        </Card>

        {/* ── Academic profile: standing at a glance ── */}
        <Text style={styles.heading}>Academic profile</Text>
        <Card>
          <Row
            label="Current CGPA"
            value={cgpa}
            onPress={() => router.push("/(student)/cgpa/overview" as never)}
          />
          <Divider />
          <Row
            label="Semesters tracked"
            value={String(semesters.length)}
            onPress={() => router.push("/(student)/cgpa/overview" as never)}
          />
          <Divider />
          <Row
            label="Courses this semester"
            value={String(courses.length)}
            onPress={() => router.push("/(student)/resources" as never)}
          />
        </Card>

        {/* ── Goals: momentum the student chose for themselves ── */}
        <Text style={styles.heading}>My goals</Text>
        <Card>
          {goals.map((g) => (
            <View key={g.id} style={styles.goal}>
              <View style={styles.goalRow}>
                <Text style={styles.goalTitle}>{g.title}</Text>
                <Text style={styles.goalPct}>{g.pct}%</Text>
              </View>
              <Text style={styles.goalDetail}>{g.detail}</Text>
              <View style={styles.bar}>
                <View style={[styles.barFill, { width: `${g.pct}%` }]} />
              </View>
            </View>
          ))}
          {adding ? (
            <View>
              <Field
                label="Goal"
                value={gTitle}
                onChangeText={(t) => {
                  setGTitle(t);
                  if (gError) setGError("");
                }}
                placeholder="e.g. Read 2 papers weekly"
                error={gError}
              />
              <Field
                label="How you measure it"
                value={gDetail}
                onChangeText={setGDetail}
                placeholder="e.g. 0 of 2 this week"
              />
              <Button
                title="Add goal"
                onPress={() => {
                  if (!gTitle.trim()) {
                    setGError("Give the goal a name.");
                    return;
                  }
                  // SQLite-backed: survives restarts, never leaves the phone.
                  addGoal(gTitle.trim(), gDetail.trim());
                  setGTitle("");
                  setGDetail("");
                  setAdding(false);
                }}
              />
              <View style={{ height: 8 }} />
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setAdding(false)}
              />
            </View>
          ) : (
            <Button
              title="New goal"
              variant="ghost"
              onPress={() => setAdding(true)}
            />
          )}
        </Card>

        {/* ── Notifications: explicit, per-category control ── */}
        <Text style={styles.heading}>Notifications</Text>
        <Card>
          <View style={styles.toggle}>
            <Text style={styles.toggleLabel}>Level post alerts</Text>
            <Switch
              value={postAlerts}
              onValueChange={(v) => flipPref("postAlerts", v)}
              trackColor={{ true: theme.colors.primary }}
            />
          </View>
          <Divider />
          <View style={styles.toggle}>
            <Text style={styles.toggleLabel}>Study reminders</Text>
            <Switch
              value={reminders}
              onValueChange={(v) => flipPref("reminders", v)}
              trackColor={{ true: theme.colors.primary }}
            />
          </View>
        </Card>

        {/* ── Support + product info ── */}
        <Text style={styles.heading}>Support</Text>
        <Card>
          <Row
            label="Help center"
            value="FAQs"
            onPress={() =>
              Alert.alert(
                "Help center",
                "FAQs and guides ship with the backend. Contact your CR for help today.",
              )
            }
          />
          <Divider />
          <Row
            label="About SuperStack"
            value="v1.0"
            onPress={() =>
              Alert.alert(
                "About SuperStack",
                "One trusted home per level: verified CR updates, a personal study planner, course files and a CGPA tracker.",
              )
            }
          />
        </Card>

        {/* ── Account: destructive action isolated at the end ── */}
        <Text style={styles.heading}>Account settings</Text>
        <Card>
          <Row
            label="Change password"
            value=""
            onPress={() => setPwOpen(true)}
          />
          <Divider />
          <Pressable
            onPress={() =>
              Alert.alert(
                "Log out?",
                "You will need your email to sign back in.",
                [
                  { text: "Stay" },
                  { text: "Log out", style: "destructive", onPress: logout },
                ],
              )
            }
            style={styles.logout}
          >
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </Card>
        <Text style={styles.version}>SuperStack · v1.0</Text>
      </ScrollView>

      {/* ── Profile update sheet (name editable, level read-only) ── */}
      <Modal
        visible={editing}
        animationType="slide"
        transparent
        onRequestClose={() => setEditing(false)}
      >
        <View style={styles.sheetOverlay}>
          <View
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, theme.spacing.md) },
            ]}
          >
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Update profile</Text>
            <Field
              label="Full name"
              value={name}
              onChangeText={(t) => {
                setName(t);
                if (nameError) setNameError("");
              }}
              placeholder="Your name"
              error={nameError}
            />
            <Field
              label="Email (cannot be changed here)"
              value={email}
              onChangeText={() => {}}
              placeholder=""
            />
            <Text style={styles.sheetNote}>
              Your level is set by your join code. Ask your CR to change it.
            </Text>
            <Button
              title={saving ? "Saving…" : "Save changes"}
              onPress={saveProfile}
            />
            <View style={{ height: 8 }} />
            <Button
              title="Cancel"
              variant="secondary"
              onPress={() => setEditing(false)}
            />
          </View>
        </View>
      </Modal>

      {/* ── Change password sheet ── */}
      <Modal
        visible={pwOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPwOpen(false)}
      >
        <View style={styles.sheetOverlay}>
          <View
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, theme.spacing.md) },
            ]}
          >
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Change password</Text>
            <Field
              label="Current password"
              value={currentPw}
              onChangeText={(t) => {
                setCurrentPw(t);
                if (pwError) setPwError("");
              }}
              placeholder="Your current password"
              secureTextEntry
            />
            <Field
              label="New password"
              value={newPw}
              onChangeText={(t) => {
                setNewPw(t);
                if (pwError) setPwError("");
              }}
              placeholder="At least 6 characters"
              secureTextEntry
              error={pwError}
            />
            <Text style={styles.sheetNote}>
              You stay signed in on this device. Use your new password next time
              you log in.
            </Text>
            <Button
              title={pwSaving ? "Saving…" : "Update password"}
              onPress={savePassword}
              disabled={pwSaving}
            />
            <View style={{ height: 8 }} />
            <Button
              title="Cancel"
              variant="secondary"
              onPress={() => setPwOpen(false)}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Small building blocks ──────────────────────────────────────────
// Tappable setting row: label left, value + chevron right (iOS convention).
function Row({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        {!!value && <Text style={styles.rowValue}>{value}</Text>}
        <ChevronIcon />
      </View>
    </Pressable>
  );
}

// Hairline separator between rows in the same card.
function Divider() {
  return <View style={styles.divider} />;
}

const styles = themedStyles(() =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.colors.background },
    body: {
      padding: theme.spacing.md,
      paddingBottom: theme.layout.tabClearance,
    },

    // Identity
    idRow: {
      flexDirection: "row",
      gap: 12,
      alignItems: "center",
      marginBottom: 12,
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      color: theme.colors.onPrimary,
      fontSize: 28,
      fontWeight: "700",
      fontFamily: theme.font.bold,
    },
    name: { ...theme.type.title, color: theme.colors.text },
    meta: {
      ...theme.type.caption,
      color: theme.colors.secondary,
      marginBottom: 4,
    },
    pill: {
      alignSelf: "flex-start",
      backgroundColor: theme.colors.softBlue,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    pillText: {
      fontSize: 12,
      fontWeight: "700",
      fontFamily: theme.font.bold,
      color: theme.colors.accent,
    },

    // Sections
    heading: {
      fontSize: 12,
      fontWeight: "700",
      fontFamily: theme.font.bold,
      letterSpacing: 1.5,
      textTransform: "uppercase",
      color: theme.colors.secondary,
      marginTop: 16,
      marginBottom: 8,
    },

    // Rows
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 10,
      minHeight: 48,
    },
    rowLabel: { ...theme.type.body, color: theme.colors.text },
    rowRight: { flexDirection: "row", alignItems: "center", gap: 4 },
    rowValue: {
      ...theme.type.body,
      color: theme.colors.secondary,
      fontVariant: ["tabular-nums"],
    },
    divider: { height: 1, backgroundColor: theme.colors.border },
    logout: { paddingVertical: 10, minHeight: 48, justifyContent: "center" },
    logoutText: {
      ...theme.type.body,
      fontWeight: "700",
      fontFamily: theme.font.bold,
      color: theme.colors.danger,
    },

    // Goals
    goal: { marginBottom: 12 },
    goalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    goalTitle: {
      ...theme.type.body,
      fontWeight: "700",
      fontFamily: theme.font.bold,
      color: theme.colors.text,
    },
    goalPct: {
      fontSize: 13,
      fontWeight: "700",
      fontFamily: theme.font.bold,
      color: theme.colors.accent,
      fontVariant: ["tabular-nums"],
    },
    goalDetail: {
      ...theme.type.caption,
      color: theme.colors.secondary,
      marginBottom: 6,
    },
    bar: {
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.muted,
      overflow: "hidden",
    },
    barFill: {
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
    },

    // Toggles
    toggle: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 6,
      minHeight: 48,
    },
    toggleLabel: { ...theme.type.body, color: theme.colors.text },

    version: {
      ...theme.type.caption,
      color: theme.colors.secondary,
      textAlign: "center",
      marginTop: 16,
    },

    // Update sheet
    sheetOverlay: {
      flex: 1,
      backgroundColor: "rgba(16,24,40,0.45)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: theme.radius.xl,
      borderTopRightRadius: theme.radius.xl,
      padding: theme.spacing.md,
      paddingBottom: 32,
    },
    handle: {
      width: 48,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.border,
      alignSelf: "center",
      marginBottom: 12,
    },
    sheetTitle: {
      ...theme.type.title,
      color: theme.colors.text,
      marginBottom: 12,
    },
    sheetNote: {
      ...theme.type.caption,
      color: theme.colors.secondary,
      marginBottom: 12,
    },
  }),
);
