import type { ReactNode } from "react";
import "@/styles/globals.css";

/**
 * Root layout.
 *
 * Deliberately thin: `lang` and `dir` depend on the locale segment, so the
 * real <html> attributes are set in `[locale]/layout.tsx`. This exists
 * only to satisfy Next's requirement for a root layout and to load the
 * stylesheet once.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
