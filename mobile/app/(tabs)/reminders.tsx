import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { T } from '../../constants/theme';
import { BellIcon } from '../../components/Icons';

export default function RemindersScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <BellIcon size={40} color={T.border} />
        <Text style={s.title}>Reminders</Text>
        <Text style={s.subtitle}>Coming soon</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.cream },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 18, fontWeight: '600', color: T.inkLight, fontFamily: 'DMSans_600SemiBold' },
  subtitle: { fontSize: 14, color: T.border, fontFamily: 'DMSans_400Regular' },
});
