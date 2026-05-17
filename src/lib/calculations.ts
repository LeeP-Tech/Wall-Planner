import type {
  Connector,
  HoleResult,
  ItemDef,
  ItemPosition,
  LayoutMode,
  LayoutResult,
  WallConfig,
  WallDef,
} from './types';

/**
 * Round to 1 decimal place for display purposes.
 */
export const round1 = (n: number): number => Math.round(n * 10) / 10;

const getHoleClusterY = (item: ItemDef): number => {
  const offset = item.holeVerticalOffset ?? 0;
  return item.height / 2 - offset;
};

const buildHoleResults = (
  wall: WallConfig,
  item: ItemDef,
  itemX: number,
  itemY: number,
): HoleResult[] => {
  const holes: HoleResult[] = [];
  const itemCentreX = itemX + item.width / 2;
  const holeY = itemY + getHoleClusterY(item);

  for (let k = 0; k < item.holeCount; k++) {
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
      fromTop: round1(holeY),
      fromBottom: round1(wall.height - holeY),
      fromCenter: round1(holeX - wall.width / 2),
      fromVerticalCenter: round1(holeY - wall.height / 2),
      distToNextHole:
        item.holeCount > 1 && k < item.holeCount - 1
          ? round1(item.holeSpacing)
          : undefined,
    });
  }

  return holes;
};

const mapPositions = (
  items: ItemDef[],
  positionMap: Map<string, { x: number; y: number }>,
): ItemPosition[] =>
  items.map((item) => {
    const p = positionMap.get(item.id);
    return {
      itemId: item.id,
      x: p?.x ?? 0,
      y: p?.y ?? 0,
    };
  });

const calculateLinearLayout = (wall: WallConfig, items: ItemDef[]): LayoutResult => {
  const byRow = new Map<number, ItemDef[]>();
  for (const item of items) {
    const row = Math.max(0, Math.floor(item.row || 0));
    if (!byRow.has(row)) byRow.set(row, []);
    byRow.get(row)!.push(item);
  }

  const sortedRows = [...byRow.keys()].sort((a, b) => a - b);
  const positionMap = new Map<string, { x: number; y: number }>();
  const holes: HoleResult[] = [];
  let totalSpan = 0;
  let overflow = false;
  let firstStartX = 0;

  const rowHeights = sortedRows.map((row) =>
    byRow.get(row)!.reduce((max, item) => Math.max(max, item.height), 0),
  );
  const totalLayoutHeight =
    rowHeights.reduce((sum, h) => sum + h, 0) +
    Math.max(0, rowHeights.length - 1) * wall.rowGutter;

  // centerHeightAt is treated as distance up from bottom of wall.
  const anchorY = wall.height - (wall.centerHeightAt ?? wall.height / 2);
  let yCursor = round1(anchorY - totalLayoutHeight / 2);

  sortedRows.forEach((row, rowIndex) => {
    const rowItems = byRow.get(row)!;
    const gaps = rowItems.map((item, i) => {
      if (i === 0) return 0;
      return item.gutterBefore !== undefined ? item.gutterBefore : wall.defaultGutter;
    });

    const rowSpan =
      rowItems.reduce((sum, item) => sum + item.width, 0) +
      gaps.reduce((sum, gap) => sum + gap, 0);

    const startX =
      wall.alignment === 'centered'
        ? (wall.width - rowSpan) / 2
        : wall.startOffset;

    if (rowIndex === 0) firstStartX = startX;
    totalSpan = Math.max(totalSpan, rowSpan);

    let xCursor = startX;
  const rowHeight = rowHeights[rowIndex];

    for (let i = 0; i < rowItems.length; i++) {
      if (i > 0) xCursor += gaps[i];
      const item = rowItems[i];

      positionMap.set(item.id, { x: xCursor, y: yCursor });
      holes.push(...buildHoleResults(wall, item, xCursor, yCursor));

      xCursor += item.width;
    }

    if (startX < 0 || startX + rowSpan > wall.width || yCursor + rowHeight > wall.height) {
      overflow = true;
    }
    yCursor = round1(yCursor + rowHeight + wall.rowGutter);
  });

  return {
    holes,
    itemPositions: mapPositions(items, positionMap),
    totalSpan,
    startX: firstStartX,
    overflow,
  };
};

/**
 * Minimum radius so that the bounding boxes of items placed on a circle at equal angular spacing
 * don't overlap each other. Uses the half-diagonal of adjacent item pairs as the clearance measure.
 */
