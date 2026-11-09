"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

interface NavMenuValue {
  open: boolean;
  /** `viaKeyboard` moves focus to the first menu link when this opens the menu. */
  toggle: (viaKeyboard: boolean) => void;
  close: () => void;
  burgerRef: RefObject<HTMLButtonElement | null>;
  menuRef: RefObject<HTMLDivElement | null>;
}

interface MenuProviderProps {
  children: ReactNode;
}

const NavMenuContext = createContext<NavMenuValue | null>(null);

/** Open/closed state of the full-screen menu, shared by the header (burger) and the menu. */
export function MenuProvider({ children }: MenuProviderProps) {
  const [open, setOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const focusOnOpen = useRef(false);

  const toggle = useCallback((viaKeyboard: boolean) => {
    focusOnOpen.current = viaKeyboard;
    setOpen((current) => !current);
  }, []);
  const close = useCallback(() => setOpen(false), []);

  // mirrored onto <html> for lib/deck/overlay.ts (the deck stands down while the menu is open)
  useEffect(() => {
    document.documentElement.classList.toggle("menu-open", open);
    if (open && focusOnOpen.current) {
      menuRef.current?.querySelector("a")?.focus({ preventScroll: true });
    }
    focusOnOpen.current = false;
  }, [open]);
  useEffect(() => () => document.documentElement.classList.remove("menu-open"), []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setOpen(false);
      burgerRef.current?.focus();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const value = useMemo(() => ({ open, toggle, close, burgerRef, menuRef }), [open, toggle, close]);
  return <NavMenuContext value={value}>{children}</NavMenuContext>;
}

/** The nav menu state. Throws outside `MenuProvider`. */
export function useNavMenu(): NavMenuValue {
  const value = useContext(NavMenuContext);
  if (!value) throw new Error("useNavMenu must be used inside <MenuProvider>.");
  return value;
}
