# Phase 1c — GPT-4o Receipt Parsing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mock `parseReceipt` call in `camera.tsx` with a real `POST /parse/receipt` backend endpoint that uses GPT-4o vision to extract grocery items from a receipt photo.

**Architecture:** Mobile resizes the photo to max 1024px (long edge) using `expo-image-manipulator`, encodes it as base64 JPEG, and POSTs to the backend. FastAPI calls GPT-4o with `response_format=json_object`, validates the response with Pydantic, and returns structured items. `camera.tsx` swaps its mock import for the real `api.ts` function — no other UI changes.

**Tech Stack:** Python `openai>=1.30.0`, FastAPI, Pydantic, pytest + unittest.mock; TypeScript `expo-image-manipulator`, Expo.

---

## File Map

**Backend — create:**
- `backend/app/routers/parse.py` — `POST /parse/receipt` endpoint
- `backend/tests/test_parse.py` — pytest tests (OpenAI mocked)

**Backend — modify:**
- `backend/app/schemas.py` — add `ParseReceiptRequest`, `ParsedItem`, `ParseReceiptResponse`
- `backend/app/main.py` — register parse router
- `backend/requirements.txt` — add `openai`
- `backend/.env.example` — add `OPENAI_API_KEY`

**Mobile — modify:**
- `mobile/services/api.ts` — add `ParsedItem`, `ParseReceiptResponse` types + `parseReceipt` function
- `mobile/services/mockApi.ts` — remove type definitions, import from `api.ts`
- `mobile/app/(tabs)/camera.tsx` — extend api.ts import, swap `parseReceipt` call

---

## Task 1: Install openai and update env files

**Files:**
- Modify: `backend/requirements.txt`
- Modify: `backend/.env.example`

- [ ] **Step 1: Find the latest openai version**

```bash
cd backend && source venv/bin/activate && pip index versions openai 2>/dev/null | head -1
```

- [ ] **Step 2: Install openai**

```bash
pip install openai
```

- [ ] **Step 3: Pin the installed version in requirements.txt**

```bash
pip freeze | grep openai
```

Open `backend/requirements.txt` and append the pinned version (e.g. `openai==1.82.0`) on a new line after the existing entries.

- [ ] **Step 4: Add OPENAI_API_KEY to .env.example**

Add this line to `backend/.env.example`:

```
OPENAI_API_KEY=your-key-here
```

- [ ] **Step 5: Verify your real `.env` already has `OPENAI_API_KEY` set**

```bash
grep OPENAI_API_KEY backend/.env
```

Expected: a line with your real key (not the placeholder).

- [ ] **Step 6: Commit**

```bash
git add backend/requirements.txt backend/.env.example
git commit -m "chore: add openai dependency and env key"
```

---

## Task 2: Add parse schemas to schemas.py

**Files:**
- Modify: `backend/app/schemas.py`

- [ ] **Step 1: Append parse schemas at the bottom of `backend/app/schemas.py`**

```python
# --- Receipt Parsing ---

class ParseReceiptRequest(BaseModel):
    image_base64: str


class ParsedItem(BaseModel):
    name: str
    quantity: Optional[str] = None
    predicted_expiry_days: int
    confidence: Literal["high", "medium", "low"]


class ParseReceiptResponse(BaseModel):
    items: list[ParsedItem]
    parse_notes: Optional[str] = None
```

`Literal` is already imported at the top of `schemas.py` (used by `ItemUpdate`). `Optional` is also already imported.

- [ ] **Step 2: Commit**

```bash
git add backend/app/schemas.py
git commit -m "feat: add parse receipt schemas"
```

---

## Task 3: Write failing tests for the parse endpoint

**Files:**
- Create: `backend/tests/test_parse.py`

- [ ] **Step 1: Create `backend/tests/test_parse.py`**