const minRadiusForCircularNoOverlap = (items: ItemDef[], gutter: number): number => {
  const n = items.length;
  if (n <= 1) return 0;
  const halfDiag = (item: ItemDef) => Math.sqrt(item.width ** 2 + item.height ** 2) / 2;
  // Angular step between adjacent items
  const sinHalfStep = Math.sin(Math.PI / n);
  let rMin = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const minDist = halfDiag(items[i]) + halfDiag(items[j]) + gutter;
    rMin = Math.max(rMin, minDist / (2 * sinHalfStep));
  }
  return round1(rMin);
};

const calculateCircularLayout = (wall: WallConfig, items: ItemDef[], wallDef: WallDef): LayoutResult => {
  const { centerX, centerY, radius, startAngleDeg } = wallDef.layoutParams.circular;
  const holes: HoleResult[] = [];
  const positionMap = new Map<string, { x: number; y: number }>();
  const count = items.length;
  let overflow = false;

  // Auto-expand radius if needed to prevent item overlap
  const effectiveRadius = Math.max(radius, minRadiusForCircularNoOverlap(items, wall.defaultGutter));

  items.forEach((item, index) => {
    const theta = ((startAngleDeg + (360 / Math.max(count, 1)) * index) * Math.PI) / 180;
    const itemCx = centerX + effectiveRadius * Math.cos(theta);
    const itemCy = centerY + effectiveRadius * Math.sin(theta);
    const x = round1(itemCx - item.width / 2);
    const y = round1(itemCy - item.height / 2);

    positionMap.set(item.id, { x, y });
    holes.push(...buildHoleResults(wall, item, x, y));

    if (x < 0 || y < 0 || x + item.width > wall.width || y + item.height > wall.height) {
      overflow = true;
    }
  });

  return {
    holes,
    itemPositions: mapPositions(items, positionMap),
    totalSpan: round1(effectiveRadius * 2),
    startX: round1(centerX - effectiveRadius),
    overflow,
  };
};

/**
 * Returns a nudge angle (degrees) to avoid spokes landing on cardinal axes,
 * but ONLY when the angular step doesn't produce an intentional clock-like
 * or compass-like pattern (i.e. when each spoke naturally lands on a multiple
 * of 30°, the user almost certainly wants that arrangement — think 12 spokes
 * at clock-hour positions, or 4 spokes at N/E/S/W).
 */
const hubSpokeAutoNudge = (spokeCount: number): number => {
  if (spokeCount === 0) return 0;
  const step = 360 / spokeCount;
  // If every spoke naturally lands on a 30° clock-face position, it's intentional.
  // e.g. 2 spokes (180°), 3 spokes (120°), 4 spokes (90°), 6 (60°), 12 (30°).
  if (step % 30 === 0) return 0;
  const cardinals = [0, 90, 180, 270];
  const tolerance = 10;
  const wouldAlignWithCardinal = Array.from({ length: spokeCount }, (_, i) => (step * i) % 360).some(
    (angle) => cardinals.some((c) => {
      const diff = Math.abs(((angle - c + 540) % 360) - 180);
      return diff < tolerance;
    }),
  );
  return wouldAlignWithCardinal ? 22.5 : 0;
};

