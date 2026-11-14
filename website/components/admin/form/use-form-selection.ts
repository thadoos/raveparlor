"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { formSelectionQuery, historyUpdate, parseFormSelection } from "@/lib/admin/form-selection";
import type { FormSelection } from "@/lib/admin/form-selection";

/** History-state flag: the previous history entry is the Services list. */
const FROM_LIST = "adminFormFromList";

function entryIsFromList(): boolean {
  const state: unknown = window.history.state;
  return (
    typeof state === "object" && state !== null && FROM_LIST in state && state[FROM_LIST] === true
  );
}

export interface FormSelectionControls {
  selection: FormSelection;
  select: (next: FormSelection) => void;
  /** The phone "‹ Services" link: goes back when the list is the previous entry, else replaces. */
  backToList: () => void;
}

/**
 * The form selection, kept in `?section=&item=` so reloads, links and the back button work. Writes
 * use history.pushState/replaceState, which Next syncs into useSearchParams (and restores on
 * back/forward) without a router navigation, which would refetch the dynamic /admin page.
 */
export function useFormSelection(): FormSelectionControls {
  const params = useSearchParams();
  const selection = useMemo(
    () => parseFormSelection(new URLSearchParams(params.toString())),
    [params],
  );

  const select = useCallback((next: FormSelection) => {
    const prev = parseFormSelection(new URLSearchParams(window.location.search));
    const { mode, fromList } = historyUpdate(prev, next, entryIsFromList());
    if (mode === "none") return;
    const url = `${window.location.pathname}?${formSelectionQuery(next)}`;
    const state = fromList ? { [FROM_LIST]: true } : null;
    if (mode === "push") window.history.pushState(state, "", url);
    else window.history.replaceState(state, "", url);
  }, []);

  const backToList = useCallback(() => {
    if (entryIsFromList()) window.history.back();
    else select({ section: "services" });
  }, [select]);

  return { selection, select, backToList };
}
