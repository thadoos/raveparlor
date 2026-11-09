"use client";

import { useEffect, useState, type ReactNode } from "react";
import { DeckController } from "@/lib/deck/controller";
import { usePhone } from "@/lib/hooks/use-media";
import { DeckContext } from "./deck-context";

interface DeckProviderProps {
  children: ReactNode;
}

/** Owns the deck controller and shares it with the header and the deck itself. */
export function DeckProvider({ children }: DeckProviderProps) {
  const [controller] = useState(() => new DeckController());
  const phone = usePhone();

  useEffect(() => {
    controller.setPhone(phone);
  }, [controller, phone]);

  return <DeckContext value={controller}>{children}</DeckContext>;
}
