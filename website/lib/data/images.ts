/** CSS utility class (`.pos-50-30` in app/styles/utilities.css) that sets `object-position: 50% 30%`. */
export function positionClass(position: string): string {
  return `pos-${position.replace(/%/g, "").trim().split(/\s+/).join("-")}`;
}
