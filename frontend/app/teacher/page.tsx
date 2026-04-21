"use client";

import { memo, useMemo } from "react";
import Link from "next/link";
import { useClassStream } from "@/hooks/useClassStream";
import { StudentData } from "@/types/eeg";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

/* ================================================================
   STUDENT ID → Display Name / Terminal mapping
   ================================================================ */

const STUDENT_NAMES: Record<string, string> = {
  user_1: "Student 1",
  user_2: "Student 2",
};

/** Maps backend user IDs to the source query param used on the / page. */
const STUDENT_TERMINAL: Record<string, string> = {
  user_1: "highfocus",  // terminal 1
  user_2: "relaxed",    // terminal 2
};

function displayName(id: string) {
  return STUDENT_NAMES[id] ?? id;
}

function terminalHref(id: string) {
  const file = STUDENT_TERMINAL[id];
  if (file) return `/?source=${file}`;
  // fallback: live serial
  return `/?source=serial`;
}

/* ================================================================
   HELPERS
   ================================================================ */

function focusTier(score: number) {
  if (score >= 0.6) return { label: "High",     color: "#22c55e", bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.25)",   icon: "🧠" };
  if (score >= 0.3) return { label: "Moderate",  color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.25)",  icon: "⚡" };
  return              { label: "Low",       color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.25)",   icon: "⚠️" };
}

function stateColor(state: string) {
  if (state === "focused")   return "#22c55e";
  if (state === "distracted") return "#ef4444";
  return "#a1a1aa";
}

/* ================================================================
   AI INSIGHT BANNER
   ================================================================ */

function InsightBanner({ insight, avgFocus }: { insight: string; avgFocus: number }) {
  const tier = focusTier(avgFocus);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border px-6 py-5 transition-all duration-700"
      style={{ background: tier.bg, borderColor: tier.border }}
    >
      <div className="flex items-start gap-4">
        <span className="text-3xl">{tier.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            Class Status — <span style={{ color: tier.color }}>{tier.label}</span>
          </p>
          <p className="text-lg font-semibold leading-snug">
            {insight || "Waiting for data…"}
          </p>
        </div>
        <Badge
          className="shrink-0 rounded-full px-3 py-1 text-xs font-bold"
          style={{ backgroundColor: tier.color + "20", color: tier.color, border: `1px solid ${tier.color}40` }}
        >
          {(avgFocus * 100).toFixed(0)}% Focus
        </Badge>
      </div>
    </div>
  );
}

/* ================================================================
   METRIC CARDS
   ================================================================ */

const PIE_FOCUS_COLORS = ["#22c55e", "#ef4444"];
const PIE_BAND_COLORS  = ["#818cf8", "#22c55e", "#f59e0b"];

