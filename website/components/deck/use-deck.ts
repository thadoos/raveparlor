"use client";

import { useContext } from "react";
import type { DeckController } from "@/lib/deck/controller";
import { DeckContext } from "./deck-context";

/** The deck controller. Throws outside `DeckProvider`. */
export function useDeck(): DeckController {
  const controller = useContext(DeckContext);
  if (!controller) throw new Error("useDeck must be used inside <DeckProvider>.");
  return controller;
}
