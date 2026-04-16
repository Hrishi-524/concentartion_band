import numpy as np
import matplotlib.pyplot as plt
import csv
import os

# === CONFIG ===
filename = "eeg_data_highfocus_beta.csv"   # change if needed
OUTPUT_DIR = "outputs"

# === CREATE OUTPUT DIR ===
os.makedirs(OUTPUT_DIR, exist_ok=True)

# === LOAD DATA ===
timestamps = []
values = []

with open(filename, 'r') as file:
    reader = csv.DictReader(file)
    for row in reader:
        timestamps.append(float(row["timestamp"]))
        values.append(int(row["value"]))

values = np.array(values)
timestamps = np.array(timestamps)

# === OPTIONAL: TAKE LAST 40% (REMOVE NOISY START) ===
portion = int(len(values) * 0.9)
values = values[-portion:]
timestamps = timestamps[-portion:]

# === REMOVE DC OFFSET (VERY IMPORTANT) ===
signal = values - np.mean(values)

# === SAMPLING RATE ESTIMATION ===
fs = len(signal) / (timestamps[-1] - timestamps[0])
print(f"Estimated Sampling Rate: {fs:.2f} Hz")

# === FFT ===
fft = np.fft.rfft(signal)
freqs = np.fft.rfftfreq(len(signal), 1/fs)

# === BAND POWER FUNCTION ===
def band_power(freqs, fft, low, high):
    idx = (freqs >= low) & (freqs <= high)
    return np.sum(np.abs(fft[idx])**2)

alpha = band_power(freqs, fft, 8, 13)
beta = band_power(freqs, fft, 13, 30)
theta = band_power(freqs, fft, 4, 8)

# === CONCENTRATION SCORE ===
score = beta / (alpha + theta + 1e-6)

print("\n--- Results ---")
print(f"Alpha Power: {alpha:.2f}")
print(f"Beta Power: {beta:.2f}")
print(f"Theta Power: {theta:.2f}")
print(f"Focus Score: {score:.2f}")

# === PLOT RAW SIGNAL ===
plt.figure(figsize=(12,4))
plt.plot(signal)
plt.title("Raw EEG Signal (DC Removed)")
plt.xlabel("Samples")
plt.ylabel("Amplitude")

raw_path = os.path.join(OUTPUT_DIR, "raw_signal_highfocus_beta.png")
plt.savefig(raw_path)
plt.close()

# === PLOT FREQUENCY SPECTRUM ===
plt.figure(figsize=(12,4))
plt.plot(freqs, np.abs(fft))
plt.title("Frequency Spectrum")
plt.xlabel("Frequency (Hz)")
plt.ylabel("Magnitude")
plt.xlim(0, 40)

fft_path = os.path.join(OUTPUT_DIR, "frequency_spectrum_highfocus_beta.png")
plt.savefig(fft_path)
plt.close()

print("\nGraphs saved:")
print(f"- {raw_path}")
print(f"- {fft_path}")