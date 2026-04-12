import { useState, useEffect, useRef, useMemo } from 'react';
import type { WallConfig, ItemDef } from './lib/types';
import { calculateLayout } from './lib/calculations';
import { WallConfigPanel } from './components/WallConfigPanel';
import { ItemList } from './components/ItemList';
import { WallDiagram } from './components/WallDiagram';
import { MeasurementTable } from './components/MeasurementTable';
import './index.css';

const DEFAULT_WALL: WallConfig = {
  width: 200,
  defaultGutter: 4,
  alignment: 'centered',
  startOffset: 0,
};

type Theme = 'dark' | 'light';

function App() {
  const [wall, setWall] = useState<WallConfig>(DEFAULT_WALL);
  const [items, setItems] = useState<ItemDef[]>([]);
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('wp-theme') as Theme) ?? 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('wp-theme', theme);
  }, [theme]);

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

  const layout = useMemo(() => calculateLayout(wall, items), [wall, items]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header style={{ background: 'var(--lt-panel)', borderBottom: '1px solid var(--lt-line)' }} className="px-6 py-4 flex items-center gap-3">
        <div style={{ background: 'linear-gradient(135deg, var(--lt-cyan), var(--lt-teal))', color: '#081420' }} className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">W</div>
        <div className="flex-1">
          <h1 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", color: 'var(--lt-ink)' }} className="text-xl font-bold leading-none">Wall Planner</h1>
          <p style={{ color: 'var(--lt-subtle)' }} className="text-xs mt-0.5">Calculate drill hole positions</p>
        </div>
        <button
          onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="wp-btn-theme"
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Wall config */}
        <div className="no-print">
          <WallConfigPanel config={wall} onChange={setWall} />
        </div>

        {/* Items */}
        <div className="no-print">
          <ItemList items={items} onChange={setItems} />
        </div>

        {/* Diagram — only when there are items */}
        {items.length > 0 && (
          <div ref={diagramRef}>
            <WallDiagram
              wall={wall}
              items={items}
              layout={layout}
              svgWidth={svgWidth}
              theme={theme}
            />
          </div>
        )}

        {/* Measurement table */}
        <MeasurementTable
          holes={layout.holes}
          orderedItemIds={items.map(i => i.id)}
        />
      </main>

      <footer style={{ color: 'var(--lt-subtle)', borderTop: '1px solid var(--lt-line)' }} className="text-center text-xs py-6">
        Wall Planner — &copy; {new Date().getFullYear()} Lee Pasifull
      </footer>
    </div>
  );
}

export default App;