```python
import json
from unittest.mock import MagicMock, patch

from openai import APIError, RateLimitError


def _register(client, email="parser@test.com", password="pass"):
    res = client.post("/auth/register", json={"email": email, "password": password})
    return res.json()["token"]


def _headers(token):
    return {"Authorization": f"Bearer {token}"}


def _mock_openai_response(content: str) -> MagicMock:
    mock_response = MagicMock()
    mock_response.choices[0].message.content = content
    return mock_response


VALID_GPT_RESPONSE = json.dumps({
    "items": [
        {
            "name": "Strawberries",
            "quantity": "1 pint",
            "predicted_expiry_days": 5,
            "confidence": "high",
        },
        {
            "name": "Whole Milk",
            "quantity": "1 gallon",
            "predicted_expiry_days": 14,
            "confidence": "high",
        },
    ],
    "parse_notes": None,
})


def test_parse_receipt_happy_path(client):
    token = _register(client)
    mock_resp = _mock_openai_response(VALID_GPT_RESPONSE)

    with patch("app.routers.parse.client.chat.completions.create", return_value=mock_resp):
        res = client.post(
            "/parse/receipt",
            json={"image_base64": "ZmFrZWltYWdl"},
            headers=_headers(token),
        )

    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 2
    assert data["items"][0]["name"] == "Strawberries"
    assert data["items"][0]["predicted_expiry_days"] == 5
    assert data["items"][0]["confidence"] == "high"
    assert data["parse_notes"] is None


def test_parse_receipt_empty_base64_returns_400(client):
    token = _register(client)
    res = client.post(
        "/parse/receipt",
        json={"image_base64": ""},
        headers=_headers(token),
    )
    assert res.status_code == 400


def test_parse_receipt_openai_failure_returns_502(client):
    token = _register(client)
    api_error = APIError(
        message="upstream error",
        request=MagicMock(),
        body={},
    )
    with patch("app.routers.parse.client.chat.completions.create", side_effect=api_error):
        res = client.post(
            "/parse/receipt",
            json={"image_base64": "ZmFrZWltYWdl"},
            headers=_headers(token),
        )
    assert res.status_code == 502
    assert "parse" in res.json()["detail"].lower()


def test_parse_receipt_rate_limit_returns_429(client):
    token = _register(client)
    with patch(
        "app.routers.parse.client.chat.completions.create",
        side_effect=RateLimitError(
            message="rate limit",
            response=MagicMock(),
            body={},
        ),
    ):
        res = client.post(
            "/parse/receipt",
            json={"image_base64": "ZmFrZWltYWdl"},
            headers=_headers(token),
        )
    assert res.status_code == 429


def test_parse_receipt_malformed_json_returns_422(client):
    token = _register(client)
    mock_resp = _mock_openai_response("Here are your items: definitely not JSON")

    with patch("app.routers.parse.client.chat.completions.create", return_value=mock_resp):
        res = client.post(
            "/parse/receipt",
            json={"image_base64": "ZmFrZWltYWdl"},
            headers=_headers(token),
        )
    assert res.status_code == 422


def test_parse_receipt_requires_auth(client):
    res = client.post("/parse/receipt", json={"image_base64": "ZmFrZWltYWdl"})
    assert res.status_code == 401
```

- [ ] **Step 2: Run tests — verify they all fail with "router not found" or 404**

```bash
cd backend && source venv/bin/activate && pytest tests/test_parse.py -v
```

Expected: all tests fail (endpoint doesn't exist yet).

---

## Task 4: Implement the parse router

**Files:**
- Create: `backend/app/routers/parse.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create `backend/app/routers/parse.py`**

```python
import json

from fastapi import APIRouter, Depends, HTTPException
from openai import APIError, OpenAI, RateLimitError

from app.auth import get_current_user
from app.models import User
from app.schemas import ParsedItem, ParseReceiptRequest, ParseReceiptResponse

router = APIRouter()
client = OpenAI()  # reads OPENAI_API_KEY from environment

SYSTEM_PROMPT = """You are a grocery receipt parser. Given a receipt image, extract all food and grocery items.

For each item return:
- name: clean item name (e.g. "Strawberries", "Chicken Breast")
- quantity: amount and unit if visible (e.g. "1 pint", "2 lbs"), null if not shown
- predicted_expiry_days: estimated days until expiry when refrigerated, based on typical shelf life
- confidence: "high" if item name is clearly readable, "medium" if partially readable, "low" if inferred

Return JSON only — no prose:
{
  "items": [...],
  "parse_notes": "optional note about parse quality, or null"
}"""


@router.post("/receipt", response_model=ParseReceiptResponse)
def parse_receipt(
    body: ParseReceiptRequest,
    current_user: User = Depends(get_current_user),
):
    if not body.image_base64:
        raise HTTPException(status_code=400, detail="image_base64 is required")

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{body.image_base64}"
                            },
                        }
                    ],
                },
            ],
        )
        raw = response.choices[0].message.content
        data = json.loads(raw)
        return ParseReceiptResponse(**data)
    except RateLimitError:
        raise HTTPException(status_code=429, detail="Rate limit — try again shortly")
    except APIError:
        raise HTTPException(
            status_code=502, detail="Couldn't parse receipt — try again"
        )
    except (json.JSONDecodeError, ValueError, TypeError):
        raise HTTPException(status_code=422, detail="Unexpected response from AI")
