"use client";

import { createContext, useContext, type Dispatch, type RefCallback } from "react";
import type { CategoryKey } from "@/lib/data/services";
import type { DialogAction, DialogState, DialogTarget } from "./dialog-state";

export interface SetCategoryOptions {
  /** Play the cards' entrance animation (tab clicks and arrows), or swap them silently. */
  animate: boolean;
}

export interface ServiceCategoryValue {
  category: CategoryKey;
  /** Whether the current cards play their entrance animation. */
  animate: boolean;
  /** Changes on every `setCategory` (even for the same category), so the cards render fresh. */
  token: number;
  setCategory: (category: CategoryKey, options: SetCategoryOptions) => void;
}

export interface ServiceDialogValue {
  state: DialogState;
  dispatch: Dispatch<DialogAction>;
  /** Opens the dialog for a service; ignored while the dialog is open or animating. */
  open: (target: DialogTarget) => void;
  /** Starts the close sequence; ignored unless the dialog is fully open. */
  close: () => void;
  /** Ref callback for a service card: the dialog expands out of it and gives it back focus. */
  registerCard: (category: CategoryKey, index: number) => RefCallback<HTMLElement>;
  getCard: (category: CategoryKey, index: number) => HTMLElement | null;
}

export const ServiceCategoryContext = createContext<ServiceCategoryValue | null>(null);
export const ServiceDialogContext = createContext<ServiceDialogValue | null>(null);

/** The active service category. Throws outside `ServicesProvider`. */
export function useServiceCategory(): ServiceCategoryValue {
  const value = useContext(ServiceCategoryContext);
  if (!value) throw new Error("useServiceCategory must be used inside <ServicesProvider>.");
  return value;
}

/** The service dialog controller. Throws outside `ServicesProvider`. */
export function useServiceDialog(): ServiceDialogValue {
  const value = useContext(ServiceDialogContext);
  if (!value) throw new Error("useServiceDialog must be used inside <ServicesProvider>.");
  return value;
}
