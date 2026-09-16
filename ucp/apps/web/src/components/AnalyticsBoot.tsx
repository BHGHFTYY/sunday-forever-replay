"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { consoleProvider, dataLayerProvider, initAnalytics, registerProvider, track } from "@ucp/core";
import type { Locale } from "@ucp/core";

/**
 * Wires the analytics bus to its providers, once, on the client.
 *
 * Which vendors are active is decided here and nowhere else — components
 * call `track()` against a typed event union and never touch a vendor SDK.
 * Adding Amplitude, or running two vendors during a migration, is an edit
 * to this file alone (brief §33).
 */
export function AnalyticsBoot({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  useEffect(() => {
    registerProvider(dataLayerProvider());
    if (process.env.NODE_ENV !== "production") registerProvider(consoleProvider);
    void initAnalytics();
  }, []);

  useEffect(() => {
    track({ name: "page_view", path: pathname, locale });
  }, [pathname, locale]);

  return null;
}
