import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { T } from '../constants/theme';
import { Item } from '../services/mockApi';
import { getFreshnessBucket, getFreshnessLabel, BUCKET_CONFIG } from '../constants/freshness';
import { FreshnessOrb } from './FreshnessOrb';
import { CheckIcon } from './Icons';

type Props = {
  item: Item;
  isExpanded: boolean;
  onToggle: () => void;
  onConsume: () => void;
  onRemove: () => void;
};

export function FridgeItem({ item, isExpanded, onToggle, onConsume, onRemove }: Props) {
  const [consumed, setConsumed] = useState(false);
  const bucket = getFreshnessBucket(item.predicted_expiry);
  const label = getFreshnessLabel(item.predicted_expiry);
  const { color, bg } = BUCKET_CONFIG[bucket];

  function handleConsume() {
    setConsumed(true);
    onConsume();
  }

  return (
    <View style={s.wrapper}>
      {/* Main row */}
      <TouchableOpacity
        style={[s.row, { borderLeftColor: color, opacity: consumed ? 0.6 : 1 }]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        {/* Circle checkbox */}
        <View style={[s.circle, consumed && { backgroundColor: T.sage, borderWidth: 0 }]}>
          {consumed && <CheckIcon size={12} color={T.white} />}
        </View>

        <View style={s.info}>
          <Text style={[s.name, consumed && s.strikethrough]}>{item.name}</Text>
          {item.quantity && <Text style={s.detail}>{item.quantity}</Text>}
        </View>

        <View style={[s.pill, { backgroundColor: bg }]}>
          <Text style={[s.pillText, { color }]}>{label}</Text>
        </View>

        <Text style={[s.days, { color }]}>{label === 'today' || label === 'tomorrow' ? '' : label}</Text>
      </TouchableOpacity>

      {/* Inline action row */}
      {isExpanded && (
        <View style={[s.actions, { borderLeftColor: color }]}>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: T.sageLight }]} onPress={handleConsume}>
            <Text style={[s.actionText, { color: T.sage }]}>✓ Used it</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, s.actionBtnMid, { backgroundColor: T.creamDark }]} onPress={() => {}}>
            <Text style={[s.actionText, { color: T.inkMid }]}>✎ Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: T.coralLight, borderBottomRightRadius: 9 }]} onPress={onRemove}>
            <Text style={[s.actionText, { color: T.coral }]}>✕ Remove</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { marginBottom: 1 },
  row: {
    backgroundColor: T.white,
    borderLeftWidth: 3,
    borderRadius: 12,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circle: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '500', color: T.ink, fontFamily: 'DMSans_500Medium' },
  strikethrough: { textDecorationLine: 'line-through' },
  detail: { fontSize: 12, color: T.inkLight, fontFamily: 'DMSans_400Regular', marginTop: 1 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  pillText: { fontSize: 11, fontWeight: '600', fontFamily: 'DMSans_600SemiBold' },
  days: { fontSize: 13, fontWeight: '600', fontFamily: 'DMSans_600SemiBold', minWidth: 28, textAlign: 'right' },
  actions: {
    flexDirection: 'row',
    borderLeftWidth: 3,
    borderTopWidth: 1,
    borderTopColor: T.border,
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
    overflow: 'hidden',
  },
  actionBtn: { flex: 1, paddingVertical: 11, alignItems: 'center' },
  actionBtnMid: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: T.border },
  actionText: { fontSize: 13, fontWeight: '600', fontFamily: 'DMSans_600SemiBold' },
});
