import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/constants/theme';
import { AppHeader } from '@/components/shared/AppHeader';
import { Button } from '@/components/shared/Button';
import { Field } from '@/components/shared/Field';
import { ChevronIcon } from '@/components/shared/Icons';
import { Card } from '@/components/shared/Screen';
import { useAuthStore } from '@/stores/authStore';
import { usersApi } from '@/services/users.service';
import { ApiError } from '@/services/api';
import { useCgpaStore } from '@/stores/cgpaStore';
import { useSessionStore } from '@/stores/sessionStore';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { themedStyles } from '@/components/themedStyles';

// ─── CR profile ─────────────────────────────────────────────────────
// CRs are students too, so they get the same identity, academics and
// account controls as the student profile — plus their role badge.
// Preferences are real: every switch round-trips to /api/users/me.

export default function CRProfile() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { semesters, cgpa: calcCgpa } = useCgpaStore();
  const { semester: currentSemester, sessionYear } = useSessionStore();
  const cgpa = semesters.length ? calcCgpa().toFixed(2) : '—';
  const levelLine =
    [user?.level, currentSemester ? `${currentSemester} Semester` : null, sessionYear || null]
      .filter(Boolean)
      .join(' · ') || 'No level set';

  // ── Notification preferences (real backend) ──
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

  const flipPref = (key: 'postAlerts' | 'reminders', value: boolean) => {
    if (key === 'postAlerts') setPostAlerts(value);
    else setReminders(value);
    usersApi.updatePrefs({ [key]: value }).catch(() => {
      // Revert on failure so the switch never lies.
      if (key === 'postAlerts') setPostAlerts(!value);
      else setReminders(!value);
    });
  };

  // ── Change password ──
  const [pwOpen, setPwOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  const savePassword = async () => {
    if (!currentPw) {
      setPwError('Enter your current password.');
      return;
    }
    if (newPw.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    setPwError('');
    setPwSaving(true);
    try {
      await usersApi.updateMe({ currentPassword: currentPw, newPassword: newPw });
      setPwSaving(false);
      setPwOpen(false);
      setCurrentPw('');
      setNewPw('');
    } catch (err) {
      setPwSaving(false);
      setPwError(err instanceof ApiError ? err.message : 'Could not change your password.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title="Profile · CR" />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* ── Identity + role ── */}
        <Card>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.fullName ?? 'C').slice(0, 1)}</Text>
          </View>
          <Text style={styles.name}>{user?.fullName ?? 'Course Rep'}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {user?.roleInLevel === 'main_cr' ? 'Main CR' : 'Assistant CR'}
            </Text>
          </View>
          <Text style={styles.meta}>{user?.email}</Text>
          <Text style={styles.meta}>{levelLine}</Text>
        </Card>

        {/* ── Academics ── */}
        <Text style={styles.heading}>Academic profile</Text>
        <Card>
          <Row label="Current CGPA" value={cgpa} onPress={() => router.push('/(cr)/cgpa/overview' as never)} />
          <Divider />
          <Row label="Semesters tracked" value={String(semesters.length)} onPress={() => router.push('/(cr)/cgpa/overview' as never)} />
        </Card>

        {/* ── Notifications ── */}
        <Text style={styles.heading}>Notifications</Text>
        <Card>
          <View style={styles.toggle}>
            <Text style={styles.toggleLabel}>Comment replies on my posts</Text>
            <Switch value={reminders} onValueChange={(v) => flipPref('reminders', v)} trackColor={{ true: theme.colors.primary }} />
          </View>
          <Divider />
          <View style={styles.toggle}>
            <Text style={styles.toggleLabel}>Level post alerts</Text>
            <Switch value={postAlerts} onValueChange={(v) => flipPref('postAlerts', v)} trackColor={{ true: theme.colors.primary }} />
          </View>
        </Card>

        {/* ── Account ── */}
        <Text style={styles.heading}>Account</Text>
        <Card>
          <Row label="Change password" value="" onPress={() => setPwOpen(true)} />
        </Card>

        <Button
          title="Log out"
          variant="danger"
          style={{ marginTop: theme.spacing.md }}
          onPress={() =>
            Alert.alert('Log out?', 'Your drafts stay on this device.', [
              { text: 'Stay' },
              { text: 'Log out', style: 'destructive', onPress: logout },
            ])
          }
        />
        <Text style={styles.version}>SIA · v1.0</Text>
      </ScrollView>

      {/* ── Change password sheet ── */}
      <Modal visible={pwOpen} animationType="slide" transparent onRequestClose={() => setPwOpen(false)}>
        <View style={styles.sheetOverlay}>
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, theme.spacing.md) }]}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Change password</Text>
            <Field
              label="Current password"
              value={currentPw}
              onChangeText={(t) => { setCurrentPw(t); if (pwError) setPwError(''); }}
              placeholder="Your current password"
              secureTextEntry
            />
            <Field
              label="New password"
              value={newPw}
              onChangeText={(t) => { setNewPw(t); if (pwError) setPwError(''); }}
              placeholder="At least 6 characters"
              secureTextEntry
              error={pwError}
            />
            <Button title={pwSaving ? 'Saving…' : 'Update password'} onPress={savePassword} disabled={pwSaving} />
            <View style={{ height: 8 }} />
            <Button title="Cancel" variant="secondary" onPress={() => setPwOpen(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Row({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
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

function Divider() {
  return <View style={styles.divider} />;
}

const styles = themedStyles(() => StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  body: { padding: theme.spacing.md, paddingBottom: theme.layout.tabClearance },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 8 },
  avatarText: { color: theme.colors.onPrimary, fontSize: 28, fontFamily: theme.font.bold, fontWeight: '700' },
  name: { ...theme.type.title, textAlign: 'center', color: theme.colors.text },
  badge: { backgroundColor: theme.colors.text, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 6, alignSelf: 'center', marginVertical: 8 },
  badgeText: { color: theme.colors.onPrimary, fontSize: 13, fontFamily: theme.font.bold, fontWeight: '700' },
  meta: { ...theme.type.caption, textAlign: 'center', color: theme.colors.secondary },

  heading: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: theme.font.bold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: theme.colors.secondary,
    marginTop: 16,
    marginBottom: 8,
  },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, minHeight: 48 },
  rowLabel: { ...theme.type.body, color: theme.colors.text },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowValue: { ...theme.type.body, color: theme.colors.secondary, fontVariant: ['tabular-nums'] },
  divider: { height: 1, backgroundColor: theme.colors.border },

  toggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, minHeight: 48 },
  toggleLabel: { ...theme.type.body, color: theme.colors.text },

  version: { ...theme.type.caption, color: theme.colors.secondary, textAlign: 'center', marginTop: 16 },

  sheetOverlay: { flex: 1, backgroundColor: theme.colors.scrim, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: theme.spacing.md,
    paddingBottom: 32,
  },
  handle: { width: 48, height: 4, borderRadius: 2, backgroundColor: theme.colors.border, alignSelf: 'center', marginBottom: 12 },
  sheetTitle: { ...theme.type.title, color: theme.colors.text, marginBottom: 12 },
}));
