/**
 * Whether a full-screen overlay (the nav menu or a modal) is open, in which case the deck must
 * not react to wheel, touch or keys. For now this reads the classes mirrored onto `<html>`.
 */
export function isOverlayOpen(): boolean {
  const classes = document.documentElement.classList;
  return classes.contains("menu-open") || classes.contains("modal-open");
}
