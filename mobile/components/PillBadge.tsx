import React from 'react';
import { Text, View } from 'react-native';

type Props = { label: string; color: string; bg: string };

export function PillBadge({ label, color, bg }: Props) {
  return (
    <View style={{
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 20,
      backgroundColor: bg,
    }}>
      <Text style={{
        fontSize: 11,
        fontWeight: '500',
        color,
        fontFamily: 'DMSans_500Medium',
      }}>
        {label}
      </Text>
    </View>
  );
}
