import { useEffect, useRef, useState } from "react";

export interface EEGFrame {
  timestamp:       number;
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
  focus_score:     number;
  focus_score_raw: number;
  artifact:        boolean;
}

const MAX_POINTS = 100; // rolling window shown on chart

export function useEEGStream(url: string) {
  const [frames, setFrames]     = useState<EEGFrame[]>([]);
  const [status, setStatus]     = useState<"connecting"|"connected"|"disconnected">("connecting");
  const wsRef                   = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen    = () => setStatus("connected");
    ws.onclose   = () => setStatus("disconnected");
    ws.onerror   = () => setStatus("disconnected");

    ws.onmessage = (e) => {
      const frame: EEGFrame = JSON.parse(e.data);
      setFrames(prev => {
        const next = [...prev, frame];
        return next.length > MAX_POINTS ? next.slice(-MAX_POINTS) : next;
      });
    };

    return () => ws.close();
  }, [url]);

  const latest = frames.at(-1) ?? null;

  return { frames, latest, status };
}