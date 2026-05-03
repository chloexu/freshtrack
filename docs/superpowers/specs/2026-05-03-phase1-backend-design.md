# FreshTrack Phase 1a — Backend Foundation & Items API

**Date:** 2026-05-03
**Status:** Approved
**Scope:** Sub-project 1 of Phase 1. Delivers a working FastAPI backend + connected mobile app. Receipt parsing (GPT-4o) is deferred to Phase 1b.

---

## Goal

Replace `mockApi.ts` with a real backend. After this sub-project: register, log in, view fridge, mark items consumed/removed, and add items from the confirm screen — all hitting a real database.

---

## Architecture

```
iPhone (Expo)  ←→  FastAPI (localhost:8000)  ←→  PostgreSQL (Docker)
```

Local-only for now. Mobile hits the laptop's local IP over WiFi (or `localhost` on simulator). Fly.io deployment comes later.

---

## Data Model

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id),
  name             TEXT NOT NULL,
  quantity         TEXT,
  purchase_date    DATE NOT NULL,
  predicted_expiry DATE NOT NULL,
  status           TEXT NOT NULL DEFAULT 'in_fridge',
  status_at        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now()
);
```

`status` values: `in_fridge` | `consumed` | `discarded`. `GET /items` returns only `in_fridge` items — same contract as `mockApi.ts`. The `consumed`/`discarded` distinction is kept for v2 waste tracking.

---

## API Endpoints

All endpoints except `/auth/*` require `Authorization: Bearer <jwt>`.

```
POST /auth/register    { email, password } → { token }
POST /auth/login       { email, password } → { token }

GET    /items          → [ Item, ... ]           (in_fridge only, current user)
POST   /items          { items: [ItemCreate] } → [ Item, ... ]
PATCH  /items/:id      { status?, name?, quantity?, predicted_expiry? } → Item
DELETE /items/:id      → 204
```

---

## Project Structure

```
freshtrack/
  backend/
    app/
      main.py           # FastAPI app, CORS, router registration
      database.py       # SQLAlchemy engine, SessionLocal, Base
      models.py         # User, Item SQLAlchemy ORM models
      schemas.py        # Pydantic request/response schemas
      auth.py           # JWT encode/decode, bcrypt hashing, get_current_user dep
      routers/
        auth.py         # POST /auth/register, POST /auth/login
        items.py        # GET/POST/PATCH/DELETE /items
    alembic/
      versions/         # migration files
      env.py
    alembic.ini
    docker-compose.yml  # postgres:16 on port 5432
    requirements.txt
    .env                # DATABASE_URL, JWT_SECRET (gitignored)
    .env.example        # checked in, shows required keys
  mobile/
    services/
      api.ts            # typed fetch wrapper, injects auth header
    constants/
      config.ts         # API_BASE_URL — one place to switch local ↔ prod
```

### `requirements.txt`

```
fastapi
uvicorn[standard]
sqlalchemy
psycopg2-binary
alembic
python-jose[cryptography]
passlib[bcrypt]
python-dotenv
pytest
httpx
```

---

## Local Dev Workflow

```bash
# 1. Start Postgres
cd backend && docker compose up -d

# 2. Set up Python env (first time only)
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 3. Configure env
cp .env.example .env
# edit .env: set DATABASE_URL and JWT_SECRET

# 4. Run migrations
alembic upgrade head

# 5. Start API
uvicorn app.main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs  (Swagger UI)
```

---

## Mobile Changes

**`mobile/constants/config.ts`** — single source for API base URL:
```typescript
export const API_BASE_URL = 'http://192.168.1.x:8000'; // local IP for device
// export const API_BASE_URL = 'http://localhost:8000'; // simulator
```

**`mobile/services/api.ts`** — typed fetch wrapper:
- Reads JWT from `expo-secure-store`
- Injects `Authorization: Bearer <token>` header
- Throws `ApiError` on non-2xx (with status code)
- Exports same function signatures as `mockApi.ts`: `getItems`, `updateItem`, `deleteItem`, `createItems`
- `parseReceipt` stays in `mockApi.ts` until Phase 1b

**Screen changes (minimal by design):**

| Screen | Change |
|--------|--------|
| `onboarding.tsx` | `handleAuth` calls `POST /auth/register` or `/auth/login`, stores JWT via `expo-secure-store`, navigates to tabs on success |
| `app/(tabs)/index.tsx` | Swap `mockApi` import → `api.ts`. All logic unchanged. |
| `app/(tabs)/camera.tsx` | `handleConfirm` calls `api.createItems`. `parseReceipt` still imported from `mockApi.ts` — two separate imports until Phase 1b. |

**401 handling:** `api.ts` catches 401 responses and calls `router.replace('/onboarding')` — user gets sent back to login if token expires.

---

## Auth Design

- Passwords hashed with bcrypt via `passlib`
- JWT signed with HS256, 30-day expiry
- Token stored on device via `expo-secure-store` (encrypted native keychain)
- `get_current_user` FastAPI dependency decodes token, returns User ORM object — used by all item endpoints

---

## Error Handling

| Scenario | Backend | Mobile |
|----------|---------|--------|
| Email already registered | 409 | Toast: "Account already exists" |
| Wrong password | 401 | Toast: "Incorrect email or password" |
| Expired JWT | 401 | Redirect to onboarding |
| Item not found | 404 | Ignored (item already removed locally) |
| Network unreachable | — | Toast: "Couldn't connect — check your WiFi" |

---

## Testing

**Backend:** pytest + httpx `TestClient`. One test file per router. Uses a separate `test_freshtrack` Postgres database (same Docker instance). Each test runs in a transaction that rolls back after — no persistent state between tests.

**Mobile:** existing Jest tests stay green — they test pure logic (`freshness.ts`, `mockApi.ts`) and don't touch `api.ts`.

---

## Out of Scope (Phase 1b)

- `POST /parse/receipt` (GPT-4o integration)
- Real camera capture in mobile (`expo-camera`)
- Fly.io deployment
- `settings` table and endpoints
