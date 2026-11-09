export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * A CSS transform that makes an element laid out at `to` look like it sits at `from`
 * (translate + scale, for use with `transform-origin: 0 0`).
 */
export function rectTransform(from: Box, to: Box): string {
  const dx = from.left - to.left;
  const dy = from.top - to.top;
  const sx = from.width / to.width;
  const sy = from.height / to.height;
  return `translate(${dx}px,${dy}px) scale(${sx},${sy})`;
}
