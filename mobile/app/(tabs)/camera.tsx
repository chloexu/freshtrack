import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { T } from '../../constants/theme';
import { parseReceipt, ParsedItem } from '../../services/mockApi';
import { createItems, ApiError } from '../../services/api';
import { ConfirmItemList } from '../../components/ConfirmItemList';
import { CameraIcon, SparkleIcon } from '../../components/Icons';

type ScreenState = 'capture' | 'loading' | 'confirm';

function daysToDate(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
}

export default function AddScreen() {
  const router = useRouter();
  const [state, setState] = useState<ScreenState>('capture');
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [parseNotes, setParseNotes] = useState<string | null>(null);

  async function handleAnalyze() {
    setState('loading');
    const result = await parseReceipt('mock');
    setParsedItems(result.items);
    setParseNotes(result.parse_notes);
    setState('confirm');
  }

  async function handleConfirm(items: ParsedItem[]) {
    const today = new Date().toISOString().split('T')[0];
    try {
      await createItems(
        items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          purchase_date: today,
          predicted_expiry: daysToDate(item.predicted_expiry_days),
        }))
      );
      setState('capture');
      router.push('/(tabs)');
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        router.replace('/onboarding');
      }
    }
  }

  if (state === 'confirm') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: T.cream }}>
        <ConfirmItemList
          items={parsedItems}
          parseNotes={parseNotes}
          onConfirm={handleConfirm}
          onCancel={() => setState('capture')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Add Groceries</Text>
        <Text style={s.subtitle}>Snap your cart or receipt to import</Text>
      </View>

      <View style={s.cameraZone}>
        {[
          { top: 16, left: 16, borderTopWidth: 2, borderLeftWidth: 2 },
          { top: 16, right: 16, borderTopWidth: 2, borderRightWidth: 2 },
          { bottom: 16, left: 16, borderBottomWidth: 2, borderLeftWidth: 2 },
          { bottom: 16, right: 16, borderBottomWidth: 2, borderRightWidth: 2 },
        ].map((style, i) => (
          <View key={i} style={[s.bracket, style as object, { borderColor: T.green400 }]} />
        ))}
        <View style={s.cameraIconWrap}>
          <CameraIcon size={26} color="rgba(255,255,255,0.7)" />
        </View>
        <Text style={s.cameraLabel}>Take a photo</Text>
        <Text style={s.cameraHint}>cart · receipt · shelf label</Text>
      </View>

      <TouchableOpacity
        style={[s.analyzeBtn, state === 'loading' && s.analyzeBtnDisabled]}
        onPress={handleAnalyze}
        activeOpacity={0.8}
        disabled={state === 'loading'}
      >
        <SparkleIcon size={15} color={T.white} />
        <Text style={s.analyzeBtnText}>
          {state === 'loading' ? 'Analyzing…' : 'Analyze Photo'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.cream },
  header: { padding: 20, paddingTop: 8 },
  title: { fontSize: 26, fontWeight: '700', color: T.ink, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: T.inkMid, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  cameraZone: {
    marginHorizontal: 20,
    height: 200,
    backgroundColor: T.green900,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  bracket: { position: 'absolute', width: 20, height: 20 },
  cameraIconWrap: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  cameraLabel: { color: T.white, fontSize: 15, fontWeight: '500', fontFamily: 'DMSans_500Medium' },
  cameraHint: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'DMSans_400Regular' },
  analyzeBtn: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: T.green700,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  analyzeBtnDisabled: { opacity: 0.6 },
  analyzeBtnText: { color: T.white, fontSize: 16, fontWeight: '600', fontFamily: 'DMSans_600SemiBold' },
});
