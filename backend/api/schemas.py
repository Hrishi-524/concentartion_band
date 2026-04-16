from pydantic import BaseModel


class EEGFrame(BaseModel):
    timestamp:       float
    theta:           float
    alpha:           float
    beta:            float
    theta_raw:       float = 0.0
    alpha_raw:       float = 0.0
    beta_raw:        float = 0.0
    ratio_focus:     float = 0.0
    ratio_engage:    float = 0.0
    variance:        float = 0.0
    signal_std:      float = 0.0
    focus_score:     float
    focus_score_raw: float = 0.0
    artifact:        bool  = False