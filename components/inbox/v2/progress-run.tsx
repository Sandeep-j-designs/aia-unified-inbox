import React, { useEffect, useRef, useState } from "react";
import { Check, Loader2, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

/**
 * The shape a batch takes while it is running.
 *
 * One drawing, two callers — the Tally sync modal and the upload dialog. Both
 * are the same event: a pile of documents going across one at a time, with a
 * count that has to stay trustworthy while it moves. Drawing them differently
 * made the same progress read as two unrelated mechanisms.
 *
 * Built from Figma 21448:26058.
 */

export type RunRowState = "queued" | "active" | "done" | "failed";

export type RunRow = {
  id: string;
  label: string;
  state: RunRowState;
};

/**
 * A number that travels to its target instead of jumping to it.
 *
 * The count is stepped by whatever is doing the work — one document at a time,
 * a few per second — and rendered raw that reads as a stutter, because each
 * step lands with nothing between it and the last. Easing toward the target
 * turns the same steps into one continuous movement. It can sit a fraction
 * behind the truth mid-run; it is exact the moment the run stops, which is the
 * only moment the exact figure is read.
 */
const useSettling = (target: number) => {
  const [shown, setShown] = useState(target);
  const frame = useRef(0);
  const from = useRef(target);
  const startedAt = useRef(0);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setShown(target);
      return;
    }
    from.current = shown;
    startedAt.current = performance.now();
    const DURATION = 260;

    const step = (now: number) => {
      const t = Math.min(1, (now - startedAt.current) / DURATION);
      // easeOutCubic: fast off the mark, settling rather than braking.
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(from.current + (target - from.current) * eased);
      if (t < 1) frame.current = requestAnimationFrame(step);
    };

    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
    // `shown` is read as a starting point, not tracked — depending on it would
    // restart the tween on every frame it sets.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return shown;
};

/** "29 / 47 Bills", and the bar under it. */
export const RunCount = ({
  settled,
  total,
  unit,
}: {
  settled: number;
  total: number;
  unit: string;
}) => {
  const shown = useSettling(settled);
  const percent = total === 0 ? 0 : (shown / total) * 100;

  return (
    <div className="space-y-2">
      <p className="flex items-baseline gap-1.5">
        <span className="text-[32px] font-bold leading-none tabular-nums text-foreground">
          {Math.round(shown)}
        </span>
        <span className="text-base text-secondary-foreground">
          / {total} {unit}
        </span>
      </p>
      {/*
        The bar rides the same eased number as the count, so the two cannot
        disagree — and its own transition is off, because a transition on top
        of a tween is two easings fighting over one value.
      */}
      <Progress
        value={percent}
        className="h-1.5"
        indicatorClassName="transition-none"
      />
    </div>
  );
};

export const RunRowItem = ({ row }: { row: RunRow }) => (
  <div
    className={cn(
      // A fixed height, so a row changing state cannot resize the list under
      // the rows below it.
      "flex h-[42px] items-center gap-3 border-b border-neutral-gray px-3 last:border-b-0",
      // The row arrives rather than appears. 180ms is under the cadence of the
      // run itself, so a row has finished entering before the next one starts.
      "animate-in fade-in-0 slide-in-from-bottom-1 duration-200 ease-out motion-reduce:animate-none",
      "transition-colors duration-300 motion-reduce:transition-none",
      // The left border is always there and usually transparent: adding one to
      // the active row would shift its text 2px sideways as it lights up.
      "border-l-2 border-l-transparent",
      row.state === "active" && "border-l-primary bg-accent"
    )}
  >
    <span className="relative flex h-[18px] w-[18px] flex-none items-center justify-center">
      {row.state === "done" ? (
        <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-status-success animate-in zoom-in-50 duration-200 ease-out motion-reduce:animate-none">
          <Check className="h-3 w-3 text-white" strokeWidth={3} />
        </span>
      ) : row.state === "failed" ? (
        <XCircle className="h-[18px] w-[18px] text-status-error animate-in zoom-in-50 duration-200 ease-out motion-reduce:animate-none" />
      ) : (
        <Loader2 className="h-[18px] w-[18px] animate-spin text-primary" />
      )}
    </span>
    <span className="truncate text-sm text-foreground">{row.label}</span>
  </div>
);

/**
 * Only what has happened, plus what is happening. The queue behind it is a
 * number, not a list — showing it would bury the live row.
 *
 * `settled` is passed rather than derived so the scroll fires on the count
 * changing, not on every re-render of the same rows.
 */
export const RunRowList = ({
  rows,
  settled,
  className,
}: {
  rows: RunRow[];
  settled: number;
  className?: string;
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  /*
    The row that matters is the one in flight, and it is always last.

    Scrolled smoothly, and by animation frame rather than by assignment: at one
    row every 120ms, jumping `scrollTop` to the bottom moved the list 42px per
    step with nothing in between, which read as the list flinching each time a
    document landed. Now it glides, and the rows entering at the bottom glide
    with it.
  */
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const target = list.scrollHeight - list.clientHeight;
    if (reduced) {
      list.scrollTop = target;
      return;
    }
    // rAF so the row added in this same commit is measured before the scroll.
    const frame = requestAnimationFrame(() =>
      list.scrollTo({ top: target, behavior: "smooth" })
    );
    return () => cancelAnimationFrame(frame);
  }, [settled]);

  return (
    <div
      ref={listRef}
      className={cn(
        "max-h-[180px] overflow-y-auto rounded-lg border border-neutral-gray",
        // `className` last, so a caller can pin the height instead of letting
        // the box grow into it.
        className
      )}
    >
      {rows
        .filter((row) => row.state !== "queued")
        .map((row) => (
          <RunRowItem key={row.id} row={row} />
        ))}
    </div>
  );
};
