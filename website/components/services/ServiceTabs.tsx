"use client";

import { useRef, type KeyboardEvent } from "react";
import { CATEGORY_ORDER, MENU, adjacentCategory, type CategoryKey } from "@/lib/data/services";
import { useServiceCategory } from "./services-context";

/**
 * The category tabs. Roving tabindex: only the active tab is in the tab order, and ArrowLeft /
 * ArrowRight move to (and activate) the previous / next tab, wrapping around.
 */
export function ServiceTabs() {
  const { category, setCategory } = useServiceCategory();
  const tabs = useRef(new Map<CategoryKey, HTMLButtonElement>());

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = adjacentCategory(category, e.key === "ArrowRight" ? 1 : -1);
    setCategory(next, { animate: true });
    tabs.current.get(next)?.focus();
  }

  return (
    <div
      className="mn-tabs"
      role="tablist"
      aria-label="Service categories"
      data-deck-ignore
      onKeyDown={onKeyDown}
    >
      {CATEGORY_ORDER.map((key) => {
        const selected = key === category;
        return (
          <button
            key={key}
            ref={(element) => {
              if (element) tabs.current.set(key, element);
              return () => {
                tabs.current.delete(key);
              };
            }}
            className="mn-tab"
            role="tab"
            type="button"
            id={`mn-tab-${key}`}
            data-cat={key}
            aria-selected={selected}
            aria-controls="mn-grid"
            tabIndex={selected ? 0 : -1}
            onClick={() => setCategory(key, { animate: true })}
          >
            {MENU[key].name}
          </button>
        );
      })}
    </div>
  );
}
