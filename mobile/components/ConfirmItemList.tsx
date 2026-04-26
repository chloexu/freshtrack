import { useState } from 'react';
import {
  View, Text, FlatList, TextInput,
  TouchableOpacity, StyleSheet,
} from 'react-native';
import { T } from '../constants/theme';
import { ParsedItem } from '../services/mockApi';
import { getFreshnessBucket, BUCKET_CONFIG } from '../constants/freshness';
import { FreshnessOrb } from './FreshnessOrb';
import { ChevronRightIcon, XIcon } from './Icons';
import { SectionLabel } from './SectionLabel';

type EditableItem = ParsedItem & { _key: string };

type Props = {
  items: ParsedItem[];
  parseNotes: string | null;
  onConfirm: (items: ParsedItem[]) => void;
  onCancel: () => void;
};

function expiryFromDays(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
}

export function ConfirmItemList({ items: initial, parseNotes, onConfirm, onCancel }: Props) {
  const [items, setItems] = useState<EditableItem[]>(
    initial.map((item, i) => ({ ...item, _key: String(i) }))
  );
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  function update(key: string, field: keyof ParsedItem, value: string | number) {
    setItems(prev => prev.map(item => item._key === key ? { ...item, [field]: value } : item));
  }

  function remove(key: string) {
    setItems(prev => prev.filter(item => item._key !== key));
    if (expandedKey === key) setExpandedKey(null);
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>Confirm items</Text>
      {parseNotes && <Text style={s.notes}>{parseNotes}</Text>}

      <SectionLabel>Detected Items — tap to edit</SectionLabel>

      <FlatList
        data={items}
        keyExtractor={item => item._key}
        style={s.list}
        renderItem={({ item, index }) => {
          const isLow = item.confidence === 'low';
          const bucket = getFreshnessBucket(expiryFromDays(item.predicted_expiry_days));
          const { color, bg } = BUCKET_CONFIG[bucket];
          const isExpanded = expandedKey === item._key;
          const isFirst = index === 0;
          const isLast = index === items.length - 1;

          return (
            <View style={[
              s.card,
              { borderLeftColor: isLow ? T.amber : color, backgroundColor: isLow ? T.amberLight : T.white },
              isFirst && s.cardFirst,
              isLast && s.cardLast,
            ]}>
              {isLow && (
                <Text style={s.lowBadge}>Low confidence — tap to confirm</Text>
              )}

              <TouchableOpacity style={s.cardRow} onPress={() => setExpandedKey(isExpanded ? null : item._key)} activeOpacity={0.7}>
                <FreshnessOrb bucket={bucket} />
                <View style={s.cardInfo}>
                  <Text style={s.cardName}>{item.name}</Text>
                  {item.quantity && <Text style={s.cardQty}>{item.quantity}</Text>}
                </View>
                <View style={[s.daysPill, { backgroundColor: bg }]}>
                  <Text style={[s.daysPillText, { color }]}>~{item.predicted_expiry_days}d</Text>
                </View>
                <ChevronRightIcon size={14} color={T.inkLight} />
                <TouchableOpacity onPress={() => remove(item._key)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <XIcon size={12} color={T.coral} />
                </TouchableOpacity>
              </TouchableOpacity>

              {isExpanded && (
                <View style={s.editRow}>
                  <TextInput
                    style={[s.editInput, s.editName]}
                    value={item.name}
                    onChangeText={v => update(item._key, 'name', v)}
                    placeholder="Name"
                    placeholderTextColor={T.inkLight}
                  />
                  <TextInput
                    style={[s.editInput, s.editQty]}
                    value={item.quantity ?? ''}
                    onChangeText={v => update(item._key, 'quantity', v)}
                    placeholder="Qty"
                    placeholderTextColor={T.inkLight}
                  />
                  <TextInput
                    style={[s.editInput, s.editDays]}
                    value={String(item.predicted_expiry_days)}
                    onChangeText={v => update(item._key, 'predicted_expiry_days', parseInt(v) || 0)}
                    keyboardType="numeric"
                    placeholder="d"
                    placeholderTextColor={T.inkLight}
                  />
                  <Text style={s.daysLabel}>days</Text>
                </View>
              )}
            </View>
          );
        }}
      />

      <View style={s.footer}>
        <TouchableOpacity style={s.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
          <Text style={s.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.confirmBtn} onPress={() => onConfirm(items)} activeOpacity={0.8}>
          <Text style={s.confirmText}>Save {items.length} Items to Fridge →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.cream },
  title: { fontSize: 26, fontWeight: '700', color: T.ink, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: -0.5, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  notes: { fontSize: 13, color: T.amber, fontFamily: 'DMSans_400Regular', paddingHorizontal: 20, marginBottom: 8 },
  list: { flex: 1, paddingHorizontal: 20 },
  card: {
    backgroundColor: T.white,
    borderLeftWidth: 3,
    marginBottom: 1,
    padding: 12,
  },
  cardFirst: { borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  cardLast: { borderBottomLeftRadius: 12, borderBottomRightRadius: 12, marginBottom: 12 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '500', color: T.ink, fontFamily: 'DMSans_500Medium' },
  cardQty: { fontSize: 12, color: T.inkLight, fontFamily: 'DMSans_400Regular' },
  daysPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  daysPillText: { fontSize: 11, fontWeight: '600', fontFamily: 'DMSans_600SemiBold' },
  lowBadge: { fontSize: 11, color: '#92400E', fontFamily: 'DMSans_500Medium', marginBottom: 6 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: T.border },
  editInput: {
    backgroundColor: T.white, borderWidth: 1, borderColor: T.border,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7,
    fontSize: 14, color: T.ink, fontFamily: 'DMSans_400Regular',
  },
  editName: { flex: 1 },
  editQty: { width: 60 },
  editDays: { width: 44, textAlign: 'center' },
  daysLabel: { fontSize: 12, color: T.inkLight, fontFamily: 'DMSans_400Regular' },
  footer: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: T.border, backgroundColor: T.cream },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: T.border, alignItems: 'center' },
  cancelText: { fontSize: 15, color: T.inkMid, fontFamily: 'DMSans_500Medium' },
  confirmBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: T.green900, alignItems: 'center' },
  confirmText: { fontSize: 15, color: T.white, fontWeight: '600', fontFamily: 'DMSans_600SemiBold' },
});
