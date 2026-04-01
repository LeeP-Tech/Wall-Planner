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

function App() {
  const [wall, setWall] = useState<WallConfig>(DEFAULT_WALL);
  const [items, setItems] = useState<ItemDef[]>([]);

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">W</div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-none">Wall Planner</h1>
          <p className="text-xs text-gray-500 mt-0.5">Calculate drill hole positions</p>
        </div>
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
            />
          </div>
        )}

        {/* Measurement table */}
        <MeasurementTable
          holes={layout.holes}
          orderedItemIds={items.map(i => i.id)}
        />
      </main>

      <footer className="text-center text-xs text-gray-400 py-6">
        Wall Planner — &copy; {new Date().getFullYear()} Lee Pasifull
      </footer>
    </div>
  );
}

export default App;
