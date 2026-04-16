"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type SourceMode =
  | { mode: "csv"; file: "highfocus" | "relaxed" }
  | { mode: "serial" };

interface Props {
  current: SourceMode;
  onChange: (s: SourceMode) => void;
}

const OPTIONS: { label: string; source: SourceMode }[] = [
  { label: "terminal 1",  source: { mode: "csv", file: "highfocus" } },
  { label: "terminal 2",     source: { mode: "csv", file: "relaxed"   } },
  { label: "terminal 3",            source: { mode: "serial"                 } },
];

function isActive(a: SourceMode, b: SourceMode) {
  if (a.mode !== b.mode) return false;
  if (a.mode === "csv" && b.mode === "csv") return a.file === b.file;
  return true;
}

export default function SourceControl({ current, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground mr-1">Source:</span>
      {OPTIONS.map(({ label, source }) => (
        <Button
          key={label}
          size="sm"
          variant={isActive(current, source) ? "default" : "outline"}
          onClick={() => onChange(source)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}