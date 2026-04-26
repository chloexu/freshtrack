# FreshTrack — Design Spec

**Date:** 2026-04-13
**Status:** Approved
**Derived from:** GStack office-hours session (2026-03-29)

## Problem

Food waste and money waste from forgetting what's in the fridge. Every existing food tracking app fails at activation: manual entry kills retention before the app delivers value.

The insight: capture all grocery data at the lowest-friction moment — checkout — via a single receipt photo. GPT-4o vision parses it. User just confirms.

## Scope

Two phases:

- **Phase 1:** Backend scaffold + deploy + items API + receipt parsing + Camera & Fridge screens
- **Phase 2:** Reminders API + reminder parsing + push scheduler + Reminder chat & Settings screens

No recipe suggestions, no barcode scanning, no cart photo parsing (receipt only) in v1.

## Architecture

```
iPhone (Expo/TypeScript)  ←→  Python FastAPI  ←→  PostgreSQL
                                    ↓
                               OpenAI GPT-4o
                                    ↓
                         Expo Push Service → APNs → iPhone
```

**Backend:** Python FastAPI deployed on Fly.io. PostgreSQL for all data. JWT auth. APScheduler for notification scheduling. Expo Push API for delivery (no direct APNs needed).

**Mobile:** Expo React Native, TypeScript, iOS-first. No local SQLite — all state from server. Token stored in `expo-secure-store`.

## Data Model (PostgreSQL)

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE settings (
  user_id      UUID PRIMARY KEY REFERENCES users(id),
  lunch_time   TIME NOT NULL DEFAULT '12:00',
  dinner_time  TIME NOT NULL DEFAULT '18:30'
);

CREATE TABLE items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id),
  name             TEXT NOT NULL,
  quantity         TEXT,
  purchase_date    DATE NOT NULL,
  predicted_expiry DATE NOT NULL,
  status           TEXT NOT NULL DEFAULT 'in_fridge', -- in_fridge | consumed | discarded
  status_at        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE reminders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id),
  title         TEXT NOT NULL,
  anchor        TEXT NOT NULL,      -- after_lunch | before_dinner | fixed_time
  anchor_offset INTEGER,            -- minutes relative to anchor; null if fixed_time
  fixed_time    TIME,               -- null unless anchor = fixed_time
  cadence       TEXT NOT NULL,      -- daily | every_2_days | weekly
  weekly_day    INTEGER,            -- 0=Sun..6=Sat; non-null only if weekly
  last_fired_at TIMESTAMPTZ,
  enabled       BOOLEAN DEFAULT true
);

CREATE TABLE device_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id),
  token      TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

`status` uses three values: `in_fridge`, `consumed`, `discarded`. Items with status != `in_fridge` are hidden from fridge view. The distinction enables v2 waste tracking without a schema migration.

`predicted_expiry` is stored internally as an ISO date; the UI shows freshness language only ("tomorrow", "5 days") — never raw dates.

## API Endpoints

All endpoints except `/auth/*` require `Authorization: Bearer <jwt>`.

```
Auth
  POST /auth/register        { email, password } → { token }
  POST /auth/login           { email, password } → { token }

Items
  GET  /items                list in_fridge items for current user
  POST /items                create item(s) manually
  PATCH /items/:id           update status or fields
  DELETE /items/:id          hard delete

Receipt Parsing
  POST /parse/receipt        { image_base64 } → { items, parse_notes }

Reminders
  GET  /reminders            list enabled reminders
  POST /reminders            create reminder
  PATCH /reminders/:id       update reminder
  DELETE /reminders/:id      delete reminder

Reminder Parsing
  POST /parse/reminder       { text } → { reminders: [...] }

Settings
  GET  /settings             get lunch_time, dinner_time
  PATCH /settings            update meal times

Push Tokens
  POST /device-tokens        register Expo push token for current user
```

## GPT-4o Integration

### Receipt parsing

Request: base64-encoded receipt image (resized to max 1024px long edge before encoding).

Response schema:
```json
{
  "items": [
    {
      "name": "Strawberries",
      "quantity": "1 pint",
      "predicted_expiry_days": 5,
      "confidence": "high"
    }
  ],
  "parse_notes": "Receipt partially obscured — 2 items may be missing"
}
```

`confidence` is `high` / `medium` / `low`. Low-confidence items are highlighted amber on the confirmation screen. `predicted_expiry_days` is relative to today; server converts to absolute date before storing.

Error handling: API failure or malformed JSON → return error, mobile shows "couldn't parse — add manually" fallback. 429 → return 429, mobile shows toast.

