"use client";
import { memo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ReferenceLine, ResponsiveContainer
} from "recharts";
import { EEGFrame } from "@/hooks/useEEGStream";

interface Props { frames: EEGFrame[] }

export default memo(function FocusChart({ frames }: Props) {
  const WINDOW_STEP = 0.25; // seconds per point

const data = frames.map((f, i) => ({
  time: (i * WINDOW_STEP),
  smooth: f.focus_score,
  raw: f.focus_score_raw,
  artifact: f.artifact,
}));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
        <defs>
          <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="currentColor"
          opacity={0.07}
          vertical={false}
        />

        <XAxis
            dataKey="time"
            tickFormatter={(t: number) => `${Math.round(t)}s`}
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--color-border)" }}
            label={{
                value: "Recent Time (Latest ~25 seconds))",
                position: "insideBottomRight",
                offset: -4,
                fontSize: 11,
                fill: "var(--color-muted-foreground)"
            }}
            interval="preserveStartEnd"
            minTickGap={20}
        />

        <YAxis
          domain={[0, "auto"]}
          tickCount={6}
          tickFormatter={(v: number) => v.toFixed(2)}
          tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          width={48}
          label={{ value: "Focus Score", angle: -90, position: "insideLeft", offset: 10, fontSize: 11, fill: "var(--color-muted-foreground)" }}
        />

        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
            boxShadow: "0 4px 24px rgba(0,0,0,.2)",
          }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(val: any) => typeof val === "number" ? val.toFixed(4) : val}
          labelFormatter={() => ""}
        />

        <ReferenceLine
          y={0.3} stroke="#f59e0b" strokeWidth={1}
          strokeDasharray="6 3"
          label={{ value: "Low", position: "right", fontSize: 10, fill: "#f59e0b" }}
        />
        <ReferenceLine
          y={0.6} stroke="#22c55e" strokeWidth={1}
          strokeDasharray="6 3"
          label={{ value: "High", position: "right", fontSize: 10, fill: "#22c55e" }}
        />

        <Line
          type="monotone" dataKey="smooth"
          stroke="#818cf8" strokeWidth={2.5} dot={false}
          name="Smooth"
          isAnimationActive={false}
        />
        <Line
          type="monotone" dataKey="raw"
          stroke="#6366f1" strokeWidth={1} dot={false}
          strokeDasharray="4 3" name="Raw" opacity={0.4}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});