# FreshTrack Phase 1b — Real Camera Capture

**Date:** 2026-05-09
**Status:** Approved
**Scope:** Replace the fake camera zone in `camera.tsx` with a real `expo-camera` viewfinder. Mock parsing continues to drive the confirm flow. Captured photo URI is preserved in state for Phase 1c (GPT-4o wiring).

---

## Goal

Replace the static "Take a photo" placeholder with a working camera: tap the zone, take a real photo, confirm or retake, then proceed to the existing confirm flow. The photo is not yet sent to any analysis service — `parseReceipt('mock')` continues to run. The photo URI is available in state for Phase 1c.

---

## Architecture

```
capture ──tap zone──▶ viewfinder (live) ──shutter──▶ viewfinder (preview)
                                                            │
                                                    "Use Photo"
                                                            ▼
                                                    capture (thumbnail)
                                                            │
                                                  "Analyze Photo"
                                                            ▼
                                                    loading ──▶ confirm
```

`camera.tsx` is the only file that changes. The viewfinder and preview are rendered as full-screen absolute-positioned views inside the same component — no navigation push required.

---

## State Model

```typescript
type ScreenState = 'capture' | 'viewfinder' | 'loading' | 'confirm';
```

The viewfinder has two visual modes driven by a local variable, not a top-level state:

- `pendingUri === null` → live viewfinder (CameraView active)
- `pendingUri !== null` → preview (static Image, Retake / Use Photo buttons)

This keeps the camera context alive between taking a shot and accepting it, avoiding a teardown/rebuild cycle.

Additional state:
- `photoUri: string | null` — the accepted photo URI. Persists across the capture→loading→confirm cycle. Cleared when the user returns to capture after a successful confirm.
- `pendingUri: string | null` — temporary URI during viewfinder preview, local to the viewfinder rendering pass.
- `captureError: string | null` — inline error message shown on the capture screen for non-auth failures.

---

## Permissions

`useCameraPermissions()` hook (expo-camera) is called once at component mount.

| Permission state | Camera zone shows |
|---|---|
| Granted | Tap to open viewfinder |
| Not determined | Tap to request permission (triggers system dialog) |
| Denied | Lock icon + "Tap to allow camera access" — tapping calls `Linking.openSettings()` |

---

## UI

### Capture screen

- Camera zone is wrapped in `TouchableOpacity`. Tapping transitions to `viewfinder` state (or handles permission as above).
- **No photo taken yet:** existing dark zone with camera icon, "Take a photo" / "cart · receipt · shelf label" labels — visually unchanged.
- **Photo taken:** zone background becomes the thumbnail (`Image` with `resizeMode="cover"`). Small "Retake" pill button overlaid in the top-right corner.
- "Analyze Photo" button is **disabled** (opacity 0.6, `disabled` prop) until `photoUri` is non-null.
- `captureError` is displayed as a red text line below the analyze button when set.

### Viewfinder screen (full-screen absolute view)

**Live mode (`pendingUri === null`):**
- `CameraView` fills the screen edge-to-edge (no safe area).
- Top-left: `✕` TouchableOpacity — returns to capture state.
- Bottom center: circular shutter button (white, 72px diameter).
- Shutter tap: calls `cameraRef.current.takePictureAsync({ quality: 0.8 })` inside a try/catch. On success, sets `pendingUri`. On error, returns to capture state and sets `captureError`.

**Preview mode (`pendingUri !== null`):**
- Full-screen `Image` showing the captured photo.
- Bottom: two buttons side by side — "Retake" (outlined, clears `pendingUri` → live mode) and "Use Photo" (green fill, sets `photoUri = pendingUri`, transitions to capture state).

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| `takePictureAsync()` throws | Returns to capture state, sets `captureError = "Couldn't capture photo — try again"` |
| `createItems` fails with 401 | Redirect to onboarding (existing behaviour) |
| `createItems` fails with other error | Sets `captureError = "Couldn't save items — check your connection"`, stays on capture screen |
| Camera permission denied | Zone shows lock icon + Settings link |

---

## Data Flow

```
expo-camera → takePictureAsync({ quality: 0.8 })
           → pendingUri (viewfinder only)
           → photoUri (component state, survives viewfinder exit)
           → [Phase 1c: parseReceipt(photoUri) instead of parseReceipt('mock')]
```

`parseReceipt` currently ignores its argument. In Phase 1c the call becomes `parseReceipt(photoUri)` — no other changes in `handleAnalyze` needed.

---

## File Changes

**Install:** `npx expo install expo-camera` (adds to `package.json`, auto-configures `app.json` plugin)

**`mobile/app/(tabs)/camera.tsx`** — modified:
- New imports: `CameraView`, `useCameraPermissions` from `expo-camera`; `Image`, `Linking` from `react-native`; `useRef` added to React imports
- `ScreenState` expands: `'capture' | 'viewfinder' | 'loading' | 'confirm'`
- New state: `photoUri`, `pendingUri`, `captureError`, `cameraRef`
- Camera zone: permission-aware, tappable, shows thumbnail when `photoUri` set
- Viewfinder branch: live + preview modes as described above
- `handleAnalyze`: unchanged
- `handleConfirm`: catches non-401 errors, sets `captureError` instead of silently doing nothing

No new component files. No new services. No backend changes.

---

## Testing

**Manual (simulator):**

| Step | Expected |
|---|---|
| Open Add tab | Dark camera zone, Analyze button disabled |
| Tap camera zone | Permission dialog (first time). After grant: full-screen viewfinder |
| Tap shutter | Viewfinder freezes, photo preview shown |
| Tap Retake | Live viewfinder resumes |
| Tap Use Photo | Returns to capture, thumbnail visible, Analyze enabled |
| Tap Analyze Photo | Loading → confirm screen with mock items |
| Confirm | Items saved, navigate to Fridge tab |
| Deny camera permission | Zone shows lock icon, tapping opens Settings |

**Automated:** existing 15 Jest tests stay green — they do not import `camera.tsx`. No new unit tests added (camera hardware not mockable in Jest without heavy setup).

---

## Out of Scope

- GPT-4o receipt parsing (Phase 1c)
- Photo upload to backend storage
- Gallery/Camera Roll picker
- Front/rear camera toggle
- Flash control
- Video or multi-shot mode
