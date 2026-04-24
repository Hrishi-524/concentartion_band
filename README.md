# NeuroBand: AI-Powered Wearable for Real-Time Brain Activity Monitoring

> **Abstract** : NeuroBand is an AI-powered wearable headband designed to monitor and interpret human brain activity using electroencephalogram (EEG) signals. The system aims to provide a non-invasive and portable solution for real-time brain signal acquisition and analysis. By integrating EEG sensors with artificial intelligence techniques, NeuroBand captures raw brainwave data and processes it to identify cognitive states such as attention, relaxation, and mental workload.

The proposed system consists of an EEG-based headband for signal collection, a processing module for noise filtering and feature extraction, and an AI model trained to classify brain activity patterns. The analyzed data is visualized through an interactive interface, enabling users to understand their cognitive state in real time. Such a system can be effectively used in applications related to education, mental health monitoring, focus enhancement, and human–computer interaction.

NeuroBand demonstrates how AI-driven wearable technology can transform traditional brain monitoring systems into accessible and intelligent solutions. Future enhancements may include cloud-based analytics, adaptive learning models, and integration with smart learning or healthcare platforms.

---

## Table of Contents

- [Features](#features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Project Members](#project-members)
- [Project Guides](#project-guides)
- [Deployment Steps](#deployment-steps)
- [Subject Details](#subject-details)

---

## Features

- 🧠 **Real-Time EEG Signal Acquisition** — Captures raw brainwave signals non-invasively via an EEG-equipped headband.
- 🔉 **Noise Filtering & Signal Processing** — Applies bandpass filters and artifact removal to clean raw EEG data for reliable analysis.
- 🤖 **AI-Based Cognitive State Classification** — A trained ML/DL model classifies brain activity into states such as focused, relaxed, or mentally overloaded.
- 📊 **Interactive Visualization Dashboard** — Displays real-time brainwave data and classification outputs through an intuitive user interface.
- 📡 **Portable & Wearable Design** — Lightweight headband form factor suitable for everyday use in educational and healthcare contexts.
- 🔮 **Future-Ready Architecture** — Designed for extensibility with cloud analytics, adaptive models, and smart platform integration.

---

## System Architecture

```
┌─────────────────────┐
│   EEG Headband       │  ← Electrode sensors pick up brainwave signals
│  (Signal Capture)    │
└────────┬────────────┘
         │ Raw EEG Signal
         ▼
┌─────────────────────┐
│  Signal Processing   │  ← Noise filtering, bandpass filter, feature extraction
│     Module           │     (Alpha, Beta, Theta, Delta waves)
└────────┬────────────┘
         │ Cleaned Feature Vector
         ▼
┌─────────────────────┐
│    AI / ML Model     │  ← Classifies cognitive state
│  (Classification)    │     (Focused / Relaxed / Stressed / Neutral)
└────────┬────────────┘
         │ Predicted State
         ▼
┌─────────────────────┐
│  Visualization UI    │  ← Dashboard displaying real-time state & EEG waveform
│   (Dashboard)        │
└─────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Signal Acquisition | EEG Sensors / Electrodes |
| Microcontroller | Arduino / Raspberry Pi / ESP32 |
| Signal Processing | Python, NumPy, SciPy, MNE-Python |
| AI / ML Model | Scikit-learn / TensorFlow / PyTorch |
| Visualization | Matplotlib / Plotly / Streamlit / Custom Web UI |
| Communication | Bluetooth / Serial / Wi-Fi |
| Backend (optional) | Flask / FastAPI |

---

### Project Members

| # | Name | Role |
|---|---|---|
| 1 | PATIL MAYUR BALASAHEB | Team Leader |
| 2 | PATIL HRISHI SUNIL | Member |
| 3 | SANKHE HARSH RAJESH | Member |
| 4 | KHAN MOHAMMED HANZALA JAN MOHAMMED | Member |

---

### Project Guides

| # | Name | Role |
|---|---|---|
| 1 | PROF. MOHAMMED JUNED | Primary Guide |

---

### Deployment Steps

Please follow the steps below to run this project.

**Prerequisites**
- Python 3.8 or above
- pip (Python package manager)
- Compatible EEG hardware (or sample EEG dataset for simulation)

**1. Clone the Repository**
```bash
git clone https://github.com/Hrishi-524/concentartion_band.git
cd concentartion_band
```

**2. Create and Activate a Virtual Environment**
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

**3. Install Required Dependencies**
```bash
pip install -r requirements.txt
```

**4. Connect the EEG Hardware** *(Skip if using sample data)*
- Connect the EEG headband to your system via USB/Bluetooth.
- Verify the correct COM port or device address is configured in `config.py`.

**5. Run Signal Acquisition / Data Collection**
```bash
python acquire_signal.py
```

**6. Preprocess the EEG Data**
```bash
python preprocess.py
```

**7. Train the AI Model** *(Skip if using pre-trained weights)*
```bash
python train_model.py
```

**8. Launch the Real-Time Dashboard**
```bash
python app.py
# or, if using Streamlit:
streamlit run app.py
```

**9. Open the UI**  
Navigate to `http://localhost:8501` (Streamlit) or `http://localhost:5000` (Flask) in your browser to view real-time brain activity monitoring.

---

### Subject Details

| Field | Details |
|---|---|
| Class | TE (COMP) Div A — 2025-2026 |
| Subject | Mini Project Lab: 2B (mP2B) |
| Project Type | Mini Project |

---

> *NeuroBand — Making the invisible mind, visible.*