### Reminder parsing

Response schema:
```json
{
  "reminders": [
    {
      "title": "Fruit reminder",
      "anchor": "after_lunch",
      "anchor_offset": 120,
      "fixed_time": null,
      "cadence": "daily"
    }
  ]
}
```

`anchor_offset` is positive for "after" anchors, negative for "before" anchors. `fixed_time` is `"HH:MM"` only when `anchor = "fixed_time"`.

## Notification Scheduler

APScheduler job runs every 15 minutes server-side:

1. For each user with enabled reminders, read `lunch_time` / `dinner_time` from settings
2. Compute next fire time for each reminder across a 3-day window using anchor + offset + cadence
3. For reminders due in the next 15-minute window, query `items` for red/yellow freshness items
4. Build message: *"You have chicken (tomorrow) and strawberries (2 days) — time to plan dinner."* Fallback: *"Check your fridge — time to plan."*
5. Send via Expo Push API to all device tokens for that user
6. Write `last_fired_at = now()` on fired reminders

Cadence logic:
- `daily`: fires every day
- `every_2_days`: fires if `last_fired_at` is null or ≥ 48h ago
- `weekly`: fires on days matching `weekly_day`

If computed fire time is past for today, start from tomorrow.

## Mobile Screens

**Onboarding (modal, shown once on first launch)**
1. API URL + login/register form. Token stored via `expo-secure-store`.
2. Meal time pickers (lunch default 12:00, dinner default 18:30). Saves to `/settings`.

**1. Camera / Add screen**
Capture receipt → resize to 1024px → POST to `/parse/receipt` → confirmation list (amber badges for low-confidence) → user confirms/edits → POST to `/items`.
Error: API failure → "couldn't parse" fallback with manual text entry.

**2. Fridge home screen**
GET `/items` → group by freshness bucket derived from `predicted_expiry`:
- Red "Use today": expires within 1 day
- Yellow "Use soon": expires 2–5 days
- Green "Still fresh": 6+ days

Tap row → inline action row: "Used it" (consumed), "Edit" (modal), "Remove" (discarded). Quick ✓ button always visible as shortcut for "Used it".

**3. Reminder chat screen** *(Phase 2)*
Text input → POST `/parse/reminder` → show parsed reminders with cadence pills → confirm → POST `/reminders`.
Cadence pill tap cycles through daily / every_2_days / weekly.

**4. Settings screen** *(Phase 2)*
Time pickers for lunch + dinner times → PATCH `/settings`.
Register Expo push token on load → POST `/device-tokens`.

## Project Structure

```
freshtrack/
  backend/
    app/
      main.py
      auth.py
      models.py         # SQLAlchemy models
      schemas.py        # Pydantic schemas
      database.py       # DB connection
      routers/
        auth.py
        items.py
        parse.py
        reminders.py
        settings.py
        device_tokens.py
      services/
        openai.py       # GPT-4o calls
        scheduler.py    # APScheduler + push logic
    alembic/            # migrations
    Dockerfile
    fly.toml
    requirements.txt
  mobile/
    app/
      (tabs)/
        index.tsx       # Fridge
        camera.tsx      # Add
        reminders.tsx   # Phase 2
        settings.tsx    # Phase 2
      _layout.tsx
      onboarding.tsx
    services/
      api.ts            # typed fetch wrapper
      auth.ts
      notifications.ts  # Phase 2
    components/
      FridgeItem.tsx
      ConfirmItemList.tsx
      ReminderRow.tsx
    constants/
      freshness.ts
    app.json
    tsconfig.json
```

## Error Handling

| Scenario | Handling |
|----------|----------|
| OpenAI API failure | Return 502, mobile shows "couldn't parse — add manually" |
| OpenAI 429 | Return 429, mobile shows toast "Rate limit hit — try again" |
| Malformed GPT-4o JSON | Log + return 422 with fallback message |
| Expired JWT | Return 401, mobile redirects to login |
| Push delivery failure | Log, skip — non-critical path |

## Success Criteria

- Receipt photo → ≥80% of items parsed within 30 seconds
- Fridge home shows correct freshness grouping
- "Used it" removes item in one tap
- Fruit reminder fires 2 hours after lunch with current fridge contents
- Zero manual text entry required for a full grocery run

## Known Limitations

- Notification delivery depends on APScheduler running reliably on Fly.io — use a paid instance or keep-alive pings if on free tier
- Receipt quality varies (thermal paper, lighting, crumples) — 80% accuracy is the target, not 100%
- No quantity merge on duplicates — duplicate warning shows, user adds separately
