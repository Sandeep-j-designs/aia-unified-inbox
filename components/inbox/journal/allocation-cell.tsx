import React, { useState } from "react";
import { Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  COST_CENTRES,
  COST_CENTRE_CLASSES,
  costCentreClassByName,
} from "@/config/pages/inbox/journal-masters";

/**
 * The Allocation column.
 *
 * Ported from Prototypes/Journals (components/journal-voucher/common/
 * allocation-cell). One change: the Inbox's `Form` holds display strings
 * rather than master ids — `gst` is a branch name, `ledger` is a ledger name —
 * so the cost centre is stored and matched by name for the same reason.
 *
 * A line only offers an allocation once it carries a figure. There is nothing
 * to allocate before that, so an unfilled line shows a dash — the rule the
 * frames draw, where the 35,000 line offers "Cost Centre +" and the blank line
 * beside it shows "-".
 *
 * The pill is a control, not a badge: the accent-on-accent treatment the design
 * system already uses for an inline action inside a table cell.
 */

type Props = {
  /** The line's current allocation, as a cost centre name. */
  value: string;
  hasAmount: boolean;
  /** The voucher's cost centre class, by name. Narrows what is on offer. */
  costClass: string;
  readOnly?: boolean;
  onChange: (costCentre: string) => void;
};

const AllocationCell = ({
  value,
  hasAmount,
  costClass,
  readOnly,
  onChange,
}: Props) => {
  const [open, setOpen] = useState(false);

  if (!hasAmount)
    return (
      <span
        className="text-sm text-secondary-foreground"
        aria-label="No allocation"
      >
        -
      </span>
    );

  // A read-only voucher still has to say what it was allocated to; it just has
  // no picker behind it.
  if (readOnly)
    return (
      <span className="text-sm text-foreground">
        {value || <span className="text-secondary-foreground">-</span>}
      </span>
    );

  // A chosen class narrows what the line may be allocated to; with no class on
  // the voucher, every centre is on offer.
  const klass = costCentreClassByName(costClass);
  const options = klass
    ? COST_CENTRES.filter((centre) => centre.classId === klass.id)
    : COST_CENTRES;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm",
            "bg-accent text-accent-foreground hover:bg-muted"
          )}
        >
          {value || "Cost Centre"}
          {value ? null : <Plus className="h-3.5 w-3.5" />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1">
        {options.map((centre) => (
          <button
            key={centre.id}
            type="button"
            className={cn(
              "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm",
              "hover:bg-accent",
              centre.name === value && "bg-muted"
            )}
            onClick={() => {
              onChange(centre.name);
              setOpen(false);
            }}
          >
            {centre.name}
            <span className="text-xs text-secondary-foreground">
              {
                COST_CENTRE_CLASSES.find((k) => k.id === centre.classId)?.name
              }
            </span>
          </button>
        ))}
        {value ? (
          <button
            type="button"
            className="w-full rounded-sm px-2 py-1.5 text-left text-sm text-danger-action hover:bg-accent"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            Clear allocation
          </button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
};

export default AllocationCell;
