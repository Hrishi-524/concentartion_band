import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib

# Load your CSVs
df_focus = pd.read_csv("recorder/eeg_data_highfocus_beta.csv")
df_relax = pd.read_csv("recorder/eeg_data_relaxed_lowfocus.csv")

# Label them
df_focus["label"] = 1   # focused
df_relax["label"] = 0   # distracted

df = pd.concat([df_focus, df_relax])

# VERY IMPORTANT: you don’t train on raw signal
# you train on features → reuse your processor logic

WINDOW = 500
STEP = 125

X, y = [], []

def extract_features_simple(values):
    import numpy as np

    signal = np.array(values)
    signal = signal - np.mean(signal)
    signal = signal * np.hanning(len(signal))

    fft = np.fft.rfft(signal)
    freqs = np.fft.rfftfreq(len(signal), 1/250)

    def band(low, high):
        idx = (freqs >= low) & (freqs <= high)
        return np.sum(np.abs(fft[idx])**2)

    theta = band(4, 8)
    alpha = band(8, 13)
    beta  = band(13, 30)

    total = theta + alpha + beta + 1e-6

    variance = np.var(signal)

    return [
        theta/total,
        alpha/total,
        beta/total,
        beta/(alpha+theta+1e-6),
        alpha/(theta+1e-6),
        variance
    ]

def process_dataset(df, label):
    for i in range(0, len(df)-WINDOW, STEP):
        window = df.iloc[i:i+WINDOW]["value"].values
        X.append(extract_features_simple(window))
        y.append(label)

process_dataset(df_focus, 1)
process_dataset(df_relax, 0)

model = RandomForestClassifier(n_estimators=50)
model.fit(X, y)

joblib.dump(model, "ml/model.pkl")
print("Model trained & saved")