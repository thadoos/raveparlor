"use client";

import type { ReactNode } from "react";
import type { SiteView } from "@/lib/content/view";
import { SiteViewContext } from "./site-view-context";

interface SiteViewProviderProps {
  view: SiteView;
  children: ReactNode;
}

/** Makes the site view available to the client components below it. */
export function SiteViewProvider({ view, children }: SiteViewProviderProps) {
  return <SiteViewContext value={view}>{children}</SiteViewContext>;
}
