# FreshTrack Phase 1c — GPT-4o Receipt Parsing

**Date:** 2026-05-17
**Status:** Approved
**Scope:** Wire real camera photo to GPT-4o vision for receipt parsing. Replaces the mock `parseReceipt` call in `camera.tsx` with a real backend endpoint.

---

## Goal

After this phase: user takes a receipt photo → app calls `/parse/receipt` → GPT-4o extracts items with names, quantities, and estimated expiry days → user confirms → items saved to fridge.

---

## Architecture

```
camera.tsx
  → expo-image-manipulator (resize to 1024px, export base64)
  → POST /parse/receipt { image_base64 }
  → FastAPI parse router
  → OpenAI GPT-4o vision
  → { items, parse_notes }
  → ConfirmItemList (unchanged)
```

---

## Backend

### New file: `backend/app/routers/parse.py`

Single endpoint:

```
POST /parse/receipt
  Auth: required (Bearer JWT)
  Body: { image_base64: str }
  Returns: { items: [...], parse_notes: str | null }
```

**Flow:**
1. Receive `image_base64` — return 400 immediately if empty string
2. Build OpenAI vision message: image as `data:image/jpeg;base64,<image_base64>`
3. Call `gpt-4o` with `response_format={"type": "json_object"}` and the system prompt below
4. Parse and validate JSON response with Pydantic
5. Return response

**System prompt:**
```
You are a grocery receipt parser. Given a receipt image, extract all food/grocery items.

For each item return:
- name: clean item name (e.g. "Strawberries", "Chicken Breast")
- quantity: amount and unit if visible (e.g. "1 pint", "2 lbs"), null if not shown
- predicted_expiry_days: estimated days until expiry when refrigerated, based on typical shelf life
- confidence: "high" if item name is clearly readable, "medium" if partially readable, "low" if inferred

Return JSON only — no prose:
{
  "items": [...],
  "parse_notes": "optional note about parse quality, or null"
}
```

**Error handling:**

| Scenario | Response |
|----------|----------|
| OpenAI API failure | 502 `"Couldn't parse receipt — try again"` |
| OpenAI 429 | 429 `"Rate limit — try again shortly"` |
| Malformed GPT JSON | 422 `"Unexpected response from AI"` |

### New schemas in `backend/app/schemas.py`

```python
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

### `backend/app/main.py`

Register the new router:
```python
from app.routers import auth, items, parse
app.include_router(parse.router, prefix="/parse", tags=["parse"])
```

### Dependencies

Add to `requirements.txt`:
```
openai>=1.30.0
```
Verify the latest stable version before installing (`pip index versions openai`).

Add to `.env.example`:
```
OPENAI_API_KEY=your-key-here
```

### Tests: `backend/tests/test_parse.py`

- Happy path: mock `openai.chat.completions.create` → returns valid JSON → assert 200 + parsed items
- OpenAI failure: mock raises `openai.APIError` → assert 502
- Malformed JSON: mock returns non-JSON string → assert 422

---

## Mobile

### Install

```bash
cd mobile && npx expo install expo-image-manipulator
```

### `mobile/services/api.ts`

Move types here (from `mockApi.ts`) and add `parseReceipt`:

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

export async function parseReceipt(photoUri: string): Promise<ParseReceiptResponse> {
  // 1. Get dimensions to constrain the long edge (see Image Sizing section)
  const info = await ImageManipulator.manipulateAsync(photoUri, [], {});
  const isPortrait = info.height > info.width;
  const resize = isPortrait ? { height: 1024 } : { width: 1024 };

  // 2. Resize and export as base64 JPEG
  const manipulated = await ImageManipulator.manipulateAsync(
    photoUri,
    [{ resize }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );
  const image_base64 = manipulated.base64!;

  // 3. POST to backend
  return request<ParseReceiptResponse>('/parse/receipt', {
    method: 'POST',
    body: JSON.stringify({ image_base64 }),
  });
}

### `mobile/app/(tabs)/camera.tsx`

- Remove: `import { parseReceipt, ParsedItem } from '../../services/mockApi';`
- Extend existing api.ts import (line 8) to include `parseReceipt` and `ParsedItem` — `ApiError` is already imported there, do not duplicate it
- Change: `parseReceipt('mock')` → `parseReceipt(photoUri!)`

### `mobile/services/mockApi.ts`

- Remove `ParsedItem` and `ParseReceiptResponse` type definitions (now in `api.ts`)
- Import them from `api.ts` for use in the mock `parseReceipt` stub (tests still use mock)
- Keep mock `parseReceipt` function for test isolation

---

## Error Handling (Mobile)

`handleAnalyze` in `camera.tsx` already has try/catch — no changes needed there. Existing error message "Couldn't analyze photo — try again" covers all parse failures. 429 from backend surfaces the same way; a more specific message is a future polish item.

---

## Testing

**Backend:** pytest with mocked OpenAI client. No real API calls in tests.

**Mobile:** existing Jest tests unchanged — they import from `mockApi.ts` which keeps its own `parseReceipt` stub. No new mobile tests needed for this phase.

---

## Out of Scope

- Fly.io deployment
- 429-specific error message on mobile
- Amber highlighting of low-confidence items on confirm screen (already implemented in `ConfirmItemList`)
- Settings / reminders (Phase 2)
