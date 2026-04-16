import csv
import time
import serial
from abc import ABC, abstractmethod
from typing import Generator
from config import FS, SERIAL_PORT, BAUD_RATE


class StreamSource(ABC):
    """
    Every source must yield (timestamp, raw_value) tuples continuously.
    The pipeline doesn't care what's underneath.
    """

    @abstractmethod
    def stream(self) -> Generator[tuple[float, float], None, None]:
        ...


class CSVReplaySource(StreamSource):
    """
    Replays a recorded CSV at real-time speed (or faster for testing).
    Set realtime=False to replay as fast as possible (useful for backtesting).
    """

    def __init__(self, filepath: str, realtime: bool = True):
        self.filepath = filepath
        self.realtime = realtime

    def stream(self):
        with open(self.filepath, "r") as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        for i, row in enumerate(rows):
            ts = float(row["timestamp"])
            val = float(row["value"])

            if self.realtime and i > 0:
                prev_ts = float(rows[i - 1]["timestamp"])
                delay = ts - prev_ts
                time.sleep(max(delay, 0))

            yield ts, val


class SerialSource(StreamSource):
    """
    Reads live data from Arduino over serial.
    Arduino should print one integer per line.
    Handles disconnects gracefully — logs error and stops.
    """

    def __init__(self, port: str = SERIAL_PORT, baud: int = BAUD_RATE):
        self.port = port
        self.baud = baud

    def stream(self):
        try:
            ser = serial.Serial(self.port, self.baud, timeout=2)
        except serial.SerialException as e:
            print(f"[serial] Cannot open {self.port}: {e}")
            return

        try:
            ser.readline()  # flush first incomplete line
            while True:
                try:
                    line = ser.readline().decode("utf-8", errors="ignore").strip()
                    if line.isdigit():
                        yield time.time(), float(line)
                except serial.SerialException as e:
                    print(f"[serial] Disconnected: {e}")
                    break
                except OSError as e:
                    print(f"[serial] OS error: {e}")
                    break
        finally:
            try:
                ser.close()
            except Exception:
                pass

class ESP32Source(StreamSource):
    def stream(self):
        global latest_value

        while True:
            if latest_value is not None:
                yield time.time(), float(latest_value)

            time.sleep(1 / 250)