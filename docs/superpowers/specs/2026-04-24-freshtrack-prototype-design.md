# FreshTrack — Frontend Prototype Design Spec

**Date:** 2026-04-24
**Status:** Approved
**Scope:** Expo React Native iOS prototype with mock data — no backend required

---

## Goal

Build a fully navigable Expo app that demonstrates the core FreshTrack UX using hardcoded mock data. The prototype runs on-device via Expo Go and becomes the foundation for the real app — no throwaway work.

---

## Design System

Source of truth: `docs/screens.jsx`. All components use the `T` token palette.

### Color Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| `cream` | `#F7F5F0` | Screen background |
| `creamDark` | `#EEE9DF` | Secondary bg, Edit button |
| `green900` | `#162B1E` | Camera zone bg, dark CTAs, toast bg |
| `green700` | `#2A5238` | Primary buttons, active tab, user chat bubbles |
| `green600` | `#3A6B4A` | Sparkle icon |
| `green400` | `#6AA87E` | Alias for `sage` — same value, use `sage` in component code |
| `green200` | `#C2DEC9` | Add button border |
| `green100` | `#E4F2E8` | Alias for `sageLight` — same value, use `sageLight` in component code |
| `amber` | `#D97B2A` | Use Soon (3–6d) color |
| `amberLight` | `#FFF0DC` | Use Soon pill bg |
| `coral` | `#C94040` | Use Today (1–2d) color |
| `coralLight` | `#FDEAEA` | Use Today pill bg |
| `sage` | `#6AA87E` | Still Fresh (7d+) color, Used-it action, consumed check circle |
| `sageLight` | `#E4F2E8` | Still Fresh pill bg, Used-it action bg |
| `ink` | `#1A1F1C` | Primary text |
| `inkMid` | `#4A5550` | Secondary text |
| `inkLight` | `#8A9690` | Tertiary text, inactive icons |
| `border` | `#DDD8CF` | Dividers, input borders |
| `white` | `#FFFFFF` | Card backgrounds |

### Typography

- **Screen headers:** Plus Jakarta Sans 700, 26px, letterSpacing -0.5
- **Body, labels, buttons:** DM Sans (300/400/500/600)

### Freshness Buckets

| Bucket | Days | Color | Pill bg |
|--------|------|-------|---------|
| Use Today | 1–2d | `coral` | `coralLight` |
| Use Soon | 3–6d | `amber` | `amberLight` |
| Still Fresh | 7d+ | `sage` | `sageLight` |

---

## Architecture

### File Structure

```
mobile/
  app/
    _layout.tsx            root layout — auth gate (mock: always → tabs)
    onboarding.tsx         2-step onboarding flow
    (tabs)/
      _layout.tsx          tab bar: Fridge · Add · Reminders
      index.tsx            Fridge Home screen
      camera.tsx           Add Groceries screen
      reminders.tsx        Reminders placeholder (grayed out)
  components/
    FridgeItem.tsx         item row + expandable inline actions
    ConfirmItemList.tsx    post-parse editable item list
  services/
    mockApi.ts             mock data + async functions (same signatures as api.ts)
    api.ts                 real API (untouched)
    auth.ts                token management (untouched)
  constants/
    freshness.ts           bucket logic + T color tokens
```

### Mock Service Layer

`services/mockApi.ts` exports async functions with identical signatures to `api.ts`. Screens import from `mockApi`. To connect the real backend: change one import line per screen.

```typescript
// mockApi.ts exports:
getItems(): Promise<Item[]>
updateItem(id: string, patch: Partial<Item>): Promise<Item>
deleteItem(id: string): Promise<void>
parseReceipt(base64: string): Promise<ParseReceiptResponse>
createItems(items: ItemCreate[]): Promise<Item[]>
```

All mock functions return `Promise.resolve(data)` with a short artificial delay (200ms) to simulate network feel.

