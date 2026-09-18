import React from "react";
import { CircleCheck, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RunCount, RunRowList } from "@/components/inbox/v2/progress-run";
import type { RunRow } from "@/components/inbox/v2/progress-run";
import { cn } from "@/lib/utils";
import type {
  SyncDoc,
  SyncModule,
  SyncModuleProgress,
} from "@/types/pages/inbox/sync";

type SyncProgressModalProps = {
  open: boolean;
  docs: SyncDoc[];
  settledCount: number;
  /** The modules this run is sending, in send order. */
  modules: SyncModule[];
  moduleProgress: SyncModuleProgress[];
  onStop: () => void;
  onContinueInBackground: () => void;
};

/**
 * "Syncing to Tally" — the run, while it is watchable.
 *
 * Two shapes, and which one you get is decided by how many modules the run
 * carries:
 *
 *   one module    a per-document list — "B-2026-002", "B-2026-003" — because
 *                 with a single noun in play the document IS the unit of
 *                 progress, and naming each one is what makes the count
 *                 trustworthy.
 *   two or more   a per-module rollup. A mixed list would be a stream of
 *                 voucher numbers from different modules with nothing saying
 *                 which was which, so the detail stops being detail.
 *
 * Deliberately not dismissable by Escape or a backdrop click. The two ways out
 * are the two buttons, and they mean different things: Stop Sync abandons the
 * rest of the queue, Continue in Background keeps it running. Letting the
 * overlay close the modal would make an accidental click ambiguous between
 * them.
 *
 * Built from Figma 21448:25930 (single module) and 25082:18536 (multi-module).
 */

const ModuleRow = ({ module }: { module: SyncModuleProgress }) => {
  const percent =
    module.total === 0 ? 0 : (module.settled / module.total) * 100;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2",
        // The active module is marked the same way the active document is in
        // the single-module list — one idea, drawn once.
        module.state === "active" && "border-l-2 border-l-primary bg-accent"
      )}
    >
      <span className="flex h-5 w-5 flex-none items-center justify-center">
        {module.state === "done" ? (
          <CircleCheck className="h-5 w-5 text-status-success" />
        ) : module.state === "active" ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : (
          <span className="h-4 w-4 rounded-full border-2 border-neutral-gray" />
        )}
      </span>

      <span className="flex-1 truncate text-sm font-medium text-foreground">
        {module.label}
      </span>

      <span className="flex-none text-sm tabular-nums text-secondary-foreground">
        {module.settled} / {module.total}
      </span>

      <span className="h-1 w-[120px] flex-none overflow-hidden rounded-full bg-section">
        <span
          className={cn(
            "block h-full rounded-full transition-[width] duration-300",
            module.state === "done" ? "bg-status-success" : "bg-primary"
          )}
          style={{ width: `${percent}%` }}
        />
      </span>
    </div>
  );
};

/** The run list speaks in row states; a doc's own vocabulary maps onto them. */
const docRow = (doc: SyncDoc): RunRow => ({
  id: doc.id,
  label: doc.label,
  state:
    doc.state === "pushed"
      ? "done"
      : doc.state === "failed"
        ? "failed"
        : doc.state === "pushing"
          ? "active"
          : "queued",
});

const SyncProgressModal = ({
  open,
  docs,
  settledCount,
  modules,
  moduleProgress,
  onStop,
  onContinueInBackground,
}: SyncProgressModalProps) => {
  const total = docs.length;
  const isMulti = modules.length > 1;
  const unit = isMulti
    ? "items"
    : total === 1
      ? (modules[0]?.unit ?? "item")
      : (modules[0]?.unitPlural ?? "items");

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-[520px] gap-0 p-0 [&>button]:hidden"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <div className="flex items-center justify-between border-b border-neutral-gray px-5 py-4">
          <DialogTitle className="text-lg">Syncing to Tally</DialogTitle>
          <span className="flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Syncing
          </span>
        </div>

        <div className="space-y-4 px-5 py-4">
          <RunCount settled={settledCount} total={total} unit={unit} />

          {isMulti ? (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary-foreground">
                Progress by module
              </p>
              <div className="space-y-1">
                {moduleProgress.map((module) => (
                  <ModuleRow key={module.key} module={module} />
                ))}
              </div>
            </div>
          ) : (
            <RunRowList rows={docs.map(docRow)} settled={settledCount} />
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-neutral-gray px-5 py-3.5">
          <Button variant="outline" size="sm" onClick={onStop}>
            Stop Sync
          </Button>
          <Button size="sm" onClick={onContinueInBackground}>
            Continue in Background
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SyncProgressModal;
