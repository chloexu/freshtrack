import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, SectionList, StyleSheet, TextInput,
  TouchableOpacity, Animated, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { T } from '../../constants/theme';
import { getItems, updateItem, deleteItem, Item, ApiError } from '../../services/api';
import { getFreshnessBucket, BUCKET_CONFIG, FreshnessBucket } from '../../constants/freshness';
import { FridgeItem } from '../../components/FridgeItem';
import { SearchIcon, PlusIcon } from '../../components/Icons';

const BUCKET_ORDER: FreshnessBucket[] = ['urgent', 'soon', 'fresh'];

const TOAST_MESSAGES = [
  (name: string) => `Nice work using up the ${name}!`,
  (name: string) => `${name} done! Zero waste win`,
  (name: string) => `Way to go — ${name} used before it expired!`,
  (name: string) => `Fresh fridge vibes — ${name} cleared!`,
];

export default function FridgeScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastAnim = useRef(new Animated.Value(-80)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(useCallback(() => { loadItems(); }, []));

  useEffect(() => {
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);

  async function loadItems() {
    try {
      const data = await getItems();
      setItems(data);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        router.replace('/onboarding');
      }
    }
  }

  function showToast(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(message);
    Animated.spring(toastAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 8 }).start();
    toastTimer.current = setTimeout(() => {
      Animated.timing(toastAnim, { toValue: -80, duration: 250, useNativeDriver: true }).start(() => setToastMsg(null));
    }, 3000);
  }

  async function handleConsume(item: Item) {
    await updateItem(item.id, { status: 'consumed' });
    setTimeout(() => {
      setItems(prev => prev.filter(i => i.id !== item.id));
    }, 800);
    const msg = TOAST_MESSAGES[Math.floor(Math.random() * TOAST_MESSAGES.length)](item.name);
    showToast(msg);
  }

  async function handleRemove(id: string) {
    await deleteItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
    setExpandedId(null);
  }

  const filtered = query
    ? items.filter(i => i.name.toLowerCase().includes(query.toLowerCase()))
    : items;

  const sections = BUCKET_ORDER
    .map(bucket => ({
      bucket,
      title: BUCKET_CONFIG[bucket].label,
      color: BUCKET_CONFIG[bucket].color,
      data: filtered.filter(i => getFreshnessBucket(i.predicted_expiry) === bucket),
    }))
    .filter(s => s.data.length > 0);

  const urgentCount = items.filter(i => getFreshnessBucket(i.predicted_expiry) === 'urgent').length;

  return (
    <SafeAreaView style={s.safe}>
      {/* Toast */}
      {toastMsg && (
        <Animated.View style={[s.toast, { transform: [{ translateY: toastAnim }] }]}>
          <View style={s.toastIcon}><Text style={{ fontSize: 16 }}>✓</Text></View>
          <Text style={s.toastText}>{toastMsg}</Text>
        </Animated.View>
      )}

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>My Fridge</Text>
          <Text style={s.subtitle}>
            {items.length} item{items.length !== 1 ? 's' : ''}
            {urgentCount > 0 ? ` · ${urgentCount} expiring soon` : ''}
          </Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => router.push('/(tabs)/camera')} activeOpacity={0.7}>
          <PlusIcon size={14} color={T.green700} />
          <Text style={s.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <View style={s.searchBar}>
          <SearchIcon size={16} color={T.inkLight} />
          <TextInput
            style={s.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search your fridge…"
            placeholderTextColor={T.inkLight}
          />
        </View>
      </View>

      {items.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyTitle}>Your fridge is empty.</Text>
          <Text style={s.emptySub}>Tap Add to photograph a receipt.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadItems} tintColor={T.green700} />}
          renderSectionHeader={({ section }) => (
            <View style={s.groupHeader}>
              <View style={[s.groupDot, { backgroundColor: section.color }]} />
              <Text style={[s.groupLabel, { color: section.color }]}>{section.title}</Text>
              <View style={[s.groupLine, { backgroundColor: section.color + '33' }]} />
              <Text style={[s.groupCount, { color: section.color }]}>{section.data.length}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={s.itemWrap}>
              <FridgeItem
                item={item}
                isExpanded={expandedId === item.id}
                onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                onConsume={() => handleConsume(item)}
                onRemove={() => handleRemove(item.id)}
              />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.cream },
  toast: {
    position: 'absolute', top: 70, left: 20, right: 20, zIndex: 100,
    backgroundColor: T.green900, borderRadius: 16, padding: 13,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: T.green900, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  toastIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: T.green500, alignItems: 'center', justifyContent: 'center',
  },
  toastText: { color: T.white, fontSize: 14, fontFamily: 'DMSans_500Medium', flex: 1, lineHeight: 20 },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '700', color: T.ink, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: T.inkMid, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: T.green100, borderWidth: 1, borderColor: T.green200,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
  },
  addBtnText: { fontSize: 13, fontWeight: '600', color: T.green700, fontFamily: 'DMSans_600SemiBold' },
  searchWrap: { paddingHorizontal: 20, marginBottom: 14 },
  searchBar: {
    backgroundColor: T.white, borderRadius: 12, borderWidth: 1, borderColor: T.border,
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11,
  },
  searchInput: { flex: 1, fontSize: 15, color: T.ink, fontFamily: 'DMSans_400Regular' },
  listContent: { paddingBottom: 16 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, marginBottom: 6, marginTop: 8 },
  groupDot: { width: 8, height: 8, borderRadius: 4 },
  groupLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'DMSans_600SemiBold' },
  groupLine: { flex: 1, height: 1 },
  groupCount: { fontSize: 11, fontWeight: '500', fontFamily: 'DMSans_500Medium' },
  itemWrap: { paddingHorizontal: 20 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: T.ink, fontFamily: 'DMSans_600SemiBold' },
  emptySub: { fontSize: 14, color: T.inkLight, fontFamily: 'DMSans_400Regular', marginTop: 8 },
});