Mock items are stored in a module-level mutable array so state persists across calls within a session (consumed/deleted items stay gone until the app is reloaded). `predicted_expiry` is computed at module init time as `new Date(Date.now() + days * 86400000).toISOString().split('T')[0]` — never hard-coded as a literal date string.

### Mock Data

**8 items across all freshness buckets:**

| Name | Qty | Days until expiry | Bucket |
|------|-----|-------------------|--------|
| Chicken Breast | 2 lbs | 1 | Use Today |
| Salmon Fillet | 1 lb | 2 | Use Today |
| Strawberries | 1 pint | 3 | Use Soon |
| Spinach | bag | 4 | Use Soon |
| Greek Yogurt | 32 oz | 6 | Use Soon |
| Mango | 2 | 8 | Still Fresh |
| Cheddar Cheese | 8 oz | 12 | Still Fresh |
| Whole Milk | 1 gallon | 14 | Still Fresh |

**Mock parse result (3 items, shown after tapping "Analyze Photo"):**

| Name | Days | Confidence |
|------|------|------------|
| Salmon Fillet | 2 | high |
| Mixed Greens | 5 | low |
| Whole Milk | 10 | high |

---

## Screens

### Screen 1 — Onboarding (`onboarding.tsx`)

**Step 1: Auth**
- Logo/title "FreshTrack" (Plus Jakarta Sans 700, ink)
- Subtitle: "Zero-waste grocery tracking."
- Email input, Password input (cream bg, border, rounded)
- "Create account" button (green700, full width)
- "Already have an account? Sign in" toggle link

**Step 2: Meal Times**
- Title: "When do you eat?"
- Lunch time input (default "12:00")
- Dinner time input (default "18:30")
- "Get started →" button (green700)

**Mock behavior:** Tapping "Create account" or "Sign in" skips auth validation and goes directly to Step 2. Tapping "Get started" navigates to `/(tabs)`.

---

### Screen 2 — Fridge Home (`(tabs)/index.tsx`)

**Header:**
- Title: "My Fridge" (Plus Jakarta Sans 700)
- Subtitle: "{N} items · {M} expiring soon" (inkMid)
- "+ Add" button top-right (green100 bg, green200 border, green700 text) — tapping navigates to the Add tab

**Search bar:** white bg, border, inkLight placeholder "Search your fridge…", SearchIcon. Filters the list live by item name (case-insensitive substring match). Filtering applies across all groups; empty groups are hidden.

**Freshness groups:**
Each group has a header row: colored dot + colored uppercase label (10px, letterSpacing 1.2) + colored fade divider line + item count.

**Item row (`FridgeItem.tsx`):**
- White card, 3px left colored border (matching bucket color)
- Circle checkbox (24px, border) — filled green with checkmark when consumed
- Name (ink, 15px 500) + detail line (inkLight, 12px)
- Expiry pill badge (bucket color on bucket bg, 11px 600, borderRadius 20)
- Day count (bucket color, 13px 600)
- Tap → expand inline action row below

**Inline action row (expanded state):**
- 3 equal buttons: "✓ Used it" (sage/sageLight) | "✎ Edit" (inkMid/creamDark) | "✕ Remove" (coral/coralLight)
- Separated by `border` dividers
- Rounded bottom corners matching card

**Interactions:**
- Tap row → toggle expand/collapse (only one open at a time)
- "✓ Used it" → calls `updateItem(id, { status: 'consumed' })` → item gets strikethrough + check circle + 0.6 opacity → toast appears → item removed from list after 1s
- "✕ Remove" → calls `deleteItem(id)` → item disappears immediately
- "✎ Edit" → no-op in prototype (no modal)
- Pull-to-refresh → no-op (returns same in-memory state; items consumed/removed in this session stay gone)

**Toast (celebratory):**
- green900 bg, borderRadius 16, spring animation (slides down from top)
- Gradient circle icon (green500→amber) with ✓
- Randomized message: "Nice work using up the {name}! 🌿" / "{name} done! Zero waste win 🎉" / etc.
- Auto-dismisses after 3s