const calculateHubSpokeLayout = (wall: WallConfig, items: ItemDef[], wallDef: WallDef): LayoutResult => {
  const { centerX, centerY, radius } = wallDef.layoutParams['hub-spoke'];
  const holes: HoleResult[] = [];
  const positionMap = new Map<string, { x: number; y: number }>();
  const connectors: Connector[] = [];
  let overflow = false;

  if (items.length === 0) {
    return {
      holes: [],
      itemPositions: [],
      totalSpan: 0,
      startX: centerX,
      overflow: false,
      connectors: [],
    };
  }

  const [hub, ...spokes] = items;
  const hubX = centerX - hub.width / 2;
  const hubY = centerY - hub.height / 2;
  positionMap.set(hub.id, { x: hubX, y: hubY });
  holes.push(...buildHoleResults(wall, hub, hubX, hubY));

  // Auto-expand radius so spokes don't overlap each other or the hub
  const hubHalfDiag = Math.sqrt(hub.width ** 2 + hub.height ** 2) / 2;
  let effectiveRadius = radius;
  // Hub-to-spoke clearance
  for (const spoke of spokes) {
    const spokeHalfDiag = Math.sqrt(spoke.width ** 2 + spoke.height ** 2) / 2;
    effectiveRadius = Math.max(effectiveRadius, hubHalfDiag + spokeHalfDiag + wall.defaultGutter);
  }
  // Spoke-to-spoke clearance (treat spokes as evenly distributed on a circle)
  const spokeOnlyMin = minRadiusForCircularNoOverlap(spokes, wall.defaultGutter);
  effectiveRadius = Math.max(effectiveRadius, spokeOnlyMin);

  // Auto-nudge start angle to avoid cardinal axis alignment
  const nudgeDeg = hubSpokeAutoNudge(spokes.length);

  spokes.forEach((item, index) => {
    const angleDeg = nudgeDeg + (360 / Math.max(spokes.length, 1)) * index;
    const theta = (angleDeg * Math.PI) / 180;
    const itemCx = centerX + effectiveRadius * Math.cos(theta);
    const itemCy = centerY + effectiveRadius * Math.sin(theta);
    const x = round1(itemCx - item.width / 2);
    const y = round1(itemCy - item.height / 2);

    positionMap.set(item.id, { x, y });
    holes.push(...buildHoleResults(wall, item, x, y));
    connectors.push({ fromItemId: hub.id, toItemId: item.id });

    if (x < 0 || y < 0 || x + item.width > wall.width || y + item.height > wall.height) {
      overflow = true;
    }
  });

  return {
    holes,
    itemPositions: mapPositions(items, positionMap),
    connectors,
    totalSpan: round1(effectiveRadius * 2),
    startX: round1(centerX - effectiveRadius),
    overflow,
  };
};

/** Simple seeded LCG pseudo-random number generator (returns 0..1). */
const makePrng = (seed: number) => {
  let s = (seed ^ 0xdeadbeef) >>> 0;
  return () => {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s ^= s >>> 16;
    return (s >>> 0) / 0x100000000;
  };
};


const calculateSplatLayout = (wall: WallConfig, items: ItemDef[], wallDef: WallDef): LayoutResult => {
  const { seed } = wallDef.layoutParams.splat ?? { seed: 42 };
  const rand = makePrng(seed);
  const holes: HoleResult[] = [];
  const positionMap = new Map<string, { x: number; y: number }>();
  const placed: Array<{ x: number; y: number; w: number; h: number }> = [];
  let overflow = false;
  const gap = wall.defaultGutter;

  const maxTries = 180;
  const wallCenterX = wall.width / 2;
  const wallCenterY = wall.height / 2;
  const attractionRadius = Math.min(wall.width, wall.height) * 0.33;

  const overlapAreaWithGap = (
    ax: number,
    ay: number,
    aw: number,
    ah: number,
    bx: number,
    by: number,
    bw: number,
    bh: number,
    spacing: number,
  ): number => {
    const overlapW = Math.max(0, Math.min(ax + aw + spacing, bx + bw + spacing) - Math.max(ax, bx));
    const overlapH = Math.max(0, Math.min(ay + ah + spacing, by + bh + spacing) - Math.max(ay, by));
    return overlapW * overlapH;
  };

  for (const item of items) {
    const maxX = Math.max(0, wall.width - item.width);
    const maxY = Math.max(0, wall.height - item.height);

    const placedCenter = placed.length > 0
      ? placed.reduce((acc, p) => ({
        x: acc.x + p.x + p.w / 2,
        y: acc.y + p.y + p.h / 2,
      }), { x: 0, y: 0 })
      : { x: wallCenterX, y: wallCenterY };
    const avgPlacedCenterX = placed.length > 0 ? placedCenter.x / placed.length : wallCenterX;
    const avgPlacedCenterY = placed.length > 0 ? placedCenter.y / placed.length : wallCenterY;
    const targetCenterX = wallCenterX * 0.6 + avgPlacedCenterX * 0.4;
    const targetCenterY = wallCenterY * 0.6 + avgPlacedCenterY * 0.4;

    let bestX = round1(Math.max(0, Math.min(maxX, targetCenterX - item.width / 2)));
    let bestY = round1(Math.max(0, Math.min(maxY, targetCenterY - item.height / 2)));
    let bestScore = Infinity;
    let bestOverlapArea = Infinity;

    for (let attempt = 0; attempt < maxTries; attempt++) {
      // Polar sampling biased toward the center creates natural attraction.
      const theta = rand() * Math.PI * 2;
      const radius = attractionRadius * ((rand() + rand()) / 2);
      const centerX = targetCenterX + Math.cos(theta) * radius;
      const centerY = targetCenterY + Math.sin(theta) * radius;

      const cx = round1(Math.max(0, Math.min(maxX, centerX - item.width / 2)));
      const cy = round1(Math.max(0, Math.min(maxY, centerY - item.height / 2)));
      const candidateCenterX = cx + item.width / 2;
      const candidateCenterY = cy + item.height / 2;

      const totalOverlap = placed.reduce((sum, p) => sum + overlapAreaWithGap(cx, cy, item.width, item.height, p.x, p.y, p.w, p.h, gap), 0);

      // Anti-clump term: if candidate center is too close to others, apply heavy penalty.
      const crowdPenalty = placed.reduce((sum, p) => {
        const otherCx = p.x + p.w / 2;
        const otherCy = p.y + p.h / 2;
        const minDist = (Math.sqrt(item.width ** 2 + item.height ** 2) + Math.sqrt(p.w ** 2 + p.h ** 2)) / 2 + gap * 0.55;
        const dist = Math.hypot(candidateCenterX - otherCx, candidateCenterY - otherCy);
        if (dist >= minDist) return sum;
        const deficit = minDist - dist;
        return sum + deficit * deficit;
      }, 0);

      const distToTarget = Math.hypot(candidateCenterX - targetCenterX, candidateCenterY - targetCenterY);
      const score = totalOverlap * 1500 + crowdPenalty * 12 + distToTarget;

      if (score < bestScore) {
        bestScore = score;
        bestOverlapArea = totalOverlap;
        bestX = cx;
        bestY = cy;
      }
    }

    positionMap.set(item.id, { x: bestX, y: bestY });
    holes.push(...buildHoleResults(wall, item, bestX, bestY));
    placed.push({ x: bestX, y: bestY, w: item.width, h: item.height });

    if (bestOverlapArea > 0) overflow = true;
  }

  return {
    holes,
    itemPositions: mapPositions(items, positionMap),
    totalSpan: wall.width,
    startX: 0,
    overflow,
  };
};

