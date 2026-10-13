import { AppHeader } from '@/components/shared/AppHeader';
import { PlannerList } from '@/components/itinerary/PlannerList';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { theme } from '@/constants/theme';
import { themedStyles } from '@/components/themedStyles';

// Student Plan tab: chrome + shared planner body.
export default function ItineraryList() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title="My itinerary" />
      <PlannerList base="(student)" />
    </SafeAreaView>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
}));