```

- [ ] **Step 2: Register the router in `backend/app/main.py`**

Change the imports line from:
```python
from app.routers import auth, items
```
to:
```python
from app.routers import auth, items, parse
```

And add after the items router line:
```python
app.include_router(parse.router, prefix="/parse", tags=["parse"])
```

- [ ] **Step 3: Run all tests — all should pass**

```bash
cd backend && source venv/bin/activate && pytest -v
```

Expected: all 17 existing tests + 6 new parse tests = 23 tests passing.

- [ ] **Step 4: Commit**

```bash
git add backend/app/routers/parse.py backend/app/main.py backend/tests/test_parse.py
git commit -m "feat: POST /parse/receipt endpoint with GPT-4o vision"
```

---

## Task 5: Mobile — install expo-image-manipulator

**Files:**
- Modify: `mobile/package.json` (auto-updated by expo install)

- [ ] **Step 1: Install**

```bash
cd mobile && npx expo install expo-image-manipulator
```

- [ ] **Step 2: Verify it's in package.json**

```bash
grep image-manipulator mobile/package.json
```

Expected: a line like `"expo-image-manipulator": "~13.x.x"`.

- [ ] **Step 3: Commit**

```bash
git add mobile/package.json mobile/package-lock.json
git commit -m "chore: install expo-image-manipulator"
```

---

## Task 6: Mobile — add types and parseReceipt to api.ts

**Files:**
- Modify: `mobile/services/api.ts`

- [ ] **Step 1: Add import for ImageManipulator at the top of `mobile/services/api.ts`**

After the existing imports, add:
```typescript
import * as ImageManipulator from 'expo-image-manipulator';
```

- [ ] **Step 2: Append types and parseReceipt function at the bottom of `mobile/services/api.ts`**

```typescript
// --- Receipt Parsing ---

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

export async function parseReceipt(photoUri: string): Promise<ParseReceiptResponse> {
  // Constrain the long edge to 1024px to minimise upload size and token cost
  const info = await ImageManipulator.manipulateAsync(photoUri, [], {});
  const isPortrait = info.height > info.width;
  const resize = isPortrait ? { height: 1024 } : { width: 1024 };

  const manipulated = await ImageManipulator.manipulateAsync(
    photoUri,
    [{ resize }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );
  const image_base64 = manipulated.base64!;

  return request<ParseReceiptResponse>('/parse/receipt', {
    method: 'POST',
    body: JSON.stringify({ image_base64 }),
  });
}
```

- [ ] **Step 3: Run mobile tests to verify they still pass**

```bash
cd mobile && npx jest
```

Expected: 15 tests passing (no changes to tested code yet).

- [ ] **Step 4: Commit**

```bash
git add mobile/services/api.ts
git commit -m "feat: add parseReceipt to api.ts with image resize"
```

---

## Task 7: Mobile — update mockApi.ts to import types from api.ts

**Files:**
- Modify: `mobile/services/mockApi.ts`

- [ ] **Step 1: Replace the type definitions in `mobile/services/mockApi.ts`**

Remove these lines from the top of `mockApi.ts` (the type definitions):
```typescript
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
```

And replace with an import from `api.ts`:
```typescript
export type { ParsedItem, ParseReceiptResponse } from './api';
```

This re-exports the types so any code importing them from `mockApi` (e.g. tests) continues to work without changes.

- [ ] **Step 2: Run mobile tests to verify they still pass**

```bash
cd mobile && npx jest
```

Expected: 15 tests passing.

- [ ] **Step 3: Commit**

```bash
git add mobile/services/mockApi.ts
git commit -m "refactor: move ParsedItem and ParseReceiptResponse types to api.ts"
```

---

## Task 8: Mobile — wire camera.tsx to real parseReceipt

**Files:**
- Modify: `mobile/app/(tabs)/camera.tsx`

- [ ] **Step 1: Update the import in `mobile/app/(tabs)/camera.tsx`**

Remove this line (line 7):
```typescript
import { parseReceipt, ParsedItem } from '../../services/mockApi';
```

And extend the existing `api.ts` import (currently line 8) to include `parseReceipt` and `ParsedItem`:
```typescript
import { createItems, parseReceipt, ParsedItem, ApiError } from '../../services/api';
```

- [ ] **Step 2: Swap the mock call for the real one**

Find `handleAnalyze` (around line 65). Change:
```typescript
const result = await parseReceipt('mock');
```
to:
```typescript
const result = await parseReceipt(photoUri!);
```

- [ ] **Step 3: Run mobile tests to verify they still pass**

```bash
cd mobile && npx jest
```

Expected: 15 tests passing. (`camera.tsx` is not directly tested — tests rely on mockApi which is untouched.)

- [ ] **Step 4: Commit**

```bash
git add mobile/app/(tabs)/camera.tsx
git commit -m "feat: wire camera to real GPT-4o receipt parsing"
```

---

## Task 9: Manual smoke test

- [ ] **Step 1: Start the backend**

```bash
cd backend && source venv/bin/activate && uvicorn app.main:app --reload
```

- [ ] **Step 2: Start the mobile app**

```bash
cd mobile && npx expo start
# press i for iOS simulator
```

- [ ] **Step 3: Test the flow end-to-end**

1. Open the app → Camera tab
2. Tap the camera zone → take a photo of a receipt (or any paper with text)
3. Tap "Use Photo"
4. Tap "Analyze Photo"
5. Verify the confirm screen shows real items parsed from the receipt
6. Confirm → verify items appear in the Fridge tab

- [ ] **Step 4: Test error path**

1. Stop the backend (`ctrl+c`)
2. Tap "Analyze Photo" again
3. Verify the error message "Couldn't analyze photo — try again" appears and the app does not hang
