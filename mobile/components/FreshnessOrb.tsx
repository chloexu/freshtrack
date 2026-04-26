import React from 'react';
import { View } from 'react-native';
import { T } from '../constants/theme';
import { FreshnessBucket } from '../constants/freshness';

const ORB_COLOR: Record<FreshnessBucket | 'consumed', string> = {
  urgent:   T.coral,
  soon:     T.amber,
  fresh:    T.sage,
  consumed: T.green400,
};

type Props = { bucket: FreshnessBucket | 'consumed' };

export function FreshnessOrb({ bucket }: Props) {
  return (
    <View style={{
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: ORB_COLOR[bucket],
      flexShrink: 0,
    }} />
  );
}
