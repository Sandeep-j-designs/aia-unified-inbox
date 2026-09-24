import React from "react";
import { ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

/**
 * A heading inside a grouped dropdown: small, muted, and on the items' own
 * left edge. The production CommandGroup leaves its heading unstyled, which
 * made headings the largest text in the list and flush against the border.
 */
export const GROUP_CLASS =
  "p-0 [&:not(:first-child)]:mt-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-1 [&_[cmdk-group-heading]]:text-caption-1 [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-secondary-foreground";

/** Inline single-select, matching the component-library's searchable dropdown. */
export default function EditableCell({
  label,
  value,
  options,
  groups,
  editable,
  onChange,
  open,
  onOpenChange,
  onClosed,
}: {
  label: string;
  value: string;
  options: readonly string[];
  /**
   * Show the options under headings instead of as one list. `options` is
   * still what the cell accepts; the groups only lay the list out.
   */
  groups?: { heading: string; options: readonly string[] }[];
  editable: boolean;
  onChange: (value: string) => boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Where focus should go when this closes. Given one, the trigger does not
   * take focus back: this cell sits inside a grid that owns the arrow keys and
   * stops key events reaching it from within, so focus parked on the trigger
   * is focus the grid cannot navigate from.
   */
  onClosed?: () => void;
}) {
  if (!editable)
    return (
      <div className="truncate" title={value}>
        {value || "—"}
      </div>
    );
  const choices = [...new Set([value, ...options].filter(Boolean))];
  const renderChoice = (choice: string) => (
    <CommandItem
      key={choice}
      value={choice}
      title={choice}
      className="h-7 cursor-pointer rounded-md px-2 py-1 text-sm leading-5 tracking-[-0.16px]"
      onSelect={() => {
        if (choice === value || onChange(choice)) onOpenChange(false);
      }}
    >
      <span className="truncate">{choice}</span>
    </CommandItem>
  );
  return (
    <div
      className="min-w-0"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`Edit ${label}`}
            aria-expanded={open}
            className={cn(
              // The ring is inset because the cell that holds this button
              // clips: the td and the 49px box inside it are both
              // overflow-hidden, and the button is w-full, so an outset ring
              // has nowhere to go sideways. It came out as a box missing its
              // left and right edges — top and bottom strokes with four corner
              // arcs and two gaps where the sides should be. Inset also
              // matches the grid cursor, which rings the cell the same way.
              "flex h-8 w-full min-w-0 items-center justify-between gap-2 rounded-md px-1 text-left text-xs font-normal hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
              open && "bg-accent/60 ring-1 ring-inset ring-ring"
            )}
            title={value || `Select ${label}`}
          >
            <span
              className={cn(
                "min-w-0 truncate",
                !value && "text-secondary-foreground"
              )}
            >
              {value || "Select…"}
            </span>
            <ChevronDown
              aria-hidden
              className="h-3 w-3 shrink-0 text-secondary-foreground"
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={4}
          className="w-[249px] max-w-[calc(100vw-24px)] overflow-hidden rounded-lg border-neutral-gray p-0 shadow-lg"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          onCloseAutoFocus={(event) => {
            if (!onClosed) return;
            // Radix's own restore would put focus on the trigger. Taking the
            // default lets the caller decide where the cursor carries on from.
            event.preventDefault();
            onClosed();
          }}
        >
          <Command className="rounded-lg bg-background">
            <CommandInput
              aria-label={`Search ${label}`}
              placeholder="Search..."
              className="h-8 py-1.5 text-xs leading-4 tracking-[-0.12px]"
              wrapperClassName="border-neutral-gray px-4 pb-1 pt-3 [&>svg]:h-3 [&>svg]:w-3"
            />
            <CommandList
              aria-label={`${label} options`}
              className="max-h-[208px] px-2 pb-3 pt-2 [&_[cmdk-list-sizer]]:space-y-3"
            >
              <CommandEmpty className="px-2 py-4 text-xs text-secondary-foreground">
                No matching options.
              </CommandEmpty>
              {groups
                ? groups.map((group) => (
                    <CommandGroup
                      key={group.heading}
                      heading={group.heading}
                      className={GROUP_CLASS}
                    >
                      {group.options.map(renderChoice)}
                    </CommandGroup>
                  ))
                : choices.map(renderChoice)}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
