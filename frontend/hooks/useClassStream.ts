"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { StudentData, ClassSnapshot } from "@/types/eeg";

const MAX_HISTORY   = 120;  // ~30s at 4Hz
const MAX_SPARKLINE = 30;

export interface ClassStreamState {
  students:       Record<string, StudentData>;
  studentHistory: Record<string, number[]>;     // per-student sparkline data
  classHistory:   ClassSnapshot[];              // class-level time-series
  insight:        string;
  status:         "connecting" | "connected" | "disconnected";
}

export function useClassStream(): ClassStreamState {
  const [students, setStudents]             = useState<Record<string, StudentData>>({});
  const [studentHistory, setStudentHistory] = useState<Record<string, number[]>>({});
  const [classHistory, setClassHistory]     = useState<ClassSnapshot[]>([]);
  const [insight, setInsight]               = useState("");
  const [status, setStatus]                 = useState<ClassStreamState["status"]>("connecting");

  const tickRef = useRef(0);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const msg = JSON.parse(event.data);
      const studs: Record<string, StudentData> = msg.students ?? {};
      const ins: string = msg.insight ?? "";

      setStudents(studs);
      setInsight(ins);

      // Build per-student sparkline history
      setStudentHistory(prev => {
        const next = { ...prev };
        for (const [id, s] of Object.entries(studs)) {
          const arr = next[id] ? [...next[id], s.focus_score] : [s.focus_score];
          next[id] = arr.length > MAX_SPARKLINE ? arr.slice(-MAX_SPARKLINE) : arr;
        }
        return next;
      });

      // Build class-level time-series
      const entries = Object.values(studs);
      if (entries.length > 0) {
        const avgFocus = entries.reduce((s, e) => s + e.focus_score, 0) / entries.length;
        const avgTheta = entries.reduce((s, e) => s + e.theta, 0) / entries.length;
        const avgAlpha = entries.reduce((s, e) => s + e.alpha, 0) / entries.length;
        const avgBeta  = entries.reduce((s, e) => s + e.beta, 0) / entries.length;

        tickRef.current++;
        const snap: ClassSnapshot = {
          ts: tickRef.current,
          avgFocus: +avgFocus.toFixed(4),
          avgTheta: +avgTheta.toFixed(4),
          avgAlpha: +avgAlpha.toFixed(4),
          avgBeta:  +avgBeta.toFixed(4),
          count: entries.length,
        };

        setClassHistory(prev => {
          const next = [...prev, snap];
          return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
        });
      }
    } catch (err) {
      console.error("[useClassStream] parse error:", err);
    }
  }, []);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/class");

    ws.onopen  = () => setStatus("connected");
    ws.onclose = () => setStatus("disconnected");
    ws.onerror = () => setStatus("disconnected");
    ws.onmessage = handleMessage;

    return () => ws.close();
  }, [handleMessage]);

  return { students, studentHistory, classHistory, insight, status };
}