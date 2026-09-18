import React from "react";
import { RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TallyConnection } from "@/types/pages/inbox/sync";

type SyncChromeButtonProps = {
  onClick: () => void;
  isSyncing: boolean;
  connection: TallyConnection;
};

/**
 * Sync, as it sits in the app bar.
 *
 * Moved out of the page header because syncing is not a property of whichever
 * screen you happen to be on — one Tally connection, one queue, one company.
 * In the page header it read as "sync this list"; up here it reads as what it
 * is, and it stops disappearing when you open a document.
 *
 * Styled off the company chip rather than the Button component: `variant`
 * outline is drawn for a light page and goes to dark-on-dark against the bar.
 * Filled chip, so it pairs with the company switcher beside it and still reads
 * as a control next to the ghost Guide and What's-new buttons.
 */
const SyncChromeButton = ({
  onClick,
  isSyncing,
  connection,
}: SyncChromeButtonProps) => {
  const status = isSyncing
    ? "syncing"
    : connection === "offline"
      ? "offline"
      : "connected";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        status === "syncing"
          ? "Syncing to Tally"
          : status === "offline"
            ? "Sync — Tally not connected"
            : "Sync to Tally"
      }
      title={
        status === "syncing"
          ? "Syncing to Tally"
          : status === "offline"
            ? "Tally not connected"
            : "Sync to Tally"
      }
      className={cn(
        "relative flex h-8 flex-none items-center gap-1.5 rounded-md px-2.5 text-label-2",
        "border border-surface-stroke bg-surface-muted text-topnav-text transition-colors hover:bg-surface-muted hover:border-topnav-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      )}
    >
      <RefreshCcw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
      <span className="hidden sm:inline">Sync</span>

      {/* Whether Tally is reachable decides whether pressing this does
          anything, so the dot rides on the button. The ring is the BAR's
          colour, not the page's — it is punching a hole in dark chrome. */}
      <span
        aria-hidden
        className={cn(
          "absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full ring-2 ring-surface",
          status === "connected" && "bg-status-success",
          status === "offline" && "bg-status-error",
          status === "syncing" && "animate-pulse bg-status-warning"
        )}
      />
    </button>
  );
};

export default SyncChromeButton;
