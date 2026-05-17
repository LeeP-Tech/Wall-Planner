import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ItemDef, UnitSystem } from '../lib/types';
import { LengthInput } from './LengthInput';

interface Props {
  /** When set, we are editing an existing item; undefined = adding new */
  initial?: ItemDef;
  unitSystem: UnitSystem;
  onSave: (item: ItemDef) => void;
  onCancel: () => void;
}

const blank = (): ItemDef => ({
  id: uuidv4(),
  name: '',
  width: 400,
  height: 300,
  row: 0,
  holeCount: 1,
  holeSpacing: 200,
  holeOffset: 0,
  holeVerticalOffset: 0,
  gutterBefore: undefined,
});

export const ItemForm: React.FC<Props> = ({ initial, unitSystem, onSave, onCancel }) => {
  const [form, setForm] = useState<ItemDef>(initial ?? blank());
  const set = (partial: Partial<ItemDef>) => setForm(f => ({ ...f, ...partial }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: 'var(--lt-panel-strong)', border: '1px solid var(--lt-line)', borderRadius: 12, padding: 20 }} className="space-y-4">
      <h3 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", color: 'var(--lt-cyan)', margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>{initial ? 'Edit item' : 'New item'}</h3>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
          <span className="wp-label">Name</span>
          <input
            required
            type="text"
            value={form.name}
            onChange={e => set({ name: e.target.value })}
            placeholder="e.g. Large picture"
            className="wp-input"
          />
        </label>

        <LengthInput label="Width" unitSystem={unitSystem} mmValue={form.width} onChange={(mm) => set({ width: mm })} allowNegative={false} min={0.1} />

        <LengthInput label="Height" unitSystem={unitSystem} mmValue={form.height} onChange={(mm) => set({ height: mm })} allowNegative={false} min={0.1} />

        <label className="flex flex-col gap-1.5">
          <span className="wp-label">Row (0 = top)</span>
          <input
            type="number"
            min={0}
            step={1}
            value={form.row}
            onChange={e => set({ row: parseInt(e.target.value, 10) || 0 })}
            className="wp-input"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="wp-label">No. of holes</span>
          <input
            type="number"
            min={1}
            max={10}
            value={form.holeCount}
            onChange={e => set({ holeCount: parseInt(e.target.value, 10) || 1 })}
            className="wp-input"
          />
        </label>

        {form.holeCount > 1 && (
          <LengthInput label="Hole spacing" unitSystem={unitSystem} mmValue={form.holeSpacing} onChange={(mm) => set({ holeSpacing: mm })} allowNegative={false} min={0.1} />
        )}

        <LengthInput label="Hole offset from centre" unitSystem={unitSystem} mmValue={form.holeOffset} onChange={(mm) => set({ holeOffset: mm })} />

        <LengthInput label="Hole vertical offset" unitSystem={unitSystem} mmValue={form.holeVerticalOffset ?? 0} onChange={(mm) => set({ holeVerticalOffset: mm })} />

        <div className="flex flex-col gap-1.5">
          <LengthInput label="Gutter before" unitSystem={unitSystem} mmValue={form.gutterBefore ?? 0} onChange={(mm) => set({ gutterBefore: mm })} allowNegative={false} min={0} />
          {form.gutterBefore !== undefined && (
            <button type="button" className="wp-btn-secondary" onClick={() => set({ gutterBefore: undefined })}>
              Use wall default gutter
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" className="wp-btn-primary">
          {initial ? 'Save changes' : 'Add item'}
        </button>
        <button type="button" onClick={onCancel} className="wp-btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
};
