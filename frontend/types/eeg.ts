export interface StudentData {
  focus_score:     number;
  focus_score_raw: number;
  theta:           number;
  alpha:           number;
  beta:            number;
  theta_raw:       number;
  alpha_raw:       number;
  beta_raw:        number;
  ratio_focus:     number;
  ratio_engage:    number;
  variance:        number;
  signal_std:      number;
  ml_state:        string;
  ml_confidence:   number;
  artifact:        boolean;
  timestamp:       number;
}

export interface ClassSnapshot {
  ts:        number;
  avgFocus:  number;
  avgTheta:  number;
  avgAlpha:  number;
  avgBeta:   number;
  count:     number;
}