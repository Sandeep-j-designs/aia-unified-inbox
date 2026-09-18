import "@/styles/globals.css";
import type { AppProps } from "next/app";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";

const open_sans = localFont({
  src: "../public/fonts/open-sans-latin.woff2",
  weight: "300 800",
  display: "swap",
});

/**
 * PROTOTYPE STUB — mirrors pages/_app.tsx in aiaccountant-app.
 *
 * Production additionally mounts SessionProvider, QueryClientProvider,
 * EnvProvider, GuideProvider and the app-effects (AuthEffects, SetupGuard,
 * AppConfigPoller, AblyNotifications, UserCompaniesSync, BillingAccessGuard)
 * plus the global BulkUpload modal. None of those are needed to render a
 * screen, so they are omitted here.
 *
 * On handoff this file is DISCARDED — the real _app.tsx already provides the
 * font wrapper and the Toaster.
 */
export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${open_sans.className}`}>
      <style jsx global>{`
        :root {
          --font-family-primary:
            ${open_sans.style.fontFamily}, system-ui, sans-serif;
        }
      `}</style>
      <Component {...pageProps} />
      <Toaster position="bottom-center" closeButton />
    </div>
  );
}
