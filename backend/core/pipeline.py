from typing import Generator
from core.source import StreamSource
from core.buffer import SlidingWindowBuffer
from core.processor import process_window
from core.scorer import compute_focus_score
from core.logger import FeatureLogger


class FocusPipeline:
    def __init__(self, source: StreamSource, ema_alpha: float = 0.3, enable_logging: bool = True):
        self.source    = source
        self.buffer    = SlidingWindowBuffer()
        self.ema_alpha = ema_alpha
        self._ema      = None
        self._last     = None
        self._logger   = FeatureLogger() if enable_logging else None

    def run(self) -> Generator[dict, None, None]:
        try:
            for ts, value in self.source.stream():
                window = self.buffer.push(value)
                if window is None:
                    continue

                result = process_window(window)

                # Artifact detected — yield last good result with artifact flag
                if result.get("artifact"):
                    if self._last is not None:
                        yield {**self._last, "artifact": True, "timestamp": ts}
                    continue

                # Score using scorer (heuristic or ML)
                raw_score = compute_focus_score(result)

                # EMA smoothing
                if self._ema is None:
                    self._ema = raw_score
                self._ema = self.ema_alpha * raw_score + (1 - self.ema_alpha) * self._ema

                result["focus_score_raw"] = round(raw_score, 4)
                result["focus_score"]     = round(self._ema, 4)
                result["timestamp"]       = ts

                # Log only clean windows
                if self._logger:
                    self._logger.log(result)

                self._last = result
                yield result
        except Exception as e:
            print(f"[pipeline] Error: {e}")
        finally:
            if self._logger:
                self._logger.close()