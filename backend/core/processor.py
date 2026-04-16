# import numpy as np
# from config import FS, BANDS, ARTIFACT_AMP_THRESHOLD, ARTIFACT_STD_MAX, ARTIFACT_STD_MIN
# import joblib
# model = joblib.load("ml/model.pkl")


# def remove_dc(signal: np.ndarray) -> np.ndarray:
#     return signal - np.mean(signal)


# def compute_band_power(freqs, fft_vals, low, high) -> float:
#     idx = (freqs >= low) & (freqs <= high)
#     return float(np.sum(np.abs(fft_vals[idx]) ** 2))


# def check_artifact(signal: np.ndarray) -> str | None:
#     """
#     Returns a reason string if artifact, None if clean.
#     Three checks — each catches a different failure mode:

#     1. Amplitude spike  → blink, jaw clench, electrode tap
#     2. Std too high     → muscle noise, cable movement
#     3. Std too low      → disconnected electrode, flat line
#     """
#     std = np.std(signal)
#     amp = np.max(np.abs(signal))

#     if amp > ARTIFACT_AMP_THRESHOLD:
#         return "amplitude_spike"
#     if std > ARTIFACT_STD_MAX:
#         return "high_noise"
#     if std < ARTIFACT_STD_MIN:
#         return "flat_signal"
#     return None


# def extract_features(clean_signal: np.ndarray) -> dict:
#     """
#     Pure feature extraction — takes an ALREADY DC-removed signal.
#     Returns normalized band powers + derived ratios + signal stats.
#     """
#     windowed = clean_signal * np.hanning(len(clean_signal))

#     fft_vals = np.fft.rfft(windowed)
#     freqs    = np.fft.rfftfreq(len(windowed), 1 / FS)

#     raw_powers = {
#         band: compute_band_power(freqs, fft_vals, low, high)
#         for band, (low, high) in BANDS.items()
#     }

#     total = sum(raw_powers.values()) + 1e-6
#     norm  = {band: p / total for band, p in raw_powers.items()}

#     return {
#         # Raw powers (for visualization — charts need absolute values)
#         "theta_raw": round(raw_powers["theta"], 2),
#         "alpha_raw": round(raw_powers["alpha"], 2),
#         "beta_raw":  round(raw_powers["beta"],  2),

#         # Normalized (0–1) — use these for ML
#         "theta": round(norm["theta"], 6),
#         "alpha": round(norm["alpha"], 6),
#         "beta":  round(norm["beta"],  6),

#         # Derived ratios — engineered features
#         "ratio_focus":    round(norm["beta"] / (norm["alpha"] + norm["theta"] + 1e-6), 3),
#         "ratio_engage":   round(norm["alpha"] / (norm["theta"] + 1e-6), 4),
#         "variance":       round(float(np.var(clean_signal)), 4),
#         "signal_std":     round(float(np.std(clean_signal)), 4),
#     }


# def process_window(window: np.ndarray) -> dict:
#     """
#     Full processing for one window.
#     Returns feature dict with artifact=False, or artifact dict with artifact=True.
#     Always returns a dict — never None.
#     """
#     signal = remove_dc(window)

#     artifact_reason = check_artifact(signal)
#     if artifact_reason:
#         return {"artifact": True, "artifact_reason": artifact_reason}

#     # Pass already-cleaned signal — no double DC removal
#     features = extract_features(signal)
#     features["artifact"] = False

#     features_vector = [
#         features["theta"],
#         features["alpha"],
#         features["beta"],
#         features["ratio_focus"],
#         features["ratio_engage"],
#         features["variance"]
#     ]

#     pred = model.predict([features_vector])[0]
#     prob = model.predict_proba([features_vector])[0][1]
#     features["ml_state"] = "focused" if pred == 1 else "distracted"
#     features["ml_confidence"] = round(float(prob), 3)
#     return features

import numpy as np
from scipy.signal import butter, filtfilt
from config import FS, BANDS, ARTIFACT_AMP_THRESHOLD, ARTIFACT_STD_MAX, ARTIFACT_STD_MIN
import joblib

