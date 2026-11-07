"use client";

import { useEffect } from "react";
import { initSiteBehavior } from "@/lib/site-behavior";

/** Wires up the deck, menu, service panel and reveal effects on the server-rendered markup. */
export function SiteBehavior() {
  useEffect(() => initSiteBehavior(), []);
  return null;
}
