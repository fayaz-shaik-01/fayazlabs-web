"use client";

import { useCallback, useId } from "react";
import { cn } from "@/lib/utils";

interface ParameterSliderProps {
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly step?: number;
  readonly value: number;
  readonly onChange: (value: number) => void;
  readonly unit?: string;
  readonly precision?: number;
  readonly className?: string;
}

export function ParameterSlider({
  label,
  min,
  max,
  step = 0.01,
  value,
  onChange,
  unit,
  precision = 2,
  className,
}: ParameterSliderProps) {
  const id = useId();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseFloat(e.target.value));
    },
    [onChange],
  );

  const displayValue =
    precision >= 0 ? value.toFixed(precision) : String(value);

  return (
    <div className={cn("flex flex-col gap-1.5 min-w-[140px]", className)}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-xs font-medium text-muted-foreground"
        >
          {label}
        </label>
        <span className="text-xs font-mono tabular-nums text-foreground/80">
          {displayValue}
          {unit && (
            <span className="ml-0.5 text-muted-foreground">{unit}</span>
          )}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/[0.08] accent-primary
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm
          [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background
          [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
        aria-label={`${label}: ${displayValue}${unit ? ` ${unit}` : ""}`}
      />
    </div>
  );
}
