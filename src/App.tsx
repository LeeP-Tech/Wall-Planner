import { useState, useEffect, useRef, useMemo } from 'react';
import type { AccuracyStepMm, LayoutMode, LayoutParams, ProjectDef, UnitSystem, WallConfig, WallDef } from './lib/types';
import { calculateWallLayout } from './lib/calculations';
import { cmToMm } from './lib/units';
import { WallConfigPanel } from './components/WallConfigPanel';
import { ItemList } from './components/ItemList';
import { WallDiagram } from './components/WallDiagram';
import { MeasurementTable } from './components/MeasurementTable';
import { LayoutModePanel } from './components/LayoutModePanel';
import { ProjectPanel } from './components/ProjectPanel';
import './index.css';

const CURRENT_PROJECT_KEY = 'wp-current-project-v2';
const PROJECT_SNAPSHOTS_KEY = 'wp-project-snapshots-v2';
export const PROJECT_SCHEMA_VERSION = 3;
const DEFAULT_ACCURACY_STEP_MM: AccuracyStepMm = 5;

const uid = () => (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

const defaultWallConfig = (): WallConfig => ({
  width: 2000,
  height: 1500,
  centerHeightAt: 750,
  defaultGutter: 40,
  rowGutter: 80,
  alignment: 'centered',
  startOffset: 0,
});

const r1 = (n: number) => Math.round(n * 10) / 10;

const defaultLayoutParams = (wall: WallConfig): LayoutParams => ({
  circular: {
    centerX: r1(wall.width / 2),
    centerY: r1(wall.height / 2),
    radius: r1(Math.min(wall.width, wall.height) * 0.28),
    startAngleDeg: -90,
  },
  'hub-spoke': {
    centerX: r1(wall.width / 2),
    centerY: r1(wall.height / 2),
    radius: r1(Math.min(wall.width, wall.height) * 0.28),
  },
  staircase: {
    xStep: 220,
    yStep: 160,
    direction: 'ltr' as const,
  },
  splat: { seed: 42 },
});

const createWall = (): WallDef => {
  const config = defaultWallConfig();
  return {
    id: uid(),
    name: 'Wall',
    config,
    items: [],
    layoutMode: 'linear',
    layoutParams: defaultLayoutParams(config),
  };
};

/** Fill in any layoutParams keys that may be missing from data saved before a feature was added. */
const migrateWall = (wall: WallDef, convertLegacyCm: boolean): WallDef => {
  const toCanonical = (n: number | undefined): number => {
    const value = n ?? 0;
    return convertLegacyCm ? cmToMm(value) : value;
  };

  const configDefaults = defaultWallConfig();
  const sourceConfig = wall.config ?? configDefaults;
  const migratedHeight = toCanonical(sourceConfig.height ?? configDefaults.height);
  const migratedConfig: WallConfig = {
    ...configDefaults,
    ...sourceConfig,
    width: toCanonical(sourceConfig.width ?? configDefaults.width),
    height: migratedHeight,
    defaultGutter: toCanonical(sourceConfig.defaultGutter ?? configDefaults.defaultGutter),
    rowGutter: toCanonical(sourceConfig.rowGutter ?? configDefaults.rowGutter),
    startOffset: toCanonical(sourceConfig.startOffset ?? configDefaults.startOffset),
    centerHeightAt: sourceConfig.centerHeightAt !== undefined
      ? toCanonical(sourceConfig.centerHeightAt)
      : r1(migratedHeight / 2),
  };

  const defaults = defaultLayoutParams(migratedConfig);
  const stored = wall.layoutParams;
  const rawMode = wall.layoutMode as string;
  const migratedMode: LayoutMode = (rawMode === 'staircase' || rawMode === 'family-tree')
    ? 'linear'
    : wall.layoutMode;
  const sourceItems = wall.items ?? [];
  return {
    ...wall,
    config: migratedConfig,
    items: sourceItems.map((item) => ({
      ...item,
      width: toCanonical(item.width),
      height: toCanonical(item.height),
      holeSpacing: toCanonical(item.holeSpacing),
      holeOffset: toCanonical(item.holeOffset),
      holeVerticalOffset: item.holeVerticalOffset !== undefined ? toCanonical(item.holeVerticalOffset) : 0,
      gutterBefore: item.gutterBefore !== undefined ? toCanonical(item.gutterBefore) : undefined,
    })),
    layoutMode: migratedMode,
    layoutParams: {
      circular: {
        ...defaults.circular,
        ...stored?.circular,
        // Always re-round numeric fields that may have been stored with float noise
        centerX: r1(toCanonical(stored?.circular?.centerX ?? defaults.circular.centerX)),
        centerY: r1(toCanonical(stored?.circular?.centerY ?? defaults.circular.centerY)),
        radius:  r1(toCanonical(stored?.circular?.radius  ?? defaults.circular.radius)),
      },
      'hub-spoke': {
        ...defaults['hub-spoke'],
        ...stored?.['hub-spoke'],
        centerX: r1(toCanonical(stored?.['hub-spoke']?.centerX ?? defaults['hub-spoke'].centerX)),
        centerY: r1(toCanonical(stored?.['hub-spoke']?.centerY ?? defaults['hub-spoke'].centerY)),
        radius:  r1(toCanonical(stored?.['hub-spoke']?.radius  ?? defaults['hub-spoke'].radius)),
      },
      staircase: {
        ...defaults.staircase,
        ...stored?.staircase,
        xStep: toCanonical(stored?.staircase?.xStep ?? defaults.staircase.xStep),
        yStep: toCanonical(stored?.staircase?.yStep ?? defaults.staircase.yStep),
      },
      splat:         { ...defaults.splat,          ...stored?.splat },
    },
  };
};

type LegacyProjectDef = Partial<ProjectDef> & {
  walls?: WallDef[];
  activeWallId?: string;
};

export const migrateProject = (p: LegacyProjectDef): ProjectDef => {
  const legacyVersion = typeof p.schemaVersion === 'number' ? p.schemaVersion : 2;
  const convertLegacyCm = legacyVersion < PROJECT_SCHEMA_VERSION;
  const sourceWall = p.wall ?? p.walls?.[0] ?? createWall();
  const wall = migrateWall(sourceWall, convertLegacyCm);
  return {
    id: p.id ?? uid(),
    name: p.name ?? 'My Wall Plan',
    wall,
    schemaVersion: PROJECT_SCHEMA_VERSION,
    unitSystem: p.unitSystem === 'imperial' ? 'imperial' : 'metric',
    accuracyStepMm: [10, 5, 2, 1].includes(p.accuracyStepMm as number)
      ? (p.accuracyStepMm as AccuracyStepMm)
      : DEFAULT_ACCURACY_STEP_MM,
    updatedAt: p.updatedAt ?? new Date().toISOString(),
  };
};

const createProject = (): ProjectDef => {
  const wall = createWall();
  return {
    id: uid(),
    name: 'My Wall Plan',
    wall,
    schemaVersion: PROJECT_SCHEMA_VERSION,
    unitSystem: 'metric',
    accuracyStepMm: DEFAULT_ACCURACY_STEP_MM,
    updatedAt: new Date().toISOString(),
  };
};

type Theme = 'dark' | 'light';

function App() {
  const [project, setProject] = useState<ProjectDef>(() => {
    const raw = localStorage.getItem(CURRENT_PROJECT_KEY);
    if (!raw) return createProject();
    try {
      return migrateProject(JSON.parse(raw) as LegacyProjectDef);
    } catch {
      return createProject();
    }
  });

  const [savedProjects, setSavedProjects] = useState<ProjectDef[]>(() => {
    const raw = localStorage.getItem(PROJECT_SNAPSHOTS_KEY);
    if (!raw) return [];
    try {
      return (JSON.parse(raw) as LegacyProjectDef[]).map(migrateProject);
    } catch {
      return [];
    }
  });

  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('wp-theme') as Theme) ?? 'dark'
  );

  const unitSystem: UnitSystem = project.unitSystem ?? 'metric';
  const accuracyStepMm: AccuracyStepMm = project.accuracyStepMm ?? DEFAULT_ACCURACY_STEP_MM;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('wp-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(CURRENT_PROJECT_KEY, JSON.stringify(project));
  }, [project]);

  useEffect(() => {
    localStorage.setItem(PROJECT_SNAPSHOTS_KEY, JSON.stringify(savedProjects));
  }, [savedProjects]);

  const wall = useMemo(() => project.wall, [project]);

  const updateWall = (updater: (wall: WallDef) => WallDef) => {
    setProject((prev) => {
      const nextWall = updater(prev.wall);
      return { ...prev, wall: nextWall, updatedAt: new Date().toISOString() };
    });
  };

  // Measure available width for the SVG diagram
  const diagramRef = useRef<HTMLDivElement>(null);
  const [svgWidth, setSvgWidth] = useState(600);

  useEffect(() => {
    const measure = () => {
      if (diagramRef.current) {
        setSvgWidth(diagramRef.current.clientWidth);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (diagramRef.current) ro.observe(diagramRef.current);
    return () => ro.disconnect();
  }, []);

  const layout = useMemo(() => calculateWallLayout(wall), [wall]);

  const setActiveLayoutMode = (layoutMode: LayoutMode) => {
    updateWall((currentWall) => ({ ...currentWall, layoutMode }));
  };

  return (
    <div className="min-h-screen">
      <header style={{ background: 'var(--lt-panel)', borderBottom: '1px solid var(--lt-line)' }} className="px-6 py-4 flex items-center gap-3">
        <div style={{ background: 'linear-gradient(135deg, var(--lt-cyan), var(--lt-teal))', color: '#081420' }} className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">W</div>
        <div className="flex-1">
          <h1 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", color: 'var(--lt-ink)' }} className="text-xl font-bold leading-none">Wall Planner</h1>
          <p style={{ color: 'var(--lt-subtle)' }} className="text-xs mt-0.5">2D layouts and local history</p>
        </div>
        <button
          onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="wp-btn-theme"
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <ProjectPanel
          project={project}
          savedProjects={savedProjects}
          unitSystem={unitSystem}
          accuracyStepMm={accuracyStepMm}
          onUnitSystemChange={(nextUnitSystem) => {
            setProject((prev) => ({ ...prev, unitSystem: nextUnitSystem, updatedAt: new Date().toISOString() }));
          }}
          onAccuracyStepChange={(nextAccuracyStepMm) => {
            setProject((prev) => ({ ...prev, accuracyStepMm: nextAccuracyStepMm, updatedAt: new Date().toISOString() }));
          }}
          onRenameProject={(name) => setProject((prev) => ({ ...prev, name, updatedAt: new Date().toISOString() }))}
          onSaveProject={() => {
            setSavedProjects((prev) => {
              const snapshot = { ...project, id: crypto.randomUUID(), updatedAt: new Date().toISOString() };
              return [snapshot, ...prev].slice(0, 20);
            });
          }}
          onLoadProject={(projectId) => {
            const found = savedProjects.find((p) => p.id === projectId);
            if (found) setProject(migrateProject(found));
          }}
          onDeleteSaved={(projectId) => {
            setSavedProjects((prev) => prev.filter((p) => p.id !== projectId));
          }}
        />

        <WallConfigPanel
          config={wall.config}
          unitSystem={unitSystem}
          onChange={(config) => {
            updateWall((currentWall) => ({
              ...currentWall,
              config,
              layoutParams: {
                ...currentWall.layoutParams,
                circular: {
                  ...currentWall.layoutParams.circular,
                  centerX: config.width / 2,
                  centerY: config.height / 2,
                },
                'hub-spoke': {
                  ...currentWall.layoutParams['hub-spoke'],
                  centerX: config.width / 2,
                  centerY: config.height / 2,
                },
              },
            }));
          }}
        />

        <LayoutModePanel
          mode={wall.layoutMode}
          params={wall.layoutParams}
          unitSystem={unitSystem}
          onModeChange={setActiveLayoutMode}
          onParamsChange={(layoutParams) => updateWall((currentWall) => ({ ...currentWall, layoutParams }))}
        />

        <ItemList
          items={wall.items}
          wallConfig={wall.config}
          unitSystem={unitSystem}
          accuracyStepMm={accuracyStepMm}
          onChange={(items) => updateWall((currentWall) => ({ ...currentWall, items }))}
        />

        {wall.items.length > 0 && (
          <div ref={diagramRef}>
            <WallDiagram
              wall={wall.config}
              items={wall.items}
              layout={layout}
              svgWidth={svgWidth}
              theme={theme}
              unitSystem={unitSystem}
              accuracyStepMm={accuracyStepMm}
            />
          </div>
        )}

        <MeasurementTable
          holes={layout.holes}
          orderedItemIds={wall.items.map((i) => i.id)}
          unitSystem={unitSystem}
          accuracyStepMm={accuracyStepMm}
        />
      </main>

      <footer style={{ color: 'var(--lt-subtle)', borderTop: '1px solid var(--lt-line)' }} className="text-center text-xs py-6">
        Wall Planner — &copy; {new Date().getFullYear()} Lee Pasifull
      </footer>
    </div>
  );
}

export default App;
