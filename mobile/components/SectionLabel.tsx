import React from 'react';
import { Text } from 'react-native';
import { T } from '../constants/theme';

type Props = { children: string };

export function SectionLabel({ children }: Props) {
  return (
    <Text style={{
      fontSize: 10,
      fontWeight: '600',
      letterSpacing: 1.2,
      color: T.inkLight,
      textTransform: 'uppercase',
      paddingHorizontal: 20,
      marginBottom: 6,
      fontFamily: 'DMSans_600SemiBold',
    }}>
      {children}
    </Text>
  );
}