/**
 * Automatically distribute items across rows for the linear layout.
 * Tries to fit as many items per row as the wall width comfortably allows,
 * then assigns `item.row` values accordingly. Returns updated item array.
 */
export function autoAssignRows(items: ItemDef[], wall: WallConfig): ItemDef[] {
  if (items.length === 0) return items;

  // Compute columns per row: fit items by average width + default gutter
  const avgWidth =
    items.reduce((sum, item) => sum + item.width, 0) / items.length;
  const colsPerRow = Math.max(1, Math.floor(
    (wall.width + wall.defaultGutter) / (avgWidth + wall.defaultGutter),
  ));

  return items.map((item, index) => ({
    ...item,
    row: Math.floor(index / colsPerRow),
  }));
}

/**
 * Calculate the layout and all drill-hole positions for the given wall and items.
 */
export function calculateLayout(wall: WallConfig, items: ItemDef[]): LayoutResult {
  const fallbackWall: WallDef = {
    id: 'single-wall',
    name: 'Wall',
    config: wall,
    items,
    layoutMode: 'linear',
    layoutParams: {
      circular: {
        centerX: wall.width / 2,
        centerY: wall.height / 2,
        radius: Math.min(wall.width, wall.height) / 3,
        startAngleDeg: -90,
      },
      'hub-spoke': {
        centerX: wall.width / 2,
        centerY: wall.height / 2,
        radius: Math.min(wall.width, wall.height) / 3,
      },
      staircase: {
        xStep: wall.defaultGutter + 20,
        yStep: wall.rowGutter + 20,
        direction: 'ltr',
      },
      splat: { seed: 42 },
    },
  };

  return calculateWallLayout(fallbackWall);
}

export function calculateWallLayout(wallDef: WallDef): LayoutResult {
  const wall = wallDef.config;
  const items = wallDef.items;

  if (items.length === 0) {
    return {
      holes: [],
      itemPositions: [],
      totalSpan: 0,
      startX: wall.alignment === 'centered' ? wall.width / 2 : wall.startOffset,
      overflow: false,
      connectors: [],
    };
  }

  const mode: LayoutMode = wallDef.layoutMode;
  if (mode === 'circular') {
    return calculateCircularLayout(wall, items, wallDef);
  }
  if (mode === 'hub-spoke') {
    return calculateHubSpokeLayout(wall, items, wallDef);
  }
  if (mode === 'staircase') {
    return calculateLinearLayout(wall, items);
  }
  if (mode === 'splat') {
    return calculateSplatLayout(wall, items, wallDef);
  }

  return calculateLinearLayout(wall, items);
}
