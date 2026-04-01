import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ItemDef } from '../lib/types';

interface Props {
  /** When set, we are editing an existing item; undefined = adding new */
  initial?: ItemDef;
  onSave: (item: ItemDef) => void;
  onCancel: () => void;
}

const blank = (): ItemDef => ({
  id: uuidv4(),
  name: '',
  width: 40,
  holeCount: 1,
  holeSpacing: 20,
  holeOffset: 0,
  gutterBefore: undefined,
});

export const ItemForm: React.FC<Props> = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState<ItemDef>(initial ?? blank());
  const set = (partial: Partial<ItemDef>) => setForm(f => ({ ...f, ...partial }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-indigo-800">{initial ? 'Edit item' : 'New item'}</h3>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 col-span-2 sm:col-span-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name</span>
          <input
            required
            type="text"
            value={form.name}
            onChange={e => set({ name: e.target.value })}
            placeholder="e.g. Large picture"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Width (cm)</span>
          <input
            type="number"
            min={0.1}
            step="any"
            value={form.width}
            onChange={e => set({ width: parseFloat(e.target.value) || 0 })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">No. of holes</span>
          <input
            type="number"
            min={1}
            max={10}
            value={form.holeCount}
            onChange={e => set({ holeCount: parseInt(e.target.value, 10) || 1 })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </label>

        {form.holeCount > 1 && (
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Hole spacing (cm)</span>
            <input
              type="number"
              min={0.1}
              step="any"
              value={form.holeSpacing}
              onChange={e => set({ holeSpacing: parseFloat(e.target.value) || 0 })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </label>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Hole offset from centre (cm)</span>
          <input
            type="number"
            step="any"
            value={form.holeOffset}
            onChange={e => set({ holeOffset: parseFloat(e.target.value) || 0 })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Gutter before (cm) — optional override</span>
          <input
            type="number"
            min={0}
            step="any"
            placeholder="Uses wall default"
            value={form.gutterBefore !== undefined ? form.gutterBefore : ''}
            onChange={e => {
              const v = e.target.value;
              set({ gutterBefore: v === '' ? undefined : parseFloat(v) });
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </label>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          {initial ? 'Save changes' : 'Add item'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
