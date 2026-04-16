# Neuroband Backend — Finalize & Stabilize

Fix processor bugs, add feature logging for ML dataset collection, add ML-ready scorer placeholder, and improve robustness — all without changing architecture or frontend.

## Proposed Changes

### Core Processor

#### [MODIFY] [processor.py](file:///c:/Users/HP/Desktop/Personal%20Projects/neuroband/backend/core/processor.py)

**Bug fix — double DC removal:**  
[process_window()](file:///c:/Users/HP/Desktop/Personal%20Projects/neuroband/backend/core/processor.py#77-95) calls [remove_dc()](file:///c:/Users/HP/Desktop/Personal%20Projects/neuroband/backend/core/processor.py#5-7) on line 82, then passes the *original* [window](file:///c:/Users/HP/Desktop/Personal%20Projects/neuroband/backend/core/processor.py#77-95) to [extract_features()](file:///c:/Users/HP/Desktop/Personal%20Projects/neuroband/backend/core/processor.py#35-75) on line 88, which calls [remove_dc()](file:///c:/Users/HP/Desktop/Personal%20Projects/neuroband/backend/core/processor.py#5-7) again internally. Fix: pass the already-cleaned signal to [extract_features()](file:///c:/Users/HP/Desktop/Personal%20Projects/neuroband/backend/core/processor.py#35-75), or remove the outer call. I'll make [extract_features](file:///c:/Users/HP/Desktop/Personal%20Projects/neuroband/backend/core/processor.py#35-75) accept a pre-cleaned signal and remove its internal [remove_dc()](file:///c:/Users/HP/Desktop/Personal%20Projects/neuroband/backend/core/processor.py#5-7).

**Richer artifact return:**  
Currently returns bare `None` on artifact. Change to return a minimal dict with `{"artifact": True, "artifact_reason": "..."}` so the pipeline can log artifacts too.

**Move scoring out:**  
Remove inline `features["focus_score"] = features["ratio_focus"]` — delegate to new `scorer.py`.

---

### ML-Ready Scorer

#### [NEW] [scorer.py](file:///c:/Users/HP/Desktop/Personal%20Projects/neuroband/backend/core/scorer.py)

Simple module with:
- `compute_focus_score(features: dict) -> float` — current heuristic (`ratio_focus`)
- Checks if a model file exists at `models/focus_model.pkl`; if so, loads and uses it
- Falls back to heuristic if no model found
- Model is loaded once at import time (no repeated I/O)

---

### Feature Logger

#### [NEW] [logger.py](file:///c:/Users/HP/Desktop/Personal%20Projects/neuroband/backend/core/logger.py)

- `FeatureLogger` class — opens a CSV in append mode
- Writes header only if file is new/empty
- `log(result: dict)` — appends one row with timestamp + all features + focus_score
- Default path: `logs/features.csv`
- Non-blocking: just a file write per window (~4 Hz), negligible overhead

---

### Pipeline Integration

#### [MODIFY] [pipeline.py](file:///c:/Users/HP/Desktop/Personal%20Projects/neuroband/backend/core/pipeline.py)

- Import and use `FeatureLogger` — log every non-artifact result
- Import and use `compute_focus_score` from scorer
- Handle artifact results from processor (now dicts, not `None`)
- Clean up trailing comments (lines 41-56)

---

### Robustness — Source

#### [MODIFY] [source.py](file:///c:/Users/HP/Desktop/Personal%20Projects/neuroband/backend/core/source.py)

- Wrap `SerialSource.stream()` in try/except for `serial.SerialException`
- On disconnect: log warning, yield nothing, break cleanly (no crash)

---

### Robustness — WebSocket

#### [MODIFY] [main.py](file:///c:/Users/HP/Desktop/Personal%20Projects/neuroband/backend/api/main.py)

- Wrap [_stream_sync](file:///c:/Users/HP/Desktop/Personal%20Projects/neuroband/backend/api/main.py#51-57) in try/except for generic exceptions
- Catch `WebSocketDisconnect` + general `Exception` in the endpoint
- Add `finally` cleanup

---

### Schemas Cleanup

#### [MODIFY] [schemas.py](file:///c:/Users/HP/Desktop/Personal%20Projects/neuroband/backend/api/schemas.py)

- Remove stray markdown/comments after line 11 (leftover from copy-paste)

---

## Files NOT Changed
- [core/buffer.py](file:///c:/Users/HP/Desktop/Personal%20Projects/neuroband/backend/core/buffer.py) — works correctly
- [config.py](file:///c:/Users/HP/Desktop/Personal%20Projects/neuroband/backend/config.py) — no changes needed
- Frontend — not touched per constraints

## Verification Plan

### Automated — CLI Replay Test
```bash
cd c:\Users\HP\Desktop\Personal Projects\neuroband\backend
python run_debug.py
```
- Should print structured output with no crashes
- Should create `logs/features.csv` with correct columns
- Should see `focus_score` and `focus_score_raw` values

### Manual — WebSocket Test
1. Start server: `cd backend && uvicorn api.main:app --reload`
2. Open [test/test_ws_page.html](file:///c:/Users/HP/Desktop/Personal%20Projects/neuroband/backend/test/test_ws_page.html) in browser
3. Confirm data streams without errors
