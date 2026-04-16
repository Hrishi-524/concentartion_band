from collections import deque
import numpy as np
from config import WINDOW_SIZE, STEP_SIZE


class SlidingWindowBuffer:
    """
    Accumulates incoming samples.
    Every STEP_SIZE new samples, yields a full window of WINDOW_SIZE samples.
    This gives you overlapping windows — critical for smooth real-time scoring.
    """

    def __init__(self, window_size: int = WINDOW_SIZE, step_size: int = STEP_SIZE):
        self.window_size = window_size
        self.step_size = step_size
        self._buf = deque(maxlen=window_size)
        self._step_counter = 0

    def push(self, value: float):
        """
        Push one sample. Returns a numpy window array if ready, else None.
        """
        self._buf.append(value)
        self._step_counter += 1

        if len(self._buf) == self.window_size and self._step_counter >= self.step_size:
            self._step_counter = 0
            return np.array(self._buf)

        return None