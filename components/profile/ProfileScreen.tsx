import { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  type TextInputInstance,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import { AppHeader } from "@/components/shared/AppHeader";
import { BottomSheet } from "@/components/shared/BottomSheet";
import { Button } from "@/components/shared/Button";
import { Field } from "@/components/shared/Field";
import { ChevronIcon, TrashIcon } from "@/components/shared/Icons";
import { PressableScale } from "@/components/shared/PressableScale";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { Reveal } from "@/components/shared/Reveal";
import { Card } from "@/components/shared/Screen";
import { SuccessBanner } from "@/components/shared/States";
import { FormError } from "@/components/shared/AuthScreen";
import { Mascot } from "@/components/mascot/Mascot";
import { useAuthStore } from "@/stores/authStore";
import { useCgpaStore } from "@/stores/cgpaStore";
import { useGoalsStore } from "@/stores/goalsStore";
import { useSessionStore } from "@/stores/sessionStore";
import { usersApi } from "@/services/users.service";
import { ApiError } from "@/services/api";
import { confirmAction } from "@/utils/confirm";
import { themedStyles } from "@/components/themedStyles";

// ─── Profile (shared, both roles) ───────────────────────────────────
// Grouped sections, one concern each: identity → academics → goals →
// notifications → support → account. Log out sits last and alone. CRs are
// students too, so they get the same sections plus their role badge.
// Preferences round-trip to /api/users/me; goals live on-device (SQLite).

type Sheet = "edit" | "password" | "help" | "about" | null;

export function ProfileScreen({
  base,
  title,
}: {
  base: "(student)" | "(cr)";
  title: string;
}) {
  const router = useRouter();
  const { user, logout, updateProfile } = useAuthStore();
  const [sheet, setSheet] = useState<Sheet>(null);
  // Each open bumps `openCount`; the sheets are keyed by it, so a form starts
  // fresh (no stale text or errors) without resetting state inside an effect.
  const [openCount, setOpenCount] = useState(0);
  const openSheet = (s: Exclude<Sheet, null>) => {
    setOpenCount((c) => c + 1);
    setSheet(s);
  };
  const closeSheet = () => setSheet(null);

  // ── Academics ──
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
  const roleBadge =
    user?.role === "cr"
      ? user.roleInLevel === "main_cr"
        ? "Main CR"
        : "Assistant CR"
      : null;

  // ── Notification preferences (real backend; load once, save per toggle) ──
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

  // ── Goals (on-device, never synced) ──
  const { goals, addGoal, removeGoal } = useGoalsStore();
  const [adding, setAdding] = useState(false);
  const [gTitle, setGTitle] = useState("");
  const [gDetail, setGDetail] = useState("");
  const [gError, setGError] = useState("");
  const detailRef = useRef<TextInputInstance>(null);

  const submitGoal = () => {
    if (!gTitle.trim()) {
      setGError("Give the goal a name.");
      return;
    }
    addGoal(gTitle.trim(), gDetail.trim());
    setGTitle("");
    setGDetail("");
    setGError("");
    setAdding(false);
  };

  const askLogout = async () => {
    const ok = await confirmAction({
      title: "Log out?",
      message: "You will need your email and password to sign back in.",
      confirmLabel: "Log out",
      destructive: true,
    });
    if (ok) logout();
  };

  const removeGoalAsk = async (id: string, name: string) => {
    const ok = await confirmAction({
      title: "Delete goal?",
      message: `"${name}" will be removed from this device.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (ok) removeGoal(id);
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <AppHeader title={title} />

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Identity ── */}
        <Reveal index={0}>
          <Card style={styles.identityCard}>
            <View style={styles.ring}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user?.fullName ?? "S").slice(0, 1).toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.name}>{user?.fullName ?? "Student"}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <View style={styles.pills}>
              {roleBadge && (
                <View style={[styles.pill, styles.pillRole]}>
                  <Text style={[styles.pillText, styles.pillRoleText]}>
                    {roleBadge}
                  </Text>
                </View>
              )}
              <View style={styles.pill}>
                <Text style={styles.pillText}>{levelLine}</Text>
              </View>
            </View>
            <Button
              title="Edit profile"
              variant="secondary"
              onPress={() => openSheet("edit")}
              style={styles.editBtn}
            />
          </Card>
        </Reveal>

        {/* ── Academics ── */}
        <Heading>Academic profile</Heading>
        <Card>
          <Row
            label="Current CGPA"
            value={cgpa}
            onPress={() => router.push(`/${base}/cgpa/overview` as never)}
          />
          <Divider />
          <Row
            label="Semesters tracked"
            value={String(semesters.length)}
            onPress={() => router.push(`/${base}/cgpa/overview` as never)}
          />
          <Divider />
          <Row
            label="Courses this semester"
            value={String(courses.length)}
            onPress={() => router.push(`/${base}/resources` as never)}
          />
        </Card>

        {/* ── Goals ── */}
        <Heading>My goals</Heading>
        <Card>
          {goals.length === 0 && !adding && (
            <View style={styles.goalsEmpty}>
              <Mascot pose="point" size={56} />
              <Text style={styles.goalsEmptyText}>
                Set a goal and keep it in sight. Goals stay on this device.
              </Text>
            </View>
          )}
          {goals.map((g) => (
            <View key={g.id} style={styles.goal}>
              <View style={styles.goalRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.goalTitle}>{g.title}</Text>
                  <Text style={styles.goalDetail}>{g.detail}</Text>
                </View>
                <PressableScale
                  onPress={() => removeGoalAsk(g.id, g.title)}
                  hitSlop={8}
                  style={styles.iconBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete goal ${g.title}`}
                >
                  <TrashIcon color={theme.colors.secondary} />
                </PressableScale>
              </View>
              {g.pct > 0 && (
                <ProgressBar value={g.pct} label={`${g.title} progress`} />
              )}
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
                error={gError || undefined}
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => detailRef.current?.focus()}
              />
              <Field
                label="How you measure it"
                value={gDetail}
                onChangeText={setGDetail}
                placeholder="e.g. 2 papers every week"
                inputRef={detailRef}
                returnKeyType="done"
                onSubmitEditing={submitGoal}
              />
              <Button title="Add goal" onPress={submitGoal} />
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => {
                  setAdding(false);
                  setGError("");
                }}
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

        {/* ── Notifications ── */}
        <Heading>Notifications</Heading>
        <Card>
          <ToggleRow
            label="Level post alerts"
            value={postAlerts}
            onChange={(v) => flipPref("postAlerts", v)}
          />
          <Divider />
          <ToggleRow
            label="Deadline reminders"
            value={reminders}
            onChange={(v) => flipPref("reminders", v)}
          />
        </Card>
        <Text style={[styles.sheetNote, styles.toggleNote]}>
          Deadline reminders arrive about a day before a post is due.
        </Text>

        {/* ── Support ── */}
        <Heading>Support</Heading>
        <Card>
          <Row label="Help center" value="" onPress={() => openSheet("help")} />
          <Divider />
          <Row
            label="About SIA"
            value="v1.0"
            onPress={() => openSheet("about")}
          />
        </Card>

        {/* ── Account ── */}
        <Heading>Account</Heading>
        <Card>
          <Row
            label="Change password"
            value=""
            onPress={() => openSheet("password")}
          />
          <Divider />
          <PressableScale
            onPress={askLogout}
            style={styles.logout}
            accessibilityRole="button"
          >
            <Text style={styles.logoutText}>Log out</Text>
          </PressableScale>
        </Card>
        <Text style={styles.version}>SIA · v1.0</Text>
      </ScrollView>

      <EditProfileSheet
        key={`edit-${openCount}`}
        visible={sheet === "edit"}
        onClose={closeSheet}
        initialName={user?.fullName ?? ""}
        email={user?.email ?? ""}
        onSave={updateProfile}
      />
      <PasswordSheet
        key={`password-${openCount}`}
        visible={sheet === "password"}
        onClose={closeSheet}
      />
      <BottomSheet
        visible={sheet === "help"}
        onClose={closeSheet}
        title="Help center"
      >
        <Text style={styles.sheetText}>
          Guides and FAQs aren&apos;t available yet. For help today, ask your
          Course Rep or an admin.
        </Text>
        <Button title="Got it" variant="secondary" onPress={closeSheet} />
      </BottomSheet>
      <BottomSheet
        visible={sheet === "about"}
        onClose={closeSheet}
        title="About SIA"
      >
        <Text style={styles.sheetText}>
          One trusted home per level: verified CR updates, a personal study
          planner, course files and a CGPA tracker.
        </Text>
        <Button title="Close" variant="secondary" onPress={closeSheet} />
      </BottomSheet>
    </SafeAreaView>
  );
}

