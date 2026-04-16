from core.source import CSVReplaySource
from core.pipeline import FocusPipeline

source   = CSVReplaySource("recorder/eeg_data_highfocus_beta.csv", realtime=False)
pipeline = FocusPipeline(source, ema_alpha=0.3)

for r in pipeline.run():
    flag = "!! ARTIFACT" if r["artifact"] else ""
    print(
        f"t={r['timestamp']:.2f} | "
        f"θ={r['theta']:.3f} α={r['alpha']:.3f} β={r['beta']:.3f} | "  # normalized
        f"engage={r['ratio_engage']:.3f} | "
        f"raw_score={r['focus_score_raw']:.3f} smooth={r['focus_score']:.3f}"
        f"{flag}"
    )