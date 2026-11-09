"use client";

import { createContext } from "react";
import type { DeckController } from "@/lib/deck/controller";

export const DeckContext = createContext<DeckController | null>(null);
