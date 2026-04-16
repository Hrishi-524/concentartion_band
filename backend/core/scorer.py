"""
Focus scorer — heuristic now, ML-ready for later.

Usage:
    from core.scorer import compute_focus_score
    score = compute_focus_score(features)

To enable ML scoring:
    1. Train a model that takes [theta, alpha, beta, ratio_focus, variance] as input
    2. Save it as  backend/models/focus_model.pkl  (joblib)
    3. Restart server — model auto-loads and replaces heuristic
"""

import os

_model = None
_model_checked = False

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "focus_model.pkl")

# Feature columns the model expects (must match training order)
MODEL_FEATURES = ["theta", "alpha", "beta", "ratio_focus", "variance"]


def _load_model():
    """Lazy-load model on first call. Safe if file doesn't exist."""
    global _model, _model_checked
    _model_checked = True

    if not os.path.isfile(MODEL_PATH):
        return

    try:
        import joblib
        _model = joblib.load(MODEL_PATH)
        print(f"[scorer] Loaded ML model from {MODEL_PATH}")
    except Exception as e:
        print(f"[scorer] Failed to load model: {e} — falling back to heuristic")
        _model = None


def compute_focus_score(features: dict) -> float:
    global _model_checked

    if not _model_checked:
        _load_model()

    # ---------------- ML MODE ----------------
    if _model is not None:
        try:
            x = [[features[k] for k in MODEL_FEATURES]]
            return float(_model.predict(x)[0])
        except Exception:
            pass

    # ---------------- HEURISTIC MODE (FIXED) ----------------

    beta = features["beta"]
    alpha = features["alpha"]
    theta = features["theta"]

    # 🚨 Balanced heuristic (not just beta dominance)
    score = beta / (alpha + theta + 1e-6)

    # 🚨 Clamp to avoid explosion
    score = max(0.0, min(score, 3.0))

    # Normalize to 0–1
    score = score / 3.0

    return float(score)