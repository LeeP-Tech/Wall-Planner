import type { WallConfig, ItemDef, HoleResult, LayoutResult } from './types';

/**
 * Round to 1 decimal place for display purposes.
 */
export const round1 = (n: number): number => Math.round(n * 10) / 10;

/**
 * Calculate the layout and all drill-hole positions for the given wall and items.
 */
export function calculateLayout(wall: WallConfig, items: ItemDef[]): LayoutResult {
  if (items.length === 0) {
    return {
      holes: [],
      itemStartPositions: [],
      totalSpan: 0,
      startX: wall.alignment === 'centered' ? wall.width / 2 : wall.startOffset,
      overflow: false,
    };
  }

  // Build gaps: gap[i] is the space before items[i]
  // First item has no left gap (gap[0] = 0 for position accumulation)
  const gaps: number[] = items.map((item, i) => {
    if (i === 0) return 0;
    return item.gutterBefore !== undefined ? item.gutterBefore : wall.defaultGutter;
  });

  const totalSpan =
    items.reduce((sum, item) => sum + item.width, 0) +
    gaps.reduce((sum, g) => sum + g, 0);

  const startX =
    wall.alignment === 'centered'
      ? (wall.width - totalSpan) / 2
      : wall.startOffset;

  const itemStartPositions: number[] = [];
  const holes: HoleResult[] = [];

  let cursor = startX;
  for (let i = 0; i < items.length; i++) {
    if (i > 0) cursor += gaps[i];

    const item = items[i];
    itemStartPositions.push(cursor);

    const itemCentreX = cursor + item.width / 2;

    for (let k = 0; k < item.holeCount; k++) {
      // Distribute holes symmetrically around itemCentreX + holeOffset
      // k=0 is leftmost, k=holeCount-1 is rightmost
      const holeX =
        itemCentreX +
        item.holeOffset +
        (k - (item.holeCount - 1) / 2) * item.holeSpacing;

      holes.push({
        itemId: item.id,
        itemName: item.name,
        holeIndex: k,
        fromLeft: round1(holeX),
        fromRight: round1(wall.width - holeX),
        fromCenter: round1(holeX - wall.width / 2),
        distToNextHole:
          item.holeCount > 1 && k < item.holeCount - 1
            ? item.holeSpacing
            : undefined,
      });
    }

    cursor += item.width;
  }

  return {
    holes,
    itemStartPositions,
    totalSpan,
    startX,
    overflow: startX < 0 || startX + totalSpan > wall.width,
  };
}