---

### Screen 3 — Add Groceries (`(tabs)/camera.tsx`)

**Header:** "Add Groceries" (Plus Jakarta Sans 700) + subtitle "Snap your cart or receipt to import"

**Camera zone:**
- green900 background, borderRadius 20, height 200
- Radial gradient overlay (green700 at 60%/40%)
- Corner bracket decorations (green400, 20×20px)
- Camera icon (52px frosted-glass circle)
- Text: "Take a photo" + "cart · receipt · shelf label"

**"Analyze Photo" button:** green700, full width, SparkleIcon + label, borderRadius 14

**Mock behavior:** Tapping "Analyze Photo" skips the actual camera and immediately shows the pre-canned detected items list.

**State machine:** The Add screen has two states:
1. **Capture state** (default): camera zone + Analyze Photo button visible, no item list
2. **Confirm state**: item list visible, camera zone hidden, bottom CTA visible

Tapping "Analyze Photo" transitions from Capture → Confirm. Tapping "Cancel" or after saving returns to Capture.

**Detected items list (`ConfirmItemList.tsx`):**
- Section label: "Detected Items — tap to edit"
- White cards, 3px left colored border (by urgency level), grouped (first/last card has larger border radius)
- Each row: FreshnessOrb + name + qty (inkLight) + `~{N}d` pill + always-visible ✕ button (XIcon, coral)
- ChevronRightIcon is decorative only — tapping the row expands inline edit fields below it: name (TextInput), qty (TextInput), days (numeric TextInput). Tap row again to collapse.
- Low-confidence items: amber left border, `amberLight` bg

**Bottom CTA:** "Save {N} Items to Fridge →" (green900, full width, borderRadius 14)

**Interactions:**
- Tap item row → expand/collapse inline edit fields (name, qty, days)
- ✕ button (always visible, right side of row) → removes that row, updates CTA count
- "Save {N} Items to Fridge →" → calls `createItems()` → navigates to Fridge tab, transitions Add screen back to Capture state

---

### Screen 4 — Reminders tab (`(tabs)/reminders.tsx`)

Grayed-out placeholder. Tab bar item: BellIcon + "Reminders" label, always rendered in inkLight (inactive style). Tapping the tab navigates to `reminders.tsx` which shows a centered "Coming soon" message on cream background. The tab is tappable — it just goes to a dead-end screen rather than being disabled, which avoids Expo Router complexity.

---

### Tab Bar (`TabBar` component)

- White bg, top border (border color)
- 3 tabs: FridgeIcon · CameraIcon · BellIcon
- Active tab: green700 icon + label (600 weight) + 4px green600 dot below label
- Inactive: inkLight icon + label (400 weight)
- Reminders tab: always rendered as inactive (inkLight), tap navigates to the Coming Soon screen

---

## Shared Components

### `FreshnessOrb`
10px circle, filled with bucket color. Used in item rows and detected items list.

### `PillBadge`
Inline pill: `{color}` text on `{bg}`, 11px 500, borderRadius 20, padding 3px 9px.

### `SectionLabel`
10px 600 uppercase, inkLight, letterSpacing 1.2. Used above detected items list.

---

## `constants/freshness.ts`

Exports `T` color tokens (matching `docs/screens.jsx`) and bucket logic:

```typescript
function getFreshnessBucket(predictedExpiry: string): 'urgent' | 'soon' | 'fresh'
function getFreshnessLabel(predictedExpiry: string): string  // "today" | "tomorrow" | "N days"
const BUCKET_CONFIG: Record<bucket, { label, color, bg, dotColor }>
```

Bucket thresholds: urgent = 1–2d, soon = 3–6d, fresh = 7d+.

---

## Out of Scope

- Real camera capture (mock bypasses it)
- Auth validation (mock skips to step 2 immediately)
- Backend API calls
- Edit item modal (Edit button is no-op)
- Reminders functionality (placeholder only)
- Push notifications
