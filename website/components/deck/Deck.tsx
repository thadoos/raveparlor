"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { DECK_ID } from "@/lib/deck/constants";
import { useDeck } from "./use-deck";

interface DeckProps {
  children: ReactNode;
}

/** The full-screen deck element. Slides arrive as server-rendered `children`. */
export function Deck({ children }: DeckProps) {
  const controller = useDeck();
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const deck = ref.current;
    if (!deck) return;
    controller.mount(deck);
    return () => controller.destroy();
  }, [controller]);

  return (
    <main className="deck" id={DECK_ID} ref={ref} tabIndex={-1}>
      {children}
    </main>
  );
}
