import React, { forwardRef, useRef } from "react";
import { format, isValid } from "date-fns";
import { cn } from "@/lib/utils";

export type DateSegments = { day: string; month: string; year: string };

export const EMPTY_SEGMENTS: DateSegments = { day: "", month: "", year: "" };

export const toSegments = (date?: Date): DateSegments =>
  date && isValid(date)
    ? {
        day: format(date, "dd"),
        month: format(date, "MM"),
        year: format(date, "yyyy"),
      }
    : EMPTY_SEGMENTS;

export type ParsedDate =
  | { status: "empty" }
  | { status: "incomplete" }
  | { status: "invalid" }
  | { status: "valid"; date: Date };

/**
 * A finished date that does not exist (31/09) is invalid rather than rolled
 * over into October, which is what `new Date` would silently do.
 */
export const parseSegments = ({
  day,
  month,
  year,
}: DateSegments): ParsedDate => {
  if (!day && !month && !year) return { status: "empty" };
  if (!day || !month || year.length !== 4) return { status: "incomplete" };
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
    ? { status: "valid", date }
    : { status: "invalid" };
};

type Props = {
  label: string;
  value: DateSegments;
  onChange: (value: DateSegments) => void;
  error?: string;
};

const SEGMENTS = [
  { key: "day", placeholder: "DD", length: 2, width: "w-6" },
  { key: "month", placeholder: "MM", length: 2, width: "w-7" },
  { key: "year", placeholder: "YYYY", length: 4, width: "w-11" },
] as const;

/**
 * dd / mm / yyyy in three boxes. Focus moves on as each one fills, so a whole
 * date is eight keystrokes, and Backspace in an empty box steps back. The ref
 * is the day box, for "Custom" to put the cursor in.
 */
const DateInput = forwardRef<HTMLInputElement, Props>(
  ({ label, value, onChange, error }, ref) => {
    const inputs = useRef<(HTMLInputElement | null)[]>([]);
    const id = label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span
          id={`${id}-label`}
          className="text-label-3 text-secondary-foreground"
        >
          {label}
        </span>
        <div
          role="group"
          aria-labelledby={`${id}-label`}
          aria-invalid={!!error || undefined}
          className={cn(
            "flex h-9 items-center rounded-md border bg-background px-3 text-sm tabular-nums",
            "focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/30",
            error
              ? "border-destructive-foreground focus-within:border-destructive-foreground"
              : "border-input"
          )}
        >
          {SEGMENTS.map((segment, index) => (
            <React.Fragment key={segment.key}>
              {index ? (
                <span aria-hidden className="px-0.5 text-muted-foreground">
                  /
                </span>
              ) : null}
              <input
                ref={(node) => {
                  inputs.current[index] = node;
                  if (index === 0) {
                    if (typeof ref === "function") ref(node);
                    else if (ref) ref.current = node;
                  }
                }}
                inputMode="numeric"
                autoComplete="off"
                aria-label={`${label} ${segment.key}`}
                placeholder={segment.placeholder}
                maxLength={segment.length}
                value={value[segment.key]}
                className={cn(
                  segment.width,
                  "bg-transparent text-center outline-none placeholder:text-muted-foreground"
                )}
                onChange={(event) => {
                  const digits = event.target.value
                    .replace(/\D/g, "")
                    .slice(0, segment.length);
                  onChange({ ...value, [segment.key]: digits });
                  if (digits.length === segment.length)
                    inputs.current[index + 1]?.focus();
                }}
                // Typing into a filled box replaces it, rather than being
                // swallowed by maxLength.
                onFocus={(event) => event.target.select()}
                onKeyDown={(event) => {
                  if (
                    event.key === "Backspace" &&
                    !value[segment.key] &&
                    index > 0
                  ) {
                    event.preventDefault();
                    inputs.current[index - 1]?.focus();
                  }
                }}
              />
            </React.Fragment>
          ))}
        </div>
        {error ? (
          <span
            role="alert"
            className="text-label-3 text-destructive-foreground"
          >
            {error}
          </span>
        ) : null}
      </div>
    );
  }
);
DateInput.displayName = "DateInput";

export default DateInput;
