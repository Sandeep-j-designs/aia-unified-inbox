import React from "react";
import { Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Journey, JourneyArt, JourneyId } from "@/types/pages/guide";

type Props = {
  open: boolean;
  journeys: Journey[];
  completed: JourneyId[];
  onClose: () => void;
  onStart: (id: JourneyId) => void;
};

/**
 * The card thumbnail — a wireframe of the screen the journey visits.
 *
 * It is deliberately abstract. A screenshot would date the moment either
 * screen changed, and this only has to say "a list", "a ledger", "a form" at
 * a glance. Bars are the two greys the design system already uses for a
 * skeleton, with the brand tint marking the region the journey is about.
 */
const Art = ({ kind }: { kind: JourneyArt }) => {
  const bar = "rounded-sm bg-neutral-gray";
  const tint = "rounded-sm bg-secondary";

  return (
    <div
      aria-hidden
      className="flex h-[110px] w-full flex-col gap-1.5 rounded-md border border-panel-border bg-section p-3"
    >
      {kind === "list" && (
        <>
          <div className={cn(tint, "h-5 w-2/3")} />
          <div className={cn(bar, "h-2 w-full")} />
          <div className={cn(bar, "h-2 w-full")} />
          <div className={cn(bar, "h-2 w-4/5")} />
          <div className="mt-auto flex gap-1.5">
            <div className={cn(tint, "h-2.5 w-10")} />
            <div className={cn(bar, "h-2.5 w-14")} />
          </div>
        </>
      )}
      {kind === "ledger" && (
        <>
          <div className="flex gap-1.5">
            <div className={cn(tint, "h-3 w-12")} />
            <div className={cn(tint, "h-3 w-10")} />
            <div className={cn(bar, "h-3 w-12")} />
          </div>
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className={cn(bar, "h-2 w-full")} />
          ))}
        </>
      )}
      {kind === "form" && (
        <div className="flex h-full gap-1.5">
          <div className={cn(tint, "h-full w-6")} />
          <div className="flex flex-1 flex-col gap-1.5">
            <div className={cn(bar, "h-3 w-full")} />
            <div className={cn(tint, "h-2 w-2/3")} />
            <div className={cn(bar, "h-2 w-full")} />
            <div className={cn(bar, "h-2 w-1/2")} />
          </div>
          <div className={cn(tint, "h-full w-4")} />
        </div>
      )}
      {kind === "upload" && (
        <>
          <div className={cn(bar, "h-3 w-1/3")} />
          <div className="flex flex-1 items-center justify-center rounded-sm border border-dashed border-border">
            <div className={cn(tint, "h-5 w-16")} />
          </div>
        </>
      )}
      {kind === "inbox" && (
        <>
          <div className="flex gap-1.5">
            <div className={cn(tint, "h-2.5 w-10")} />
            <div className={cn(bar, "h-2.5 w-8")} />
            <div className={cn(bar, "h-2.5 w-8")} />
          </div>
          <div className="flex flex-1 gap-1.5">
            <div className="flex flex-1 flex-col gap-1.5">
              <div className={cn(bar, "h-2 w-full")} />
              <div className={cn(tint, "h-2 w-5/6")} />
              <div className={cn(bar, "h-2 w-full")} />
              <div className={cn(bar, "h-2 w-3/4")} />
            </div>
            <div className={cn(bar, "h-full w-8")} />
          </div>
        </>
      )}
    </div>
  );
};

/**
 * The Guide launcher.
 *
 * Every journey is offered at once rather than one being pushed: an account
 * that has finished all of them still opens this to replay one, which is why
 * the heading reads as progress and not as an instruction. A finished journey
 * keeps its Start button — the tick reports state, it does not lock the card.
 */
const JourneysDialog = ({
  open,
  journeys,
  completed,
  onClose,
  onStart,
}: Props) => {
  const done = journeys.filter((j) => completed.includes(j.id)).length;
  const all = done === journeys.length;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-[1000px] overflow-y-auto rounded-lg border-neutral-gray p-7">
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="text-h5 font-medium text-foreground">
            {all ? "Nicely done!" : "Learn AI Accountant"}
          </DialogTitle>
          <DialogDescription className="pt-1 text-sm text-secondary-foreground">
            {done} of {journeys.length} journeys done.{" "}
            {all
              ? "You've completed all journeys."
              : "Pick one and we'll walk you through it."}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {journeys.map((journey) => {
            const Icon = journey.icon;
            const finished = completed.includes(journey.id);
            const scripted = journey.steps.length > 0;

            return (
              <article
                key={journey.id}
                className="flex flex-col gap-3 rounded-lg border border-panel-border p-3"
              >
                <div className="relative">
                  <Art kind={journey.art} />
                  {finished && (
                    <span className="absolute inset-0 grid place-items-center">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-success-green-foreground">
                        <Check
                          className="h-4 w-4 text-background"
                          aria-hidden
                        />
                      </span>
                      <span className="sr-only">Completed</span>
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="flex items-center gap-1.5 text-label-1 font-semibold text-foreground">
                    <Icon
                      className="h-4 w-4 flex-none text-primary"
                      aria-hidden
                    />
                    {journey.title}
                  </h3>
                  <p className="text-sm leading-5 text-secondary-foreground">
                    {journey.description}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  className="mt-auto w-full"
                  disabled={!scripted}
                  // A journey with no script in this prototype says so on the
                  // control rather than by vanishing from the grid.
                  title={scripted ? undefined : "Not in this prototype"}
                  onClick={() => onStart(journey.id)}
                >
                  {finished ? "Replay" : "Start"}
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Button>
              </article>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JourneysDialog;
