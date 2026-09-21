import React from "react";
import { MonitorPlay } from "lucide-react";

/**
 * The standing reminder that the screen is being narrated.
 *
 * It sits over the top bar rather than inside it: guide mode is a state of the
 * session, not of the page, and the bar belongs to whatever route is open. The
 * pill is inert — the way out is Skip tour on the step card, so this never
 * competes with it for the click.
 */
const GuideBanner = () => (
  <div
    role="status"
    className="pointer-events-none fixed left-1/2 top-2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-md border border-panel-border bg-background px-4 py-2 text-label-2 font-medium text-foreground shadow-floating-panel"
  >
    <MonitorPlay className="h-4 w-4 flex-none text-primary" aria-hidden />
    You are in Guide Mode
  </div>
);

export default GuideBanner;
