import { describe, expect, it } from 'vitest';
import { migrateProject, PROJECT_SCHEMA_VERSION } from './App';

const legacyProject = (): Parameters<typeof migrateProject>[0] => ({
  id: 'p1',
  name: 'Legacy',
  walls: [
    {
      id: 'w1',
      name: 'Wall 1',
      config: {
        width: 200,
        height: 150,
        centerHeightAt: 75,
        defaultGutter: 4,
        rowGutter: 8,
        alignment: 'centered' as const,
        startOffset: 0,
      },
      items: [
        {
          id: 'i1',
          name: 'Item 1',
          width: 40,
          height: 30,
          row: 0,
          holeCount: 2,
          holeSpacing: 20,
          holeOffset: 0,
          holeVerticalOffset: 0,
          gutterBefore: 4,
        },
      ],
      layoutMode: 'linear' as const,
      layoutParams: {
        circular: { centerX: 100, centerY: 75, radius: 40, startAngleDeg: -90 },
        'hub-spoke': { centerX: 100, centerY: 75, radius: 40 },
        staircase: { xStep: 22, yStep: 16, direction: 'ltr' as const },
        splat: { seed: 42 },
      },
    },
  ],
  activeWallId: 'missing-wall',
  updatedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
  schemaVersion: 2,
  unitSystem: 'metric' as const,
  accuracyStepMm: 5,
});

describe('project migration', () => {
  it('converts legacy cm data to canonical mm exactly once', () => {
    const migrated = migrateProject(legacyProject());

    expect(migrated.schemaVersion).toBe(PROJECT_SCHEMA_VERSION);
    expect(migrated.wall.config.width).toBe(2000);
    expect(migrated.wall.config.defaultGutter).toBe(40);
    expect(migrated.wall.items[0].width).toBe(400);
    expect(migrated.wall.layoutParams.circular.centerX).toBe(1000);
  });

  it('does not reconvert already-canonical schema data', () => {
    const first = migrateProject(legacyProject());
    const second = migrateProject(first);

    expect(second.wall.config.width).toBe(first.wall.config.width);
    expect(second.wall.items[0].width).toBe(first.wall.items[0].width);
    expect(second.wall.layoutParams.circular.centerX).toBe(first.wall.layoutParams.circular.centerX);
  });

  it('uses the first legacy wall as the active single wall', () => {
    const migrated = migrateProject(legacyProject());
    expect(migrated.wall.id).toBe('w1');
  });
});
