import React from 'react';
import type { WallConfig, Alignment } from '../lib/types';

interface Props {
  config: WallConfig;
  onChange: (config: WallConfig) => void;
}

export const WallConfigPanel: React.FC<Props> = ({ config, onChange }) => {
  const set = (partial: Partial<WallConfig>) => onChange({ ...config, ...partial });

  return (
    <div className="wp-panel">
      <h2 className="wp-heading">Wall</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <label className="flex flex-col gap-1.5">
          <span className="wp-label">Width (cm)</span>
          <input
            type="number"
            min={1}
            value={config.width}
            onChange={e => set({ width: parseFloat(e.target.value) || 0 })}
            className="wp-input"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="wp-label">Default gutter (cm)</span>
          <input
            type="number"
            min={0}
            step="any"
            value={config.defaultGutter}
            onChange={e => set({ defaultGutter: parseFloat(e.target.value) || 0 })}
            className="wp-input"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="wp-label">Alignment</span>
          <select
            value={config.alignment}
            onChange={e => set({ alignment: e.target.value as Alignment })}
            className="wp-input"
          >
            <option value="centered">Centred on wall</option>
            <option value="left-aligned">Left-aligned from offset</option>
          </select>
        </label>

        {config.alignment === 'left-aligned' && (
          <label className="flex flex-col gap-1.5">
            <span className="wp-label">Start offset (cm)</span>
            <input
              type="number"
              min={0}
              step="any"
              value={config.startOffset}
              onChange={e => set({ startOffset: parseFloat(e.target.value) || 0 })}
              className="wp-input"
            />
          </label>
        )}
      </div>
    </div>
  );
};