// ─── Sheets ─────────────────────────────────────────────────────────

function EditProfileSheet({
  visible,
  onClose,
  initialName,
  email,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  initialName: string;
  email: string;
  onSave: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) {
      setError("Enter your full name.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await onSave(name.trim());
      onClose();
    } catch {
      setError("Could not save. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Edit profile">
      <Field
        label="Full name"
        value={name}
        onChangeText={(t) => {
          setName(t);
          if (error) setError("");
        }}
        placeholder="Your name"
        autoCapitalize="words"
        returnKeyType="done"
        onSubmitEditing={save}
        error={error || undefined}
      />
      <Field
        label="Email"
        value={email}
        onChangeText={() => {}}
        editable={false}
        hint="Your email can't be changed here."
      />
      <Text style={styles.sheetNote}>
        Your level is set by your join code. Ask your CR to change it.
      </Text>
      <Button title="Save changes" onPress={save} loading={saving} />
    </BottomSheet>
  );
}

function PasswordSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const newRef = useRef<TextInputInstance>(null);

  // The backend verifies the current password before re-hashing, so the old
  // one is mandatory: there is no reset-by-email in v1.
  const save = async () => {
    if (!current) {
      setError("Enter your current password.");
      return;
    }
    if (next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await usersApi.updateMe({ currentPassword: current, newPassword: next });
      setDone(true);
      setTimeout(onClose, 1100);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not change your password.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Change password">
      {done ? (
        <SuccessBanner message="Password updated." />
      ) : (
        <>
          <Field
            label="Current password"
            value={current}
            onChangeText={(t) => {
              setCurrent(t);
              if (error) setError("");
            }}
            placeholder="Your current password"
            secureTextEntry
            revealable
            autoCapitalize="none"
            autoComplete="current-password"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => newRef.current?.focus()}
          />
          <Field
            label="New password"
            value={next}
            onChangeText={(t) => {
              setNext(t);
              if (error) setError("");
            }}
            placeholder="At least 8 characters"
            secureTextEntry
            revealable
            autoCapitalize="none"
            autoComplete="new-password"
            returnKeyType="done"
            inputRef={newRef}
            onSubmitEditing={save}
          />
          <FormError message={error} />
          <Text style={styles.sheetNote}>
            You stay signed in on this device. Use your new password next time
            you log in.
          </Text>
          <Button title="Update password" onPress={save} loading={saving} />
        </>
      )}
    </BottomSheet>
  );
}

// ─── Small building blocks ──────────────────────────────────────────

function Heading({ children }: { children: string }) {
  return (
    <Text style={styles.heading} accessibilityRole="header">
      {children}
    </Text>
  );
}

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
    <PressableScale
      onPress={onPress}
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        {!!value && <Text style={styles.rowValue}>{value}</Text>}
        <ChevronIcon />
      </View>
    </PressableScale>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
        accessibilityLabel={label}
      />
    </View>
  );
}

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
    identityCard: {
      alignItems: "center",
      paddingVertical: theme.spacing.lg,
      gap: theme.spacing.xs,
    },
    ring: {
      width: 104,
      height: 104,
      borderRadius: 52,
      borderWidth: 2,
      borderColor: theme.colors.gold,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.xs,
    },
    avatar: {
      width: 92,
      height: 92,
      borderRadius: 46,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      color: theme.colors.onPrimary,
      fontSize: 36,
      lineHeight: 44,
      fontWeight: "700",
      fontFamily: theme.font.bold,
    },
    name: {
      ...theme.type.title,
      color: theme.colors.text,
      textAlign: "center",
    },
    email: { ...theme.type.caption, color: theme.colors.secondary },
    pills: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xs,
    },
    pill: {
      backgroundColor: theme.colors.softBlue,
      borderRadius: theme.radius.full,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
    },
    pillRole: { backgroundColor: theme.colors.goldTint },
    pillText: {
      ...theme.type.caption,
      fontWeight: "700",
      fontFamily: theme.font.bold,
      color: theme.colors.accent,
    },
    pillRoleText: { color: theme.colors.text },
    editBtn: { alignSelf: "stretch", marginTop: theme.spacing.sm },

    // Sections
    heading: {
      ...theme.type.caption,
      fontWeight: "700",
      fontFamily: theme.font.bold,
      letterSpacing: 1.5,
      textTransform: "uppercase",
      color: theme.colors.secondary,
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.xs,
    },

    // Rows
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      minHeight: 52,
    },
    rowLabel: { ...theme.type.body, color: theme.colors.text, flex: 1 },
    rowRight: { flexDirection: "row", alignItems: "center", gap: 4 },
    rowValue: { ...theme.type.mono, color: theme.colors.secondary },
    divider: { height: 1, backgroundColor: theme.colors.border },
    logout: { minHeight: 52, justifyContent: "center" },
    logoutText: {
      ...theme.type.body,
      fontWeight: "700",
      fontFamily: theme.font.bold,
      color: theme.colors.danger,
    },

    // Goals
    goalsEmpty: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      paddingBottom: theme.spacing.xs,
    },
    goalsEmptyText: {
      ...theme.type.body,
      color: theme.colors.secondary,
      flex: 1,
    },
    goal: { gap: theme.spacing.xs, marginBottom: theme.spacing.sm },
    goalRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    goalTitle: {
      ...theme.type.body,
      fontWeight: "700",
      fontFamily: theme.font.bold,
      color: theme.colors.text,
    },
    goalDetail: { ...theme.type.caption, color: theme.colors.secondary },
    iconBtn: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },

    version: {
      ...theme.type.caption,
      color: theme.colors.secondary,
      textAlign: "center",
      marginTop: theme.spacing.lg,
    },

    // Sheets
    sheetText: { ...theme.type.body, color: theme.colors.secondary },
    sheetNote: { ...theme.type.caption, color: theme.colors.secondary },
    toggleNote: { marginTop: theme.spacing.xs },
  }),
);
