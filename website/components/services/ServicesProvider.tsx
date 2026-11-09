"use client";

import {
  useCallback,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
  type RefCallback,
} from "react";
import type { CategoryKey } from "@/lib/data/services";
import { REDUCED_MOTION_QUERY } from "@/lib/deck/constants";
import { INITIAL_DIALOG_STATE, dialogReducer, type DialogTarget } from "./dialog-state";
import {
  ServiceCategoryContext,
  ServiceDialogContext,
  type ServiceCategoryValue,
  type ServiceDialogValue,
  type SetCategoryOptions,
} from "./services-context";

interface ServicesProviderProps {
  children: ReactNode;
}

interface CategoryState {
  category: CategoryKey;
  animate: boolean;
  token: number;
}

function cardKey(category: CategoryKey, index: number): string {
  return `${category}:${index}`;
}

/**
 * State shared by the services overview, the service menu and the service dialog: which category
 * the menu shows, and the dialog's lifecycle plus a registry of the card elements it expands out of.
 */
export function ServicesProvider({ children }: ServicesProviderProps) {
  const [menu, setMenu] = useState<CategoryState>({ category: "cut", animate: false, token: 0 });
  const [state, dispatch] = useReducer(dialogReducer, INITIAL_DIALOG_STATE);
  const cards = useRef(new Map<string, HTMLElement>());

  const setCategory = useCallback((category: CategoryKey, { animate }: SetCategoryOptions) => {
    setMenu((current) => ({ category, animate, token: current.token + 1 }));
  }, []);

  const open = useCallback((target: DialogTarget) => {
    const animated = !window.matchMedia(REDUCED_MOTION_QUERY).matches;
    dispatch({ type: "open", target, animated });
  }, []);
  const close = useCallback(() => dispatch({ type: "close" }), []);

  const registerCard = useCallback(
    (category: CategoryKey, index: number): RefCallback<HTMLElement> =>
      (element) => {
        const key = cardKey(category, index);
        if (element) cards.current.set(key, element);
        else cards.current.delete(key);
      },
    [],
  );
  const getCard = useCallback(
    (category: CategoryKey, index: number) => cards.current.get(cardKey(category, index)) ?? null,
    [],
  );

  const categoryValue = useMemo<ServiceCategoryValue>(
    () => ({ ...menu, setCategory }),
    [menu, setCategory],
  );
  const dialogValue = useMemo<ServiceDialogValue>(
    () => ({ state, dispatch, open, close, registerCard, getCard }),
    [state, open, close, registerCard, getCard],
  );

  return (
    <ServiceCategoryContext value={categoryValue}>
      <ServiceDialogContext value={dialogValue}>{children}</ServiceDialogContext>
    </ServiceCategoryContext>
  );
}
