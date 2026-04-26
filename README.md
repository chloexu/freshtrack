# FreshTrack

Zero-waste grocery tracking. FreshTrack helps you track what's in your fridge, flags items expiring soon, and reduces food waste.

## The Problem

You buy groceries, forget about them, they go bad, get thrown out. Food waste and money waste, on repeat.

Every existing food tracking app has the same fatal flaw: **manual entry**. Adding items one by one (barcode scanning or typing) creates enough friction that users abandon the app within days.

## The Insight

The checkout photo as the onboarding moment. You're already at the store with your cart or receipt in front of you. One photo, LLM vision parses everything, predicted expiry dates pre-filled, you just confirm. **Zero manual entry.**

The real product is time-aware nudging, not inventory management. The fridge tracker is the data layer. The unlock is: instead of expiry alerts ("this expires in 3 days"), you get meal-time reminders ("you have chicken and strawberries — time to plan dinner"). People act on immediacy, not warnings.

The second unlock: plain English reminder preferences. Type "remind me about fruit 2 hours after lunch" and the app produces a structured reminder. No settings screen.

## Success Criteria

- Receipt photo at checkout → ≥80% of items parsed within 30 seconds
- Fruit reminder fires 2 hours after lunch with what's in the fridge
- Consumed items removed from list in one tap
- Zero manual text entry required to track a full grocery run

## Design

![FreshTrack screens — Add Groceries, My Fridge, Reminders](docs/assets/screens-preview.png)

## Project Status

**Phase 0 (current):** iOS prototype with mock data — fully navigable, no backend required.

## Structure

```
freshtrack/
  mobile/          Expo React Native iOS app
  docs/
    screens.jsx    UI reference (design source of truth)
    FreshTrack.html  Design canvas preview
    superpowers/
      specs/       Design specs
      plans/       Implementation plans
```

## Mobile App

Expo Router app targeting iOS. Uses a mock service layer (`mobile/services/mockApi.ts`) with the same API signatures as the real backend — swap one import per screen to go live.

### Running

```bash
cd mobile
npx expo start
```

Scan the QR code with Expo Go (iOS) or press `i` for simulator.

### Tests

```bash
cd mobile
npx jest
```

### Tech Stack

- Expo SDK + Expo Router (file-based navigation)
- React Native / TypeScript
- react-native-svg (icon set)
- @expo-google-fonts/dm-sans + plus-jakarta-sans
- Jest (unit tests for pure logic)

### Design Tokens

Colors, typography, and freshness bucket logic live in `mobile/constants/`. The `T` token palette matches `docs/screens.jsx` exactly.

| Bucket | Days | Color |
|--------|------|-------|
| Use Today | 1–2d | coral `#C94040` |
| Use Soon | 3–6d | amber `#D97B2A` |
| Still Fresh | 7d+ | sage `#6AA87E` |

## Roadmap

- **Phase 0 (now):** Frontend prototype with mock data
- **Phase 1:** Real backend (FastAPI + PostgreSQL) + GPT-4o receipt parsing
- **Phase 2:** Push notification reminders with plain English preference input
- **v2 (future):** Waste coaching — photo your trash at end of week, LLM diffs against what was tracked, learns your actual waste patterns
