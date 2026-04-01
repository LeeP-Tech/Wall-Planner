import React from 'react';
import type { WallConfig, Alignment } from '../lib/types';

interface Props {
  config: WallConfig;
  onChange: (config: WallConfig) => void;
}

export const WallConfigPanel: React.FC<Props> = ({ config, onChange }) => {
  const set = (partial: Partial<WallConfig>) => onChange({ ...config, ...partial });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Wall</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Width (cm)</span>
          <input
            type="number"
            min={1}
            value={config.width}
            onChange={e => set({ width: parseFloat(e.target.value) || 0 })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Default gutter (cm)</span>
          <input
            type="number"
            min={0}
            step="any"
            value={config.defaultGutter}
            onChange={e => set({ defaultGutter: parseFloat(e.target.value) || 0 })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Alignment</span>
          <select
            value={config.alignment}
            onChange={e => set({ alignment: e.target.value as Alignment })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="centered">Centred on wall</option>
            <option value="left-aligned">Left-aligned from offset</option>
          </select>
        </label>

        {config.alignment === 'left-aligned' && (
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Start offset (cm)</span>
            <input
              type="number"
              min={0}
              step="any"
              value={config.startOffset}
              onChange={e => set({ startOffset: parseFloat(e.target.value) || 0 })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </label>
        )}
      </div>
    </div>
  );
};
