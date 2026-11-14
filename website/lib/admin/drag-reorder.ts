/**
 * Geometry for drag-to-reorder lists. Pure: the component measures row heights when a drag starts
 * and keeps the DOM order fixed, showing the preview with these offsets as translateY.
 */

/**
 * Where the dragged row would land. Moving down, it passes a row once its bottom edge crosses
 * that row's middle; moving up, once its top edge does. Clamped to the list.
 */
export function dragTargetIndex(startIndex: number, deltaY: number, rowHeights: number[]): number {
  const tops: number[] = [];
  let y = 0;
  for (const height of rowHeights) {
    tops.push(y);
    y += height;
  }
  const middle = (i: number) => tops[i] + rowHeights[i] / 2;
  const top = tops[startIndex] + deltaY;
  const bottom = top + rowHeights[startIndex];

  let index = startIndex;
  while (index < rowHeights.length - 1 && bottom > middle(index + 1)) index++;
  while (index > 0 && top < middle(index - 1)) index--;
  return index;
}

/** translateY per row: the dragged row follows the pointer, the rows it passed make room. */
export function dragOffsets(
  startIndex: number,
  toIndex: number,
  deltaY: number,
  rowHeights: number[],
): number[] {
  const shift = rowHeights[startIndex];
  return rowHeights.map((_, i) => {
    if (i === startIndex) return deltaY;
    if (startIndex < toIndex && i > startIndex && i <= toIndex) return -shift;
    if (toIndex < startIndex && i >= toIndex && i < startIndex) return shift;
    return 0;
  });
}
