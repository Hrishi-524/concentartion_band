import * as React from "react"
import { cn } from "@/lib/utils"

function Progress({
  className,
  value = 0,
  indicatorClassName,
  ...props
}: React.ComponentProps<"div"> & { value?: number; indicatorClassName?: string }) {
  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
        className
      )}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className={cn(
          "h-full rounded-full transition-all duration-500 ease-out",
          indicatorClassName ?? "bg-primary"
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

export { Progress }
