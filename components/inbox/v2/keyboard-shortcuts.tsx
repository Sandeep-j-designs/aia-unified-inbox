import React, { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Slash,
  X,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SheetClose, SheetTitle } from "@/components/ui/sheet";
import {
  SHORTCUTS,
  SHORTCUTS_NOTE,
  detectPlatform,
  type ShortcutPlatform,
  type ShortcutRow,
} from "@/config/pages/inbox/keyboard-shortcuts";
import { cn } from "@/lib/utils";
import { T } from "./ui";

/**
 * The keyboard shortcuts panel — Figma 24496:57272.
 *
 * The body of a right-hand drawer, not a dropdown: at twelve rows it is a
 * reference you read down while working, and a popover that closes on the next
 * click is the wrong container for that. Sizing lives on the sheet; this is
 * everything inside it.
 *
 * 16 padding, 45px rows split down the middle: the action on the left, its keys
 * right-aligned on the right. Key caps are 28px boxes so a one-letter cap and a
 * "Shift" cap sit on the same baseline grid.
 *
 * The platform tab defaults to the one you are on rather than to Windows —
 * reading the wrong column and then reaching for the wrong modifier is the
 * only real failure mode this panel has.
 */

const ARROW_ICONS = {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} as const;

const KeyCap = ({ token }: { token: string }) => {
  const Arrow = ARROW_ICONS[token as keyof typeof ARROW_ICONS];

  return (
    <span
      className={cn(
        // 28px tall, min 28 wide so a single glyph still reads as a key.
        "flex h-7 min-w-7 items-center justify-center rounded-md bg-accent px-2",
        T.cell,
        "text-secondary-foreground"
      )}
    >
      {Arrow ? (
        <Arrow className="h-3 w-3" />
      ) : token === "/" ? (
        <Slash className="h-3 w-3" />
      ) : (
        token
      )}
    </span>
  );
};

const Row = ({ row }: { row: ShortcutRow }) => (
  <div className="flex h-[45px] items-center border-b border-neutral-gray last:border-b-0">
    <span className="flex-1 pr-3 text-sm leading-5 tracking-[-0.16px] text-foreground">
      {row.label}
    </span>
    <span className="flex flex-none items-center gap-2">
      {row.keys.map((group, index) => (
        <React.Fragment key={index}>
          {index > 0 ? (
            <span className="px-0.5 text-xs text-secondary-foreground">/</span>
          ) : null}
          {group.map((token) => (
            <KeyCap key={token} token={token} />
          ))}
        </React.Fragment>
      ))}
    </span>
  </div>
);

const KeyboardShortcuts = () => {
  // Read the platform after mount: navigator does not exist on the server, and
  // guessing during render would mismatch on hydration.
  const [platform, setPlatform] = useState<ShortcutPlatform>("windows");
  useEffect(() => setPlatform(detectPlatform()), []);

  return (
    <div className="flex h-full flex-col p-4">
      <div className="relative flex-none pr-8">
        {/* SheetTitle rather than a bare h2 — Radix names the dialog from it,
            so without it the drawer is unlabelled to a screen reader. */}
        <SheetTitle className="text-base font-semibold leading-[22px] text-foreground">
          Keyboard shortcuts
        </SheetTitle>
        {/* This repo's SheetContent has its close button commented out, so the
            drawer has to bring its own — Esc alone is not an affordance. */}
        <SheetClose
          aria-label="Close"
          className="absolute right-0 top-0 grid h-7 w-7 place-items-center rounded-md text-secondary-foreground hover:bg-section hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </SheetClose>
        <p className="mt-1.5 text-sm leading-5 text-secondary-foreground">
          Navigate and act without leaving the keyboard.
        </p>
      </div>

      <Tabs
        value={platform}
        onValueChange={(value) => setPlatform(value as ShortcutPlatform)}
        className="mt-4 flex-none border-b border-neutral-gray"
      >
        <TabsList className="h-auto gap-2 rounded-none bg-transparent p-0">
          {(
            [
              ["windows", "Windows"],
              ["mac", "Mac"],
            ] as const
          ).map(([value, label]) => (
            <TabsTrigger
              key={value}
              value={value}
              className="rounded-none border-b-2 border-transparent px-4 py-1.5 text-sm text-secondary-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {SHORTCUTS[platform].map((row) => (
          <Row key={row.id} row={row} />
        ))}

        <p className="py-4 text-xs leading-4 tracking-[-0.12px] text-secondary-foreground opacity-75">
          {SHORTCUTS_NOTE}
        </p>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;
