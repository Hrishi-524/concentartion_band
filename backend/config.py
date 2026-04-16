FS = 250
WINDOW_SIZE = FS * 2
STEP_SIZE = FS // 4
SERIAL_PORT = "COM6"
BAUD_RATE = 115200

BANDS = {
    "theta": (4, 8),
    "alpha": (8, 13),
    "beta":  (13, 30),
}

# Artifact rejection
ARTIFACT_AMP_THRESHOLD  = 200    # raw ADC amplitude (post DC-removal)
ARTIFACT_STD_MAX        = 80     # signal too noisy
ARTIFACT_STD_MIN        = 0.5    # signal too flat = disconnected electrode