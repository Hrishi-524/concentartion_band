"use client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, Cell, LabelList, ResponsiveContainer
} from "recharts";
import { EEGFrame } from "@/hooks/useEEGStream";

interface Props { latest: EEGFrame | null }

const BAND_COLORS = ["#f59e0b", "#22c55e", "#818cf8"] as const;

export default function BandPowerChart({ latest }: Props) {
  const data = latest
    ? [
        { band: "Theta (4–8 Hz)",  power: latest.theta,  pct: (latest.theta * 100) },
        { band: "Alpha (8–13 Hz)", power: latest.alpha,  pct: (latest.alpha * 100) },
        { band: "Beta (13–30 Hz)", power: latest.beta,   pct: (latest.beta * 100)  },
      ]
    : [];

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        margin={{ top: 16, right: 12, bottom: 4, left: 0 }}
        barCategoryGap="25%"
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="currentColor"
          opacity={0.07}
          vertical={false}
        />

        <XAxis
          dataKey="band"
          tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
          tickLine={false}
          axisLine={{ stroke: "var(--color-border)" }}
        />

        <YAxis
          domain={[0, 1]}
          tickCount={6}
          tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
          tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          width={44}
          label={{ value: "Relative Power", angle: -90, position: "insideLeft", offset: 10, fontSize: 11, fill: "var(--color-muted-foreground)" }}
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
          formatter={(val: any) => typeof val === "number" ? `${(val * 100).toFixed(1)}%` : val}
          labelFormatter={(l) => l}
        />

        <Bar dataKey="power" radius={[6, 6, 0, 0]} isAnimationActive={false}>
          {data.map((_, idx) => (
            <Cell key={idx} fill={BAND_COLORS[idx]} fillOpacity={0.85} />
          ))}
          <LabelList
            dataKey="pct"
            position="top"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(v: any) => `${Number(v).toFixed(1)}%`}
            style={{ fontSize: 11, fontWeight: 600, fill: "var(--color-muted-foreground)" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}