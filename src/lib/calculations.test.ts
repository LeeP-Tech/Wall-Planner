import { describe, expect, it } from 'vitest';
import { calculateLayout, calculateWallLayout } from './calculations';
import type { ItemDef, WallConfig, WallDef } from './types';

let nextId = 1;

function item(overrides: Partial<ItemDef>): ItemDef {
  return {
    id: overrides.id ?? `item-${nextId++}`,
    name: overrides.name ?? 'Item',
    width: overrides.width ?? 30,
    height: overrides.height ?? 20,
    row: overrides.row ?? 0,
    holeCount: overrides.holeCount ?? 1,
    holeSpacing: overrides.holeSpacing ?? 20,
    holeOffset: overrides.holeOffset ?? 0,
    holeVerticalOffset: overrides.holeVerticalOffset ?? 0,
    gutterBefore: overrides.gutterBefore,
  };
}

const wallConfig: WallConfig = {
  width: 200,
  height: 120,
  centerHeightAt: 60,
  defaultGutter: 4,
  rowGutter: 8,
  alignment: 'centered',
  startOffset: 0,
};

const wall = (items: ItemDef[], layoutMode: WallDef['layoutMode'] = 'linear'): WallDef => ({
  id: 'wall-1',
  name: 'Wall',
  config: wallConfig,
  items,
  layoutMode,
  layoutParams: {
    circular: { centerX: 100, centerY: 60, radius: 30, startAngleDeg: -90 },
    'hub-spoke': { centerX: 100, centerY: 60, radius: 35 },
    staircase: { xStep: 15, yStep: 12, direction: 'ltr' },
    splat: { seed: 42 },
  },
});

describe('calculateWallLayout', () => {
  it('returns empty layout for zero items', () => {
    const result = calculateWallLayout(wall([]));
    expect(result.holes).toEqual([]);
    expect(result.itemPositions).toEqual([]);
    expect(result.totalSpan).toBe(0);
    expect(result.overflow).toBe(false);
  });

  it('supports jagged rows in linear mode', () => {
    const result = calculateWallLayout(
      wall([
        item({ id: 'a', width: 40, height: 20, row: 0 }),
        item({ id: 'b', width: 30, height: 28, row: 0 }),
        item({ id: 'c', width: 35, height: 18, row: 1 }),
      ]),
    );

    expect(result.itemPositions[0].y).toBe(33);
    expect(result.itemPositions[1].y).toBe(33);
    expect(result.itemPositions[2].y).toBe(69); // anchored at centerHeightAt (60): startY=33, then +28+8
    expect(result.holes[0].fromTop).toBeGreaterThanOrEqual(0);
  });

  it('computes circular positions and 2D hole values', () => {
    const result = calculateWallLayout(
      wall([
        item({ id: 'a' }),
        item({ id: 'b' }),
        item({ id: 'c' }),
        item({ id: 'd' }),
      ], 'circular'),
    );

    expect(result.itemPositions).toHaveLength(4);
    expect(result.holes.every((h) => Number.isFinite(h.fromTop))).toBe(true);
  });

  it('creates connectors in hub-spoke mode', () => {
    const result = calculateWallLayout(
      wall([
        item({ id: 'hub' }),
        item({ id: 's1' }),
        item({ id: 's2' }),
      ], 'hub-spoke'),
    );

    expect(result.connectors?.length).toBe(2);
  });

  it('moves rows up as centerHeightAt increases', () => {
    const baseItems = [
      item({ id: 'a', width: 40, height: 20, row: 0 }),
      item({ id: 'b', width: 30, height: 28, row: 0 }),
    ];

    const lowAnchor = calculateWallLayout({
      ...wall(baseItems),
      config: { ...wallConfig, centerHeightAt: 30 },
    });
    const highAnchor = calculateWallLayout({
      ...wall(baseItems),
      config: { ...wallConfig, centerHeightAt: 90 },
    });

    expect(highAnchor.itemPositions[0].y).toBeLessThan(lowAnchor.itemPositions[0].y);
  });

  it('keeps splat relatively close together without clumping', () => {
    const dimsById: Record<string, { w: number; h: number }> = {
      a: { w: 24, h: 16 },
      b: { w: 22, h: 14 },
      c: { w: 20, h: 16 },
      d: { w: 18, h: 18 },
      e: { w: 22, h: 15 },
      f: { w: 20, h: 14 },
    };

    const result = calculateWallLayout(
      wall([
        item({ id: 'a', width: dimsById.a.w, height: dimsById.a.h }),
        item({ id: 'b', width: dimsById.b.w, height: dimsById.b.h }),
        item({ id: 'c', width: dimsById.c.w, height: dimsById.c.h }),
        item({ id: 'd', width: dimsById.d.w, height: dimsById.d.h }),
        item({ id: 'e', width: dimsById.e.w, height: dimsById.e.h }),
        item({ id: 'f', width: dimsById.f.w, height: dimsById.f.h }),
      ], 'splat'),
    );

    expect(result.itemPositions).toHaveLength(6);

    const centers = result.itemPositions.map((p) => {
      const dims = dimsById[p.itemId];
      return {
        x: p.x + dims.w / 2,
        y: p.y + dims.h / 2,
      };
    });

    const avgDistToCenter =
      centers.reduce((sum, c) => sum + Math.hypot(c.x - wallConfig.width / 2, c.y - wallConfig.height / 2), 0) /
      centers.length;

    expect(avgDistToCenter).toBeLessThan(45);

    const pairDistances: number[] = [];
    for (let i = 0; i < centers.length; i++) {
      for (let j = i + 1; j < centers.length; j++) {
        pairDistances.push(Math.hypot(centers[i].x - centers[j].x, centers[i].y - centers[j].y));
      }
    }
    expect(Math.min(...pairDistances)).toBeGreaterThan(18);
  });
});

describe('calculateLayout compatibility', () => {
  it('still works for legacy single-wall calls', () => {
    const result = calculateLayout(wallConfig, [item({ id: 'a', width: 40, holeCount: 2, holeSpacing: 10 })]);
    expect(result.itemPositions).toHaveLength(1);
    expect(result.holes.map((h) => h.fromLeft)).toEqual([95, 105]);
  });
});
