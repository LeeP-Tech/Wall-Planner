import React from 'react';
import type { WallConfig, Alignment, UnitSystem } from '../lib/types';
import { LengthInput } from './LengthInput';

interface Props {
  config: WallConfig;
  unitSystem: UnitSystem;
  onChange: (config: WallConfig) => void;
}

export const WallConfigPanel: React.FC<Props> = ({ config, unitSystem, onChange }) => {
  const set = (partial: Partial<WallConfig>) => onChange({ ...config, ...partial });

  return (
    <div className="wp-panel">
      <h2 className="wp-heading">Wall</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <LengthInput label="Width" unitSystem={unitSystem} mmValue={config.width} onChange={(mm) => set({ width: mm })} allowNegative={false} min={1} />

        <LengthInput label="Height" unitSystem={unitSystem} mmValue={config.height} onChange={(mm) => set({ height: mm })} allowNegative={false} min={1} />

        <LengthInput label="Default gutter" unitSystem={unitSystem} mmValue={config.defaultGutter} onChange={(mm) => set({ defaultGutter: mm })} allowNegative={false} min={0} />

        <LengthInput label="Row gutter" unitSystem={unitSystem} mmValue={config.rowGutter} onChange={(mm) => set({ rowGutter: mm })} allowNegative={false} min={0} />

        <LengthInput label="Center height" unitSystem={unitSystem} mmValue={config.centerHeightAt} onChange={(mm) => set({ centerHeightAt: mm })} allowNegative={false} min={0} />

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
          <LengthInput label="Start offset" unitSystem={unitSystem} mmValue={config.startOffset} onChange={(mm) => set({ startOffset: mm })} allowNegative={false} min={0} />
        )}
      </div>
    </div>
  );
};
