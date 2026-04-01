import { describe, it, expect } from 'vitest';
import { calculateLayout } from './calculations';
import type { ItemDef, WallConfig } from './types';

let nextId = 1;

function item(overrides: Partial<ItemDef>): ItemDef {
  return {
    id: overrides.id ?? `item-${nextId++}`,
    name: overrides.name ?? 'Item',
    width: overrides.width ?? 30,
    holeCount: overrides.holeCount ?? 1,
    holeSpacing: overrides.holeSpacing ?? 20,
    holeOffset: overrides.holeOffset ?? 0,
    gutterBefore: overrides.gutterBefore,
  };
}

const centeredWall: WallConfig = {
  width: 200,
  defaultGutter: 4,
  alignment: 'centered',
  startOffset: 0,
};

describe('calculateLayout', () => {
  it('returns empty layout for zero items', () => {
    const result = calculateLayout(centeredWall, []);

    expect(result.holes).toEqual([]);
    expect(result.itemStartPositions).toEqual([]);
    expect(result.totalSpan).toBe(0);
    expect(result.startX).toBe(100);
    expect(result.overflow).toBe(false);
  });

  it('matches the three-picture centred example', () => {
    const items = [
      item({ id: 'a', name: 'Left' }),
      item({ id: 'b', name: 'Middle' }),
      item({ id: 'c', name: 'Right' }),
    ];

    const result = calculateLayout(centeredWall, items);

    // Total span = 30 + 4 + 30 + 4 + 30 = 98, so startX = (200 - 98) / 2 = 51
    expect(result.totalSpan).toBe(98);
    expect(result.startX).toBe(51);
    expect(result.itemStartPositions).toEqual([51, 85, 119]);

    // Hole positions: centres of each 30cm item -> 66, 100, 134
    expect(result.holes.map((h) => h.fromLeft)).toEqual([66, 100, 134]);
    expect(result.holes.map((h) => h.fromRight)).toEqual([134, 100, 66]);
    expect(result.holes.map((h) => h.fromCenter)).toEqual([-34, 0, 34]);
    expect(result.overflow).toBe(false);
  });

  it('uses per-item gutterBefore override', () => {
    const items = [
      item({ id: 'a', width: 40 }),
      item({ id: 'b', width: 40, gutterBefore: 10 }),
      item({ id: 'c', width: 40 }),
    ];

    const result = calculateLayout(centeredWall, items);

    // Gaps are [0,10,4], span = 120 + 14 = 134, start = 33
    expect(result.totalSpan).toBe(134);
    expect(result.itemStartPositions).toEqual([33, 83, 127]);
  });

  it('distributes multiple holes symmetrically and reports distToNextHole', () => {
    const items = [
      item({
        id: 'a',
        width: 60,
        holeCount: 3,
        holeSpacing: 20,
      }),
    ];

    const result = calculateLayout(centeredWall, items);

    // start = (200 - 60)/2 = 70, centre = 100, holes at 80,100,120
    expect(result.holes.map((h) => h.fromLeft)).toEqual([80, 100, 120]);
    expect(result.holes[0].distToNextHole).toBe(20);
    expect(result.holes[1].distToNextHole).toBe(20);
    expect(result.holes[2].distToNextHole).toBeUndefined();
  });

  it('applies holeOffset relative to item centre', () => {
    const items = [item({ id: 'a', width: 40, holeCount: 2, holeSpacing: 10, holeOffset: 5 })];
    const result = calculateLayout(centeredWall, items);

    // start=(200-40)/2=80, centre=100, offset=+5, holes=100 and 110
    expect(result.holes.map((h) => h.fromLeft)).toEqual([100, 110]);
  });

  it('supports left-aligned layout and detects overflow', () => {
    const wall: WallConfig = {
      width: 100,
      defaultGutter: 5,
      alignment: 'left-aligned',
      startOffset: 20,
    };

    const items = [item({ width: 50 }), item({ width: 40 })];
    const result = calculateLayout(wall, items);

    expect(result.startX).toBe(20);
    expect(result.itemStartPositions).toEqual([20, 75]);
    expect(result.totalSpan).toBe(95);
    expect(result.overflow).toBe(true); // 20 + 95 > 100
  });
});
