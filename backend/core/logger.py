"""
Feature logger — appends extracted features to CSV for ML dataset collection.
Only logs clean (non-artifact) windows.
"""

import os
import csv

# Fixed column order — critical for ML consistency
FEATURE_COLUMNS = [
    "timestamp",
    "theta",
    "alpha",
    "beta",
    "ratio_focus",
    "ratio_engage",
    "variance",
    "signal_std",
    "focus_score",
]


class FeatureLogger:
    def __init__(self, filepath: str = None):
        if filepath is None:
            base = os.path.join(os.path.dirname(__file__), "..", "logs")
            os.makedirs(base, exist_ok=True)
            filepath = os.path.join(base, "features.csv")

        self.filepath = filepath
        self._file = None
        self._writer = None

    def _ensure_open(self):
        if self._file is not None:
            return

        file_exists = os.path.isfile(self.filepath) and os.path.getsize(self.filepath) > 0
        self._file = open(self.filepath, "a", newline="")
        self._writer = csv.writer(self._file)

        if not file_exists:
            self._writer.writerow(FEATURE_COLUMNS)
            self._file.flush()

    def log(self, result: dict):
        """Append one row. Only call for non-artifact results."""
        try:
            self._ensure_open()
            row = [result.get(col, "") for col in FEATURE_COLUMNS]
            self._writer.writerow(row)
            self._file.flush()
        except Exception as e:
            print(f"[logger] Write failed: {e}")

    def close(self):
        if self._file:
            self._file.close()
            self._file = None
            self._writer = None
