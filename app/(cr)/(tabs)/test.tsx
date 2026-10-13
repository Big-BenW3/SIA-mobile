import { StyleSheet } from 'react-native';
import { theme } from '@/constants/theme';
import { themedStyles } from '@/components/themedStyles';
import { TestHub } from '@/components/test/TestHub';
import { SafeAreaView } from 'react-native-safe-area-context';

// CR Test tab: same shared hub (CRs are students too). Only the base differs.
export default function CRTestHubScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TestHub base="(cr)" />
    </SafeAreaView>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
}));
