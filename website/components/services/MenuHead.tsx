"use client";

import { MENU } from "@/lib/data/services";
import { useServiceCategory } from "./services-context";

/** Title and intro of the active category. */
export function MenuHead() {
  const { category } = useServiceCategory();
  const { name, intro } = MENU[category];
  return (
    <div className="mn-head">
      <h2 className="mn-title" id="mn-title">
        {name}
      </h2>
      <div className="mn-intro" id="mn-intro">
        {intro.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}
