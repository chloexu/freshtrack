import { T } from './theme';

export type FreshnessBucket = 'urgent' | 'soon' | 'fresh';

export function getFreshnessBucket(predictedExpiry: string): FreshnessBucket {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(predictedExpiry);
  expiry.setHours(0, 0, 0, 0);
  const days = Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 2) return 'urgent';
  if (days <= 6) return 'soon';
  return 'fresh';
}

export function getFreshnessLabel(predictedExpiry: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(predictedExpiry);
  expiry.setHours(0, 0, 0, 0);
  const days = Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `${days}d`;
}

export const BUCKET_CONFIG: Record<FreshnessBucket, {
  label: string;
  color: string;
  bg: string;
}> = {
  urgent: { label: 'Use Today', color: T.coral, bg: T.coralLight },
  soon:   { label: 'Use Soon',  color: T.amber, bg: T.amberLight },
  fresh:  { label: 'Still Fresh', color: T.sage, bg: T.sageLight },
};
