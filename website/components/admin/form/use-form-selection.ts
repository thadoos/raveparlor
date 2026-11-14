"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { formSelectionQuery, parseFormSelection } from "@/lib/admin/form-selection";
import type { FormSelection } from "@/lib/admin/form-selection";

/**
 * The form selection, kept in `?section=&item=` so reloads and links keep it. Updates use
 * history.replaceState, which Next syncs into useSearchParams: no history entry per click, and no
 * router navigation (that would refetch the dynamic /admin page on every selection).
 */
export function useFormSelection(): [FormSelection, (next: FormSelection) => void] {
  const params = useSearchParams();
  const selection = useMemo(
    () => parseFormSelection(new URLSearchParams(params.toString())),
    [params],
  );

  const select = useCallback((next: FormSelection) => {
    const query = formSelectionQuery(next);
    if (window.location.search === `?${query}`) return;
    window.history.replaceState(null, "", `${window.location.pathname}?${query}`);
  }, []);

  return [selection, select];
}
