"use client";

import { createContext, useContext } from "react";
import type { SiteView } from "@/lib/content/view";

export const SiteViewContext = createContext<SiteView | null>(null);

/** The site content the page renders. Throws outside `SiteViewProvider`. */
export function useSiteView(): SiteView {
  const value = useContext(SiteViewContext);
  if (!value) throw new Error("useSiteView must be used inside <SiteViewProvider>.");
  return value;
}
