import React, { useRef, useState } from "react";
import { isBefore } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DateInput, {
  EMPTY_SEGMENTS,
  parseSegments,
  toSegments,
  type DateSegments,
} from "./date-input";
import {
  matchPreset,
  sameRange,
  type DatePreset,
  type DateRangeValue,
} from "./presets";

type Props = {
  value: DateRangeValue;
  onApply: (value: DateRangeValue) => void;
  presets: DatePreset[];
  presetsLabel: string;
  today: Date;
  /** Days after this cannot be picked, e.g. today for received documents. */
  maxDate?: Date;
};

const CUSTOM = "__custom";

/**
 * The DateFilter's panel. The typed fields are the draft: picking a preset or
 * two days on the calendar fills them, and nothing reaches the filter until
 * Apply — a range takes two clicks and a typed date is incomplete until its
 * last digit, so committing live would filter on half-entered input.
 */
const DateRangePanel = ({
  value,
  onApply,
  presets,
  presetsLabel,
  today,
  maxDate,
}: Props) => {
  const [fromSegments, setFromSegments] = useState<DateSegments>(() =>
    toSegments(value.from)
  );
  const [toSegmentsValue, setToSegments] = useState<DateSegments>(() =>
    toSegments(value.to)
  );
  const [month, setMonth] = useState<Date>(value.from ?? today);
  const [custom, setCustom] = useState(false);
  const fromRef = useRef<HTMLInputElement>(null);
  /** Set when "Custom" is chosen: the select's close hands focus to From. */
  const focusFrom = useRef(false);

  const from = parseSegments(fromSegments);
  const to = parseSegments(toSegmentsValue);
  const inverted =
    from.status === "valid" &&
    to.status === "valid" &&
    isBefore(to.date, from.date);

  const fromError =
    from.status === "invalid"
      ? "That date doesn’t exist."
      : from.status === "empty" && to.status !== "empty"
        ? "Add a start date."
        : undefined;
  const toError =
    to.status === "invalid"
      ? "That date doesn’t exist."
      : inverted
        ? "Must be on or after the From date."
        : undefined;

  // The range the fields describe, when they describe one. A lone From is a
  // one-day range; all-empty is "no date", which Apply can commit to clear.
  const draft: DateRangeValue | null =
    from.status === "empty" && to.status === "empty"
      ? {}
      : from.status === "valid" &&
          (to.status === "valid" || to.status === "empty") &&
          !inverted
        ? {
            from: from.date,
            to: to.status === "valid" ? to.date : from.date,
          }
        : null;

  const canApply = !!draft && !sameRange(draft, value);
  const canReset =
    Object.values(fromSegments).some(Boolean) ||
    Object.values(toSegmentsValue).some(Boolean);

  const preset = draft ? matchPreset(draft, presets, today) : undefined;
  const presetValue =
    custom || (!preset && canReset) ? CUSTOM : (preset?.label ?? "");

  const setRange = (range: DateRangeValue) => {
    setFromSegments(toSegments(range.from));
    setToSegments(toSegments(range.to));
  };

  return (
    <div className="flex w-[296px] flex-col">
      <div className="flex flex-col gap-3 p-3 pb-0">
        <label className="flex flex-col gap-1">
          <span className="text-label-3 text-secondary-foreground">
            {presetsLabel}
          </span>
          <Select
            value={presetValue}
            onValueChange={(next) => {
              if (next === CUSTOM) {
                setCustom(true);
                focusFrom.current = true;
                return;
              }
              const picked = presets.find((p) => p.label === next);
              if (!picked) return;
              const range = picked.getValue(today);
              setCustom(false);
              setRange(range);
              setMonth(range.from);
            }}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Choose a range" />
            </SelectTrigger>
            <SelectContent
              onCloseAutoFocus={(event) => {
                if (!focusFrom.current) return;
                // Custom puts the cursor in From instead of back on the select.
                focusFrom.current = false;
                event.preventDefault();
                fromRef.current?.focus();
              }}
            >
              {presets.map((p) => (
                <SelectItem key={p.label} value={p.label}>
                  {p.label}
                </SelectItem>
              ))}
              <SelectItem value={CUSTOM}>Custom</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <div className="flex items-start gap-2">
          <DateInput
            ref={fromRef}
            label="From"
            value={fromSegments}
            error={fromError}
            onChange={(next) => {
              setCustom(true);
              setFromSegments(next);
              const parsed = parseSegments(next);
              if (parsed.status === "valid") setMonth(parsed.date);
            }}
          />
          <DateInput
            label="To"
            value={toSegmentsValue}
            error={toError}
            onChange={(next) => {
              setCustom(true);
              setToSegments(next);
            }}
          />
        </div>
      </div>
      <Calendar
        mode="range"
        month={month}
        onMonthChange={setMonth}
        // Month and year open as dropdowns, to jump rather than page.
        captionLayout="dropdown-buttons"
        fromYear={today.getFullYear() - 10}
        toYear={today.getFullYear()}
        disabled={maxDate ? { after: maxDate } : undefined}
        selected={draft?.from ? { from: draft.from, to: draft.to } : undefined}
        onSelect={(range) => {
          setCustom(false);
          setRange({ from: range?.from, to: range?.to });
        }}
        className="self-center"
      />
      <div className="flex items-center justify-end gap-2 border-t border-neutral-gray px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          isDestructive
          disabled={!canReset}
          onClick={() => {
            setFromSegments(EMPTY_SEGMENTS);
            setToSegments(EMPTY_SEGMENTS);
            setCustom(false);
          }}
        >
          Reset
        </Button>
        <Button
          size="sm"
          className="w-[78px]"
          disabled={!canApply}
          onClick={() => draft && onApply(draft)}
        >
          Apply
        </Button>
      </div>
    </div>
  );
};

export default DateRangePanel;