function MetricCards({
  avgFocus,
  focusedCount,
  distractedCount,
  avgTheta,
  avgAlpha,
  avgBeta,
  activeCount,
}: {
  avgFocus: number;
  focusedCount: number;
  distractedCount: number;
  avgTheta: number;
  avgAlpha: number;
  avgBeta: number;
  activeCount: number;
}) {
  const focusPieData = [
    { name: "Focused",    value: focusedCount },
    { name: "Distracted", value: distractedCount },
  ];

  const total = avgTheta + avgAlpha + avgBeta + 1e-9;
  const bandPieData = [
    { name: "Beta (Focus)",      value: +(avgBeta  / total * 100).toFixed(1) },
    { name: "Alpha (Relax)",     value: +(avgAlpha / total * 100).toFixed(1) },
    { name: "Theta (Low Attn)",  value: +(avgTheta / total * 100).toFixed(1) },
  ];

  const tier = focusTier(avgFocus);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

      {/* Card 1: Average Focus */}
      <Card className="transition-all duration-500" style={{ borderColor: tier.border }}>
        <CardHeader className="pb-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">Class Focus</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold tabular-nums transition-colors duration-500" style={{ color: tier.color }}>
            {(avgFocus * 100).toFixed(1)}%
          </p>
          <Progress
            value={avgFocus * 100}
            className="mt-3 h-2.5"
            indicatorClassName="transition-all duration-700"
            style={{ ["--tw-bg-opacity" as string]: 1 }}
          />
          <p className="mt-1 text-xs text-muted-foreground">{tier.label} engagement</p>
        </CardContent>
      </Card>

      {/* Card 2: Focus Distribution Pie */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">Focus Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center pt-0">
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={focusPieData}
                cx="50%" cy="50%"
                innerRadius={36} outerRadius={58}
                dataKey="value"
                isAnimationActive={false}
                strokeWidth={0}
              >
                {focusPieData.map((_, i) => (
                  <Cell key={i} fill={PIE_FOCUS_COLORS[i]} fillOpacity={0.85} />
                ))}
              </Pie>
              <Legend
                iconSize={8}
                wrapperStyle={{ fontSize: 11 }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(val: any) => <span className="text-muted-foreground">{val}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Card 3: Band Power Breakdown Pie */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">EEG Band Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center pt-0">
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={bandPieData}
                cx="50%" cy="50%"
                innerRadius={36} outerRadius={58}
                dataKey="value"
                isAnimationActive={false}
                strokeWidth={0}
              >
                {bandPieData.map((_, i) => (
                  <Cell key={i} fill={PIE_BAND_COLORS[i]} fillOpacity={0.85} />
                ))}
              </Pie>
              <Legend
                iconSize={8}
                wrapperStyle={{ fontSize: 11 }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(val: any) => <span className="text-muted-foreground">{val}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Card 4: Active Students */}
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">Active Students</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold tabular-nums">{activeCount}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Streaming live
          </div>
          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between"><span>Focused</span><span className="font-medium text-green-500">{focusedCount}</span></div>
            <div className="flex justify-between"><span>Distracted</span><span className="font-medium text-red-500">{distractedCount}</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ================================================================
   TIME-SERIES CHART
   ================================================================ */

const ClassTimeSeries = memo(function ClassTimeSeries({ data }: { data: { ts: number; avgFocus: number; avgTheta: number; avgAlpha: number; avgBeta: number }[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Class Focus Over Time</CardTitle>
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded-sm bg-[#818cf8]" /> Focus</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded-sm bg-[#f59e0b] opacity-40" /> Theta</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded-sm bg-[#22c55e] opacity-40" /> Alpha</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded-sm bg-[#818cf8] opacity-40" /> Beta</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.06} vertical={false} />
            <XAxis
              dataKey="ts"
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-border)" }}
            />
            <YAxis
              domain={[0, "auto"]}
              tickCount={5}
              tickFormatter={(v: number) => v.toFixed(2)}
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 11,
                boxShadow: "0 4px 24px rgba(0,0,0,.2)",
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(val: any) => typeof val === "number" ? val.toFixed(4) : val}
              labelFormatter={() => ""}
            />
            <Line type="monotone" dataKey="avgFocus" stroke="#818cf8" strokeWidth={2.5} dot={false} isAnimationActive={false} name="Focus" />
            <Line type="monotone" dataKey="avgTheta" stroke="#f59e0b" strokeWidth={1} dot={false} isAnimationActive={false} opacity={0.3} name="Theta" />
            <Line type="monotone" dataKey="avgAlpha" stroke="#22c55e" strokeWidth={1} dot={false} isAnimationActive={false} opacity={0.3} name="Alpha" />
            <Line type="monotone" dataKey="avgBeta"  stroke="#818cf8" strokeWidth={1} dot={false} isAnimationActive={false} opacity={0.3} name="Beta" strokeDasharray="4 3" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});

/* ================================================================
   SPARKLINE (tiny inline chart for each student)
   ================================================================ */

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return <div className="h-8 w-full" />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const h = 32;
  const w = 100;
  const step = w / (data.length - 1);

  const points = data.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-full" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ================================================================
   STUDENT CARD
   ================================================================ */

function StudentCard({ id, data, sparkData, href }: { id: string; data: StudentData; sparkData: number[]; href: string }) {
  const tier = focusTier(data.focus_score);
  const mlColor = stateColor(data.ml_state);
  const name = displayName(id);

  return (
    <Link href={href} className="block">
      <Card className="group cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/5 hover:border-[#818cf8]/40">
        <CardContent className="p-4 space-y-3">

          {/* Header row */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{name}</span>
            <Badge
              className="rounded-full text-[10px] px-2 py-0.5 font-semibold capitalize"
              style={{ backgroundColor: mlColor + "18", color: mlColor, border: `1px solid ${mlColor}30` }}
            >
              {data.ml_state || "—"}
            </Badge>
          </div>

          {/* Focus score */}
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold tabular-nums transition-colors duration-300" style={{ color: tier.color }}>
              {data.focus_score.toFixed(3)}
            </span>
            <span className="mb-1 text-xs text-muted-foreground">{tier.label}</span>
          </div>

          {/* Sparkline */}
          <Sparkline data={sparkData} color={tier.color} />

          {/* Band values */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-muted/50 px-2 py-1.5">
              <p className="text-[10px] text-muted-foreground">β Beta</p>
              <p className="text-xs font-semibold tabular-nums">{(data.beta * 100).toFixed(1)}%</p>
            </div>
            <div className="rounded-lg bg-muted/50 px-2 py-1.5">
              <p className="text-[10px] text-muted-foreground">α Alpha</p>
              <p className="text-xs font-semibold tabular-nums">{(data.alpha * 100).toFixed(1)}%</p>
            </div>
            <div className="rounded-lg bg-muted/50 px-2 py-1.5">
              <p className="text-[10px] text-muted-foreground">θ Theta</p>
              <p className="text-xs font-semibold tabular-nums">{(data.theta * 100).toFixed(1)}%</p>
            </div>
          </div>

          {/* Confidence bar */}
          {data.ml_confidence != null && (
            <div>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                <span>Confidence</span>
                <span className="font-medium">{(data.ml_confidence * 100).toFixed(0)}%</span>
              </div>
              <Progress value={data.ml_confidence * 100} className="h-1.5" indicatorClassName="bg-[#818cf8]" />
            </div>
          )}

          {/* Click hint */}
          <p className="text-[10px] text-muted-foreground text-center opacity-0 group-hover:opacity-100 transition-opacity">
            Click to view terminal →
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

/* ================================================================
   CONNECTION BADGE
   ================================================================ */

function StatusBadge({ status }: { status: "connecting" | "connected" | "disconnected" }) {
  const map = {
    connecting:   { dot: "#f59e0b", text: "Connecting",    pulse: true  },
    connected:    { dot: "#22c55e", text: "Connected",     pulse: true  },
    disconnected: { dot: "#ef4444", text: "Disconnected",  pulse: false },
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

/* ================================================================
   LOADING SKELETON
   ================================================================ */

function Skeleton() {
  return (
    <main className="mx-auto max-w-7xl space-y-5 p-6">
      <div className="h-20 rounded-2xl bg-muted/50 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-44 rounded-xl bg-muted/50 animate-pulse" />)}
      </div>
      <div className="h-72 rounded-xl bg-muted/50 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1,2].map(i => <div key={i} className="h-56 rounded-xl bg-muted/50 animate-pulse" />)}
      </div>
    </main>
  );
}

/* ================================================================
   MAIN PAGE
   ================================================================ */

export default function TeacherDashboard() {
  const { students, studentHistory, classHistory, insight, status } = useClassStream();

  const entries = useMemo(() => Object.entries(students), [students]);

  const { avgFocus, focusedCount, distractedCount, avgTheta, avgAlpha, avgBeta } = useMemo(() => {
    const vals = Object.values(students);
    if (vals.length === 0) return { avgFocus: 0, focusedCount: 0, distractedCount: 0, avgTheta: 0, avgAlpha: 0, avgBeta: 0 };
    const a = vals.reduce((s, v) => s + v.focus_score, 0) / vals.length;
    const fc = vals.filter(v => v.ml_state === "focused").length;
    const dc = vals.filter(v => v.ml_state === "distracted").length;
    const t = vals.reduce((s, v) => s + v.theta, 0) / vals.length;
    const al = vals.reduce((s, v) => s + v.alpha, 0) / vals.length;
    const b = vals.reduce((s, v) => s + v.beta, 0) / vals.length;
    return { avgFocus: a, focusedCount: fc, distractedCount: dc, avgTheta: t, avgAlpha: al, avgBeta: b };
  }, [students]);

  const isLoading = status === "connecting" && entries.length === 0;

  if (isLoading) return <Skeleton />;

  return (
    <main className="mx-auto max-w-7xl space-y-5 p-6">

      {/* ---- Header ---- */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">NeuroBand</h1>
          <span className="text-sm text-muted-foreground font-medium">Classroom Monitor</span>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* ---- 1. AI Insight Banner ---- */}
      <InsightBanner insight={insight} avgFocus={avgFocus} />

      {/* ---- 2. Metric Cards ---- */}
      <MetricCards
        avgFocus={avgFocus}
        focusedCount={focusedCount}
        distractedCount={distractedCount}
        avgTheta={avgTheta}
        avgAlpha={avgAlpha}
        avgBeta={avgBeta}
        activeCount={entries.length}
      />

      {/* ---- 3A. Time-Series ---- */}
      <ClassTimeSeries data={classHistory} />

      {/* ---- 3B. Student Cards ---- */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Students</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {entries.map(([id, data]) => (
            <StudentCard
              key={id}
              id={id}
              data={data}
              sparkData={studentHistory[id] ?? []}
              href={terminalHref(id)}
            />
          ))}
        </div>
      </div>

      {/* ---- EEG Band Legend ---- */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground border-t pt-4">
        <span className="font-medium">EEG Bands:</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#f59e0b]" /> Theta (4–8 Hz) — Drowsiness / Low Attention</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#22c55e]" /> Alpha (8–13 Hz) — Relaxation</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#818cf8]" /> Beta (13–30 Hz) — Active Focus</span>
      </div>
    </main>
  );
}