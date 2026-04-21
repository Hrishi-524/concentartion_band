"use client";

import { useState, useMemo } from "react";
import { useEEGStream }   from "@/hooks/useEEGStream";
import FocusChart         from "@/components/FocusChart";
import BandPowerChart     from "@/components/BandPowerChart";
import SourceControl, { SourceMode } from "@/components/SourceControl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { wsUrl, ENDPOINTS } from "@/lib/api";

function buildWsUrl(source: SourceMode): string {
  if (source.mode === "serial") {
    return wsUrl(ENDPOINTS.WS_EEG, { mode: "serial" });
  }
  return wsUrl(ENDPOINTS.WS_EEG, { mode: "csv", file: source.file });
}

/* ---------- Focus Score color mapping ---------- */
function focusTier(score: number) {
  if (score >= 0.6) return { label: "High",   color: "#22c55e", bg: "rgba(34,197,94,0.10)",  border: "rgba(34,197,94,0.30)"  };
  if (score >= 0.3) return { label: "Medium", color: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.30)" };
  return               { label: "Low",    color: "#ef4444", bg: "rgba(239,68,68,0.10)",  border: "rgba(239,68,68,0.30)"  };
}

/* ---------- Connection badge ---------- */
function StatusBadge({ status }: { status: "connecting" | "connected" | "disconnected" }) {
  const map = {
    connecting:   { dot: "#f59e0b", text: "Connecting", pulse: true  },
    connected:    { dot: "#22c55e", text: "Connected",  pulse: true  },
    disconnected: { dot: "#ef4444", text: "Disconnected", pulse: false },
  } as const;
  const s = map[status];
  return (
    <div className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
         style={{ borderColor: s.dot + "40" }}>
      <span className="relative flex h-2.5 w-2.5">
        {s.pulse && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50"
                style={{ backgroundColor: s.dot }} />
        )}
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: s.dot }} />
      </span>
      {s.text}
    </div>
  );
}

/* ========== Main ========== */
export default function Dashboard() {
  const [source, setSource] = useState<SourceMode>({
    mode: "csv",
    file: "highfocus",
  });

  const wsUrl = useMemo(() => buildWsUrl(source), [source]);

  return <DashboardInner key={wsUrl} wsUrl={wsUrl} source={source} onSourceChange={setSource} />;
}

function DashboardInner({
  wsUrl,
  source,
  onSourceChange,
}: {
  wsUrl: string;
  source: SourceMode;
  onSourceChange: (s: SourceMode) => void;
}) {
  const { frames, latest, status } = useEEGStream(wsUrl);

  const tier = latest ? focusTier(latest.focus_score) : null;

  return (
    <main className="mx-auto max-w-6xl space-y-5 p-6">

      {/* ---- Header ---- */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">NeuroBand</h1>
          <span className="text-sm text-muted-foreground font-medium">EEG Focus Monitor</span>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          {latest?.artifact && (
            <div className="flex items-center gap-1.5 rounded-full bg-destructive/10 border border-destructive/30 px-3 py-1 text-xs font-medium text-destructive">
              ⚠ Artifact
            </div>
          )}
        </div>
      </div>

      {/* ---- Source toggle ---- */}
      <SourceControl current={source} onChange={onSourceChange} />

      {/* ---- KPI Cards row ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Focus Score — hero card */}
        <Card
          className="sm:col-span-1 transition-all duration-500"
          style={tier ? {
            background: tier.bg,
            borderColor: tier.border,
          } : undefined}
        >
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Focus Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold tabular-nums tracking-tight transition-colors duration-500"
               style={tier ? { color: tier.color } : undefined}>
              {latest ? latest.focus_score.toFixed(3) : "—"}
            </p>
            {tier && (
              <span className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{ backgroundColor: tier.color + "20", color: tier.color }}>
                {tier.label}
              </span>
            )}
          </CardContent>
        </Card>

        {/* Engagement ratio card */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">
              {latest ? latest.ratio_engage.toFixed(3) : "—"}
            </p>
            <span className="text-xs text-muted-foreground">α / θ ratio</span>
          </CardContent>
        </Card>

        {/* Variance card */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Signal Variance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">
              {latest ? latest.variance.toFixed(2) : "—"}
            </p>
            <span className="text-xs text-muted-foreground">Window stability</span>
          </CardContent>
        </Card>
      </div>

      {/* ---- Charts ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Focus Over Time</CardTitle>
          </CardHeader>
          <CardContent><FocusChart frames={frames} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Band Power Distribution</CardTitle>
          </CardHeader>
          <CardContent><BandPowerChart latest={latest} /></CardContent>
        </Card>
      </div>

    </main>
  );
}