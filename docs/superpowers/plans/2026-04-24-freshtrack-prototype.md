# FreshTrack Frontend Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully navigable Expo iOS prototype with mock data covering Onboarding, Fridge Home, and Add Groceries screens using the `T` design token palette from `docs/screens.jsx`.

**Architecture:** Expo Router file-based navigation with a `mockApi.ts` service layer that mirrors the real `api.ts` signatures — swap one import per screen to connect the backend later. All state lives in-memory in the mock layer; no persistence, no backend calls.

**Tech Stack:** Expo SDK (blank-typescript template), expo-router, react-native-svg, @expo-google-fonts/dm-sans, @expo-google-fonts/plus-jakarta-sans, Jest (via Expo)

**Spec:** `docs/superpowers/specs/2026-04-24-freshtrack-prototype-design.md`

---

## File Map

```
mobile/
  app/
    _layout.tsx              root Stack layout, loads fonts
    index.tsx                redirects → /onboarding
    onboarding.tsx           2-step auth → meal-times flow
    (tabs)/
      _layout.tsx            Tabs: Fridge · Add · Reminders
      index.tsx              Fridge Home screen
      camera.tsx             Add Groceries screen
      reminders.tsx          Coming Soon placeholder
  components/
    FreshnessOrb.tsx         10px colored dot
    PillBadge.tsx            colored pill label
    SectionLabel.tsx         uppercase section header
    Icons.tsx                SVG icon set (Fridge, Camera, Bell, Search, Chevron, Check, X, Plus, Sparkle, Arrow)
    FridgeItem.tsx           item row + expandable inline actions
    ConfirmItemList.tsx      post-parse editable item list
  services/
    mockApi.ts               mock data + async API functions
  constants/
    theme.ts                 T color tokens
    freshness.ts             bucket logic + BUCKET_CONFIG
  __tests__/
    freshness.test.ts
    mockApi.test.ts
```

---

## Task 1: Bootstrap Expo project

**Files:**
- Create: `mobile/` (Expo scaffold)
- Modify: `mobile/app.json`
- Create: `mobile/.gitignore` addition

- [ ] **Step 1: Scaffold Expo app**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
npx create-expo-app mobile --template blank-typescript
cd mobile
```

- [ ] **Step 2: Install dependencies**

```bash
cd /Users/chloexu/Chloe/code/freshtrack/mobile
npx expo install expo-router react-native-safe-area-context react-native-screens react-native-svg
npx expo install @expo-google-fonts/dm-sans @expo-google-fonts/plus-jakarta-sans expo-font expo-splash-screen
```

- [ ] **Step 3: Update `mobile/app.json`** — add scheme and name

Open `mobile/app.json`. Find the `"expo"` object and update:

```json
{
  "expo": {
    "name": "FreshTrack",
    "slug": "freshtrack",
    "scheme": "freshtrack",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "platforms": ["ios"],
    "ios": {
      "supportsTablet": false
    },
    "plugins": [
      "expo-router"
    ]
  }
}
```

- [ ] **Step 4: Update `mobile/package.json` main entry** — expo-router requires this

In `mobile/package.json`, set:
```json
"main": "expo-router/entry"
```

- [ ] **Step 5: Verify the project starts**

```bash
cd /Users/chloexu/Chloe/code/freshtrack/mobile
npx expo start
```

Expected: Metro bundler starts, QR code appears. Press `i` for iOS simulator or scan with Expo Go. App loads without errors.

- [ ] **Step 6: Commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git add mobile/
git commit -m "feat: bootstrap Expo mobile app"
```

---

## Task 2: Design tokens and freshness logic

**Files:**
- Create: `mobile/constants/theme.ts`
- Create: `mobile/constants/freshness.ts`
- Create: `mobile/__tests__/freshness.test.ts`

- [ ] **Step 1: Write `mobile/constants/theme.ts`**

```typescript
export const T = {
  cream: '#F7F5F0',
  creamDark: '#EEE9DF',
  green900: '#162B1E',
  green800: '#1F3D2A',
  green700: '#2A5238',
  green600: '#3A6B4A',
  green500: '#4C8A60',
  green400: '#6AA87E', // alias for sage
  green200: '#C2DEC9',
  green100: '#E4F2E8', // alias for sageLight
  amber: '#D97B2A',
  amberLight: '#FFF0DC',
  coral: '#C94040',
  coralLight: '#FDEAEA',
  sage: '#6AA87E',
  sageLight: '#E4F2E8',
  ink: '#1A1F1C',
  inkMid: '#4A5550',
  inkLight: '#8A9690',
  border: '#DDD8CF',
  white: '#FFFFFF',
} as const;
```

- [ ] **Step 2: Write failing tests in `mobile/__tests__/freshness.test.ts`**

```typescript
import { getFreshnessBucket, getFreshnessLabel } from '../constants/freshness';

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-04-24'));
});
afterEach(() => jest.useRealTimers());

describe('getFreshnessBucket', () => {
  it('returns urgent for 1 day away', () => {
    expect(getFreshnessBucket('2026-04-25')).toBe('urgent');
  });
  it('returns urgent for 2 days away', () => {
    expect(getFreshnessBucket('2026-04-26')).toBe('urgent');
  });
  it('returns soon for 3 days away', () => {
    expect(getFreshnessBucket('2026-04-27')).toBe('soon');
  });
  it('returns soon for 6 days away', () => {
    expect(getFreshnessBucket('2026-04-30')).toBe('soon');
  });
  it('returns fresh for 7 days away', () => {
    expect(getFreshnessBucket('2026-05-01')).toBe('fresh');
  });
  it('returns urgent for today (0 days)', () => {
    expect(getFreshnessBucket('2026-04-24')).toBe('urgent');
  });
});

describe('getFreshnessLabel', () => {
  it('returns "today" for today', () => {
    expect(getFreshnessLabel('2026-04-24')).toBe('today');
  });
  it('returns "tomorrow" for 1 day away', () => {
    expect(getFreshnessLabel('2026-04-25')).toBe('tomorrow');
  });
  it('returns "5d" for 5 days away', () => {
    expect(getFreshnessLabel('2026-04-29')).toBe('5d');
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
cd /Users/chloexu/Chloe/code/freshtrack/mobile
npx jest __tests__/freshness.test.ts
```

Expected: FAIL — "Cannot find module '../constants/freshness'"

- [ ] **Step 4: Write `mobile/constants/freshness.ts`**

```typescript
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
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx jest __tests__/freshness.test.ts
```

Expected: 9 passed

- [ ] **Step 6: Commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git add mobile/constants/ mobile/__tests__/freshness.test.ts
git commit -m "feat: design tokens and freshness bucket logic"
```

---

## Task 3: Mock service layer

**Files:**
- Create: `mobile/services/mockApi.ts`
- Create: `mobile/__tests__/mockApi.test.ts`

- [ ] **Step 1: Write failing tests in `mobile/__tests__/mockApi.test.ts`**

```typescript
import * as mockApi from '../services/mockApi';

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-04-24'));
  mockApi.__resetItems();
});
afterEach(() => jest.useRealTimers());

describe('getItems', () => {
  it('returns 8 in_fridge items', async () => {
    const items = await mockApi.getItems();
    expect(items).toHaveLength(8);
    expect(items.every(i => i.status === 'in_fridge')).toBe(true);
  });

  it('predicted_expiry values are ISO date strings', async () => {
    const items = await mockApi.getItems();
    const isoDate = /^\d{4}-\d{2}-\d{2}$/;
    items.forEach(i => expect(i.predicted_expiry).toMatch(isoDate));
  });
});

describe('updateItem', () => {
  it('marks item as consumed and hides it from getItems', async () => {
    const [first] = await mockApi.getItems();
    await mockApi.updateItem(first.id, { status: 'consumed' });
    const after = await mockApi.getItems();
    expect(after.find(i => i.id === first.id)).toBeUndefined();
  });
});

describe('deleteItem', () => {
  it('removes item from getItems', async () => {
    const [first] = await mockApi.getItems();
    await mockApi.deleteItem(first.id);
    const after = await mockApi.getItems();
    expect(after.find(i => i.id === first.id)).toBeUndefined();
    expect(after).toHaveLength(7);
  });
});

describe('createItems', () => {
  it('adds new items that appear in getItems', async () => {
    await mockApi.createItems([{
      name: 'Test Item',
      quantity: '1',
      purchase_date: '2026-04-24',
      predicted_expiry: '2026-05-01',
    }]);
    const items = await mockApi.getItems();
    expect(items.some(i => i.name === 'Test Item')).toBe(true);
    expect(items).toHaveLength(9);
  });
});

describe('parseReceipt', () => {
  it('returns 3 parsed items', async () => {
    const result = await mockApi.parseReceipt('fake_base64');
    expect(result.items).toHaveLength(3);
    expect(result.items[0].confidence).toBe('high');
    expect(result.items[1].confidence).toBe('low');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/chloexu/Chloe/code/freshtrack/mobile
npx jest __tests__/mockApi.test.ts
```

Expected: FAIL — "Cannot find module '../services/mockApi'"

- [ ] **Step 3: Write `mobile/services/mockApi.ts`**

```typescript
export type Item = {
  id: string;
  name: string;
  quantity: string | null;
  purchase_date: string;
  predicted_expiry: string;
  status: 'in_fridge' | 'consumed' | 'discarded';
  status_at: string | null;
  created_at: string;
};

export type ItemCreate = {
  name: string;
  quantity: string | null;
  purchase_date: string;
  predicted_expiry: string;
};

export type ParsedItem = {
  name: string;
  quantity: string | null;
  predicted_expiry_days: number;
  confidence: 'high' | 'medium' | 'low';
};

export type ParseReceiptResponse = {
  items: ParsedItem[];
  parse_notes: string | null;
};

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function uuid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function makeInitialItems(): Item[] {
  const t = today();
  return [
    { id: uuid(), name: 'Chicken Breast',  quantity: '2 lbs',    purchase_date: t, predicted_expiry: daysFromNow(1),  status: 'in_fridge', status_at: null, created_at: t },
    { id: uuid(), name: 'Salmon Fillet',   quantity: '1 lb',     purchase_date: t, predicted_expiry: daysFromNow(2),  status: 'in_fridge', status_at: null, created_at: t },
    { id: uuid(), name: 'Strawberries',    quantity: '1 pint',   purchase_date: t, predicted_expiry: daysFromNow(3),  status: 'in_fridge', status_at: null, created_at: t },
    { id: uuid(), name: 'Spinach',         quantity: 'bag',      purchase_date: t, predicted_expiry: daysFromNow(4),  status: 'in_fridge', status_at: null, created_at: t },
    { id: uuid(), name: 'Greek Yogurt',    quantity: '32 oz',    purchase_date: t, predicted_expiry: daysFromNow(6),  status: 'in_fridge', status_at: null, created_at: t },
    { id: uuid(), name: 'Mango',           quantity: '2',        purchase_date: t, predicted_expiry: daysFromNow(8),  status: 'in_fridge', status_at: null, created_at: t },
    { id: uuid(), name: 'Cheddar Cheese',  quantity: '8 oz',     purchase_date: t, predicted_expiry: daysFromNow(12), status: 'in_fridge', status_at: null, created_at: t },
    { id: uuid(), name: 'Whole Milk',      quantity: '1 gallon', purchase_date: t, predicted_expiry: daysFromNow(14), status: 'in_fridge', status_at: null, created_at: t },
  ];
}

let items: Item[] = makeInitialItems();

// Exported for tests only
export function __resetItems() {
  items = makeInitialItems();
}

const DELAY = 200;
function wait<T>(v: T): Promise<T> {
  return new Promise(r => setTimeout(() => r(v), DELAY));
}

export async function getItems(): Promise<Item[]> {
  return wait(items.filter(i => i.status === 'in_fridge'));
}

export async function updateItem(id: string, patch: Partial<Item>): Promise<Item> {
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) throw new Error(`Item ${id} not found`);
  items[idx] = {
    ...items[idx],
    ...patch,
    status_at: patch.status && patch.status !== 'in_fridge'
      ? new Date().toISOString()
      : items[idx].status_at,
  };
  return wait(items[idx]);
}

export async function deleteItem(id: string): Promise<void> {
  items = items.filter(i => i.id !== id);
  return wait(undefined as unknown as void);
}

export async function createItems(newItems: ItemCreate[]): Promise<Item[]> {
  const t = today();
  const created: Item[] = newItems.map(item => ({
    ...item,
    id: uuid(),
    status: 'in_fridge' as const,
    status_at: null,
    created_at: t,
  }));
  items = [...items, ...created];
  return wait(created);
}

const MOCK_PARSE_RESULT: ParseReceiptResponse = {
  items: [
    { name: 'Salmon Fillet', quantity: '1 lb',     predicted_expiry_days: 2,  confidence: 'high' },
    { name: 'Mixed Greens',  quantity: 'bag',      predicted_expiry_days: 5,  confidence: 'low'  },
    { name: 'Whole Milk',    quantity: '1 gallon', predicted_expiry_days: 10, confidence: 'high' },
  ],
  parse_notes: null,
};

export async function parseReceipt(_base64: string): Promise<ParseReceiptResponse> {
  return wait(MOCK_PARSE_RESULT);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/mockApi.test.ts
```

Expected: 6 passed

- [ ] **Step 5: Commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git add mobile/services/ mobile/__tests__/mockApi.test.ts
git commit -m "feat: mock service layer with in-memory state"
```

---

## Task 4: Shared micro-components and icons

**Files:**
- Create: `mobile/components/Icons.tsx`
- Create: `mobile/components/FreshnessOrb.tsx`
- Create: `mobile/components/PillBadge.tsx`
- Create: `mobile/components/SectionLabel.tsx`

- [ ] **Step 1: Write `mobile/components/Icons.tsx`**

```typescript
import React from 'react';
import Svg, { Rect, Line, Path, Circle, Polyline, Polygon } from 'react-native-svg';
import { T } from '../constants/theme';

type Props = { size?: number; color?: string };

export function FridgeIcon({ size = 22, color = T.inkLight }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="4" y="2" width="16" height="20" rx="2" />
      <Line x1="4" y1="10" x2="20" y2="10" />
      <Line x1="9" y1="6" x2="9" y2="8" />
      <Line x1="9" y1="14" x2="9" y2="18" />
    </Svg>
  );
}

export function CameraIcon({ size = 22, color = T.inkLight }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <Circle cx="12" cy="13" r="4" />
    </Svg>
  );
}

export function BellIcon({ size = 22, color = T.inkLight }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Svg>
  );
}

export function SearchIcon({ size = 16, color = T.inkLight }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="11" cy="11" r="8" />
      <Line x1="21" y1="21" x2="16.65" y2="16.65" />
    </Svg>
  );
}

export function ChevronRightIcon({ size = 14, color = T.inkLight }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="9 18 15 12 9 6" />
    </Svg>
  );
}

export function CheckIcon({ size = 14, color = T.white }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="20 6 9 17 4 12" />
    </Svg>
  );
}

export function XIcon({ size = 12, color = T.coral }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round">
      <Line x1="18" y1="6" x2="6" y2="18" />
      <Line x1="6" y1="6" x2="18" y2="18" />
    </Svg>
  );
}

export function PlusIcon({ size = 16, color = T.green700 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round">
      <Line x1="12" y1="5" x2="12" y2="19" />
      <Line x1="5" y1="12" x2="19" y2="12" />
    </Svg>
  );
}

export function SparkleIcon({ size = 16, color = T.white }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Polygon points="12 2 14.4 9.4 22 9.4 15.8 13.9 18.2 21.3 12 17 5.8 21.3 8.2 13.9 2 9.4 9.6 9.4" />
    </Svg>
  );
}

export function ArrowUpIcon({ size = 18, color = T.white }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Line x1="12" y1="19" x2="12" y2="5" />
      <Polyline points="5 12 12 5 19 12" />
    </Svg>
  );
}
```

- [ ] **Step 2: Write `mobile/components/FreshnessOrb.tsx`**

```typescript
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
```

- [ ] **Step 3: Write `mobile/components/PillBadge.tsx`**

```typescript
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
```

- [ ] **Step 4: Write `mobile/components/SectionLabel.tsx`**

```typescript
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
```

- [ ] **Step 5: Commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git add mobile/components/
git commit -m "feat: shared micro-components and icon set"
```

---

## Task 5: Root layout, redirect, and Onboarding screen

**Files:**
- Create: `mobile/app/_layout.tsx`
- Create: `mobile/app/index.tsx`
- Create: `mobile/app/onboarding.tsx`

- [ ] **Step 1: Write `mobile/app/_layout.tsx`**

```typescript
import { useEffect } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';
import {
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
```

- [ ] **Step 2: Write `mobile/app/index.tsx`**

```typescript
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/onboarding" />;
}
```

- [ ] **Step 3: Write `mobile/app/onboarding.tsx`**

```typescript
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { T } from '../constants/theme';

type Step = 'auth' | 'meal_times';
type Mode = 'register' | 'login';

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('auth');
  const [mode, setMode] = useState<Mode>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [lunchTime, setLunchTime] = useState('12:00');
  const [dinnerTime, setDinnerTime] = useState('18:30');

  function handleAuth() {
    // Mock: skip validation, go to step 2
    setStep('meal_times');
  }

  function handleGetStarted() {
    // Mock: skip saving, navigate to tabs
    router.replace('/(tabs)');
  }

  if (step === 'meal_times') {
    return (
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Text style={s.title}>When do you eat?</Text>
          <Text style={s.subtitle}>We'll use these times to schedule reminders.</Text>

          <Text style={s.label}>Lunch time</Text>
          <TextInput
            style={s.input}
            value={lunchTime}
            onChangeText={setLunchTime}
            placeholder="12:00"
            placeholderTextColor={T.inkLight}
          />

          <Text style={s.label}>Dinner time</Text>
          <TextInput
            style={s.input}
            value={dinnerTime}
            onChangeText={setDinnerTime}
            placeholder="18:30"
            placeholderTextColor={T.inkLight}
          />

          <TouchableOpacity style={s.btn} onPress={handleGetStarted} activeOpacity={0.8}>
            <Text style={s.btnText}>Get started →</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={s.title}>FreshTrack</Text>
        <Text style={s.subtitle}>Zero-waste grocery tracking.</Text>

        <TextInput
          style={s.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={T.inkLight}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={s.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={T.inkLight}
          secureTextEntry
        />

        <TouchableOpacity style={s.btn} onPress={handleAuth} activeOpacity={0.8}>
          <Text style={s.btnText}>
            {mode === 'register' ? 'Create account' : 'Sign in'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMode(mode === 'register' ? 'login' : 'register')}>
          <Text style={s.toggle}>
            {mode === 'register'
              ? 'Already have an account? Sign in'
              : 'New here? Create account'}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.cream },
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 26, fontWeight: '700', color: T.ink, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 13, color: T.inkMid, fontFamily: 'DMSans_400Regular', marginBottom: 32 },
  label: { fontSize: 13, color: T.inkMid, fontFamily: 'DMSans_400Regular', marginBottom: 6 },
  input: {
    backgroundColor: T.creamDark,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: T.ink,
    fontFamily: 'DMSans_400Regular',
    marginBottom: 12,
  },
  btn: {
    backgroundColor: T.green700,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: { color: T.white, fontSize: 16, fontWeight: '600', fontFamily: 'DMSans_600SemiBold' },
  toggle: { textAlign: 'center', color: T.inkLight, fontFamily: 'DMSans_400Regular', fontSize: 13, marginTop: 16 },
});
```

- [ ] **Step 4: Verify on device**

```bash
cd /Users/chloexu/Chloe/code/freshtrack/mobile
npx expo start
```

Open in Expo Go. Expected: onboarding screen appears with cream background. Tap "Create account" → meal times step. Tap "Get started →" → navigates to tabs (blank for now).

- [ ] **Step 5: Commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git add mobile/app/
git commit -m "feat: root layout, font loading, and onboarding screen"
```

---

## Task 6: Tab layout and Reminders placeholder

**Files:**
- Create: `mobile/app/(tabs)/_layout.tsx`
- Create: `mobile/app/(tabs)/reminders.tsx`

- [ ] **Step 1: Write `mobile/app/(tabs)/_layout.tsx`**

```typescript
import { Tabs } from 'expo-router';
import { T } from '../../constants/theme';
import { FridgeIcon, CameraIcon, BellIcon } from '../../components/Icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: T.white,
          borderTopColor: T.border,
          borderTopWidth: 1,
          paddingBottom: 20,
          height: 70,
        },
        tabBarActiveTintColor: T.green700,
        tabBarInactiveTintColor: T.inkLight,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'DMSans_500Medium',
          letterSpacing: 0.1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Fridge',
          tabBarIcon: ({ color, size }) => <FridgeIcon size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Add',
          tabBarIcon: ({ color, size }) => <CameraIcon size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: 'Reminders',
          tabBarIcon: ({ size }) => <BellIcon size={size} color={T.inkLight} />,
          tabBarLabelStyle: {
            fontSize: 11,
            fontFamily: 'DMSans_500Medium',
            letterSpacing: 0.1,
            color: T.inkLight,
          },
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 2: Write `mobile/app/(tabs)/reminders.tsx`**

```typescript
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
```

- [ ] **Step 3: Create placeholder screens so the app doesn't crash**

Create `mobile/app/(tabs)/index.tsx` and `mobile/app/(tabs)/camera.tsx` as empty stubs (they'll be replaced in later tasks):

```typescript
// mobile/app/(tabs)/index.tsx
import { View, Text } from 'react-native';
import { T } from '../../constants/theme';
export default function FridgeScreen() {
  return <View style={{ flex: 1, backgroundColor: T.cream, alignItems: 'center', justifyContent: 'center' }}><Text>Fridge — coming next</Text></View>;
}
```

```typescript
// mobile/app/(tabs)/camera.tsx
import { View, Text } from 'react-native';
import { T } from '../../constants/theme';
export default function CameraScreen() {
  return <View style={{ flex: 1, backgroundColor: T.cream, alignItems: 'center', justifyContent: 'center' }}><Text>Add — coming next</Text></View>;
}
```

- [ ] **Step 4: Verify on device**

Open app. Expected: 3-tab bar at bottom. Fridge and Add show placeholder text. Reminders shows bell icon + "Coming soon". Active tab shows green700 icon + dot indicator.

- [ ] **Step 5: Commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git add mobile/app/\(tabs\)/
git commit -m "feat: tab layout and Reminders placeholder"
```

---

## Task 7: FridgeItem component

**Files:**
- Create: `mobile/components/FridgeItem.tsx`

- [ ] **Step 1: Write `mobile/components/FridgeItem.tsx`**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git add mobile/components/FridgeItem.tsx
git commit -m "feat: FridgeItem component with expandable inline actions"
```

---

## Task 8: Fridge Home screen

**Files:**
- Modify: `mobile/app/(tabs)/index.tsx` (replace stub)

- [ ] **Step 1: Replace `mobile/app/(tabs)/index.tsx` with full implementation**

```typescript
import { useState, useCallback, useRef } from 'react';
import {
  View, Text, SectionList, StyleSheet, TextInput,
  TouchableOpacity, Animated, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { T } from '../../constants/theme';
import { getItems, updateItem, deleteItem, Item } from '../../services/mockApi';
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

  async function loadItems() {
    const data = await getItems();
    setItems(data);
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
```

- [ ] **Step 2: Verify on device**

Open app → skip onboarding → Fridge tab. Expected:
- 8 items shown in 3 groups (Use Today: 2, Use Soon: 3, Still Fresh: 3)
- Tap any row → inline actions expand; tap again to collapse
- Tap "✓ Used it" → strikethrough → toast slides in from top → item disappears after ~1s
- Tap "✕ Remove" → item disappears immediately
- Type in search box → list filters live; empty groups hidden

- [ ] **Step 3: Commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git add mobile/app/\(tabs\)/index.tsx
git commit -m "feat: Fridge Home screen with live search and celebratory toast"
```

---

## Task 9: ConfirmItemList component

**Files:**
- Create: `mobile/components/ConfirmItemList.tsx`

- [ ] **Step 1: Write `mobile/components/ConfirmItemList.tsx`**

```typescript
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
          <Text style={s.confirmText}>Save to fridge ({items.length})</Text>
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
```

- [ ] **Step 2: Commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git add mobile/components/ConfirmItemList.tsx
git commit -m "feat: ConfirmItemList with inline editing and low-confidence badges"
```

---

## Task 10: Add Groceries screen

**Files:**
- Modify: `mobile/app/(tabs)/camera.tsx` (replace stub)

- [ ] **Step 1: Replace `mobile/app/(tabs)/camera.tsx` with full implementation**

```typescript
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { T } from '../../constants/theme';
import { parseReceipt, createItems, ParsedItem } from '../../services/mockApi';
import { ConfirmItemList } from '../../components/ConfirmItemList';
import { CameraIcon, SparkleIcon } from '../../components/Icons';

type ScreenState = 'capture' | 'confirm' | 'loading';

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
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Add Groceries</Text>
        <Text style={s.subtitle}>Snap your cart or receipt to import</Text>
      </View>

      {/* Camera zone */}
      <View style={s.cameraZone}>
        {/* Corner brackets */}
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

      {/* Analyze button */}
      <TouchableOpacity
        style={s.analyzeBtn}
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
  analyzeBtnText: { color: T.white, fontSize: 16, fontWeight: '600', fontFamily: 'DMSans_600SemiBold' },
});
```

- [ ] **Step 2: Verify full flow on device**

1. Open app → skip onboarding → tap **Add** tab
2. Camera zone with corner brackets, "Analyze Photo" button visible
3. Tap "Analyze Photo" → button shows "Analyzing…" briefly → confirm list appears with 3 items
4. Mixed Greens has amber border (low confidence)
5. Tap a row → inline edit fields expand (name, qty, days)
6. Tap ✕ on an item → row removed, count updates in CTA
7. Tap "Save to fridge (N)" → navigates to Fridge tab → new items appear in list

- [ ] **Step 3: Commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git add mobile/app/\(tabs\)/camera.tsx
git commit -m "feat: Add Groceries screen with mock parse and confirm flow"
```

---

## Task 11: Run all tests and final verification

- [ ] **Step 1: Run full test suite**

```bash
cd /Users/chloexu/Chloe/code/freshtrack/mobile
npx jest
```

Expected: all tests pass (freshness.test.ts: 9 passed, mockApi.test.ts: 6 passed)

- [ ] **Step 2: Full end-to-end checklist on device**

Open app in Expo Go and verify each flow:

| Flow | Expected |
|------|----------|
| Launch | Onboarding screen, cream bg, "FreshTrack" header |
| Tap "Create account" | Meal times step appears |
| Tap "Get started →" | Fridge tab loads with 8 items in 3 groups |
| Tap item row | Inline actions expand; other open row collapses |
| Tap "✓ Used it" | Strikethrough + toast slides in, item gone after ~1s |
| Tap "✕ Remove" | Item disappears immediately |
| Tap "✎ Edit" | Nothing (no-op — expected) |
| Type in search | List filters live; empty groups hidden |
| Tap "+ Add" in header | Navigates to Add tab |
| Tap Add tab | Camera zone + "Analyze Photo" button |
| Tap "Analyze Photo" | Shows "Analyzing…" then confirm list with 3 items |
| Mixed Greens row | Amber border, "Low confidence" badge |
| Tap confirm item row | Inline edit fields appear |
| Tap ✕ on item | Row removed, CTA count decreases |
| Tap "Save to fridge" | Navigates to Fridge, new items appear |
| Tap Reminders tab | "Coming soon" screen, bell icon, no crash |

- [ ] **Step 3: Final commit**

```bash
cd /Users/chloexu/Chloe/code/freshtrack
git add .
git commit -m "feat: complete FreshTrack frontend prototype with mock data"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| T color tokens | Task 2 |
| Plus Jakarta Sans + DM Sans fonts | Task 5 |
| Freshness bucket logic (urgent/soon/fresh) | Task 2 |
| mockApi.ts with same signatures as api.ts | Task 3 |
| 8 mock items, expiry computed from days not literal dates | Task 3 |
| Mock parse result (3 items, 1 low-confidence) | Task 3 |
| FreshnessOrb, PillBadge, SectionLabel | Task 4 |
| SVG icons matching screens.jsx | Task 4 |
| Onboarding 2-step (auth → meal times) | Task 5 |
| Mock: skip auth, navigate to tabs | Task 5 |
| Redirect from / → onboarding | Task 5 |
| Tab bar: Fridge · Add · Reminders | Task 6 |
| Reminders: always inkLight, navigates to placeholder | Task 6 |
| Fridge Home: group headers with dot + fade line + count | Task 8 |
| Item rows: white card, 3px left border, orb, pill, day count | Task 7 |
| Expand/collapse inline actions (one open at a time) | Task 7+8 |
| "✓ Used it" → updateItem → strikethrough → toast → remove after 800ms | Task 8 |
| "✕ Remove" → deleteItem → immediate removal | Task 8 |
| "✎ Edit" → no-op | Task 7 |
| Toast: green900, spring anim, randomized message | Task 8 |
| Search: live filter by name, empty groups hidden | Task 8 |
| "+ Add" button navigates to Add tab | Task 8 |
| Pull-to-refresh: no-op (reloads same state) | Task 8 |
| Add screen: capture state vs confirm state | Task 10 |
| Camera zone: green900, corner brackets | Task 10 |
| "Analyze Photo" → mockApi.parseReceipt → confirm list | Task 10 |
| ConfirmItemList: always-visible ✕, low-confidence amber | Task 9 |
| Tap row in confirm list → inline edit fields | Task 9 |
| "Save to fridge" → createItems → navigate to Fridge | Task 10 |