model = joblib.load("ml/model.pkl")

EPS = 1e-6


# ----------------------------
# Basic preprocessing
# ----------------------------
def remove_dc(signal: np.ndarray) -> np.ndarray:
    return signal - np.mean(signal)


def bandpass_filter(signal, fs=FS, low=1, high=40, order=4):
    nyq = 0.5 * fs
    b, a = butter(order, [low / nyq, high / nyq], btype='band')
    return filtfilt(b, a, signal)


# ----------------------------
# FFT helpers
# ----------------------------
def compute_band_power(freqs, fft_vals, low, high) -> float:
    idx = (freqs >= low) & (freqs <= high)
    return float(np.sum(np.abs(fft_vals[idx]) ** 2))


# ----------------------------
# Artifact detection (IMPROVED)
# ----------------------------
def check_artifact(signal: np.ndarray) -> str | None:
    std = np.std(signal)
    amp = np.max(np.abs(signal))

    if amp > ARTIFACT_AMP_THRESHOLD:
        return "amplitude_spike"

    if std > ARTIFACT_STD_MAX:
        return "high_noise"

    if std < ARTIFACT_STD_MIN:
        return "flat_signal"

    return None


# ----------------------------
# Feature extraction (FIXED)
# ----------------------------
def extract_features(clean_signal: np.ndarray) -> dict:
    windowed = clean_signal * np.hanning(len(clean_signal))

    fft_vals = np.fft.rfft(windowed)
    freqs = np.fft.rfftfreq(len(windowed), 1 / FS)

    raw_powers = {
        band: compute_band_power(freqs, fft_vals, low, high)
        for band, (low, high) in BANDS.items()
    }

    total = sum(raw_powers.values()) + EPS

    # 🚨 NEW: reject very weak signal
    if total < 1e-3:
        return {"artifact": True, "artifact_reason": "low_power_signal"}

    # 🚨 NEW: detect noise masquerading as beta
    if raw_powers["beta"] > 0.9 * total:
        return {"artifact": True, "artifact_reason": "beta_dominance_noise"}

    norm = {band: p / total for band, p in raw_powers.items()}

    # 🚨 FIXED: stable ratios
    ratio_focus = np.clip(
        norm["beta"] / (norm["alpha"] + norm["theta"] + EPS),
        0, 5
    )

    ratio_engage = np.clip(
        norm["alpha"] / (norm["theta"] + EPS),
        0, 5
    )

    return {
        # Raw (for charts)
        "theta_raw": round(raw_powers["theta"], 2),
        "alpha_raw": round(raw_powers["alpha"], 2),
        "beta_raw": round(raw_powers["beta"], 2),

        # Normalized (ML)
        "theta": round(norm["theta"], 6),
        "alpha": round(norm["alpha"], 6),
        "beta": round(norm["beta"], 6),

        # Features
        "ratio_focus": round(float(ratio_focus), 3),
        "ratio_engage": round(float(ratio_engage), 4),
        "variance": round(float(np.var(clean_signal)), 4),
        "signal_std": round(float(np.std(clean_signal)), 4),
    }


# ----------------------------
# Main processing
# ----------------------------
def process_window(window: np.ndarray) -> dict:
    signal = remove_dc(window)

    # 🚨 CRITICAL FIX
    signal = bandpass_filter(signal)

    artifact_reason = check_artifact(signal)
    if artifact_reason:
        return {"artifact": True, "artifact_reason": artifact_reason}

    features = extract_features(signal)

    # If spectral artifact triggered inside extract_features
    if features.get("artifact"):
        return features

    features["artifact"] = False

    features_vector = [
        features["theta"],
        features["alpha"],
        features["beta"],
        features["ratio_focus"],
        features["ratio_engage"],
        features["variance"]
    ]

    pred = model.predict([features_vector])[0]
    prob = model.predict_proba([features_vector])[0][1]

    features["ml_state"] = "focused" if pred == 1 else "distracted"
    features["ml_confidence"] = round(float(prob), 3)

    return features