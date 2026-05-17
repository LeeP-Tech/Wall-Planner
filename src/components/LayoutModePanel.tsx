import React from 'react';
import type { LayoutMode, LayoutParams, UnitSystem } from '../lib/types';
import { LengthInput } from './LengthInput';

interface Props {
  mode: LayoutMode;
  params: LayoutParams;
  unitSystem: UnitSystem;
  onModeChange: (mode: LayoutMode) => void;
  onParamsChange: (params: LayoutParams) => void;
}

const MODES: { value: LayoutMode; label: string; desc: string }[] = [
  { value: 'linear',      label: 'Linear',      desc: 'Horizontal rows' },
  { value: 'circular',    label: 'Circular',     desc: 'Ring / clock' },
  { value: 'hub-spoke',   label: 'Hub & spoke',  desc: 'Central hub + radiating items' },
  { value: 'splat',       label: 'Splat',        desc: 'Organic scatter' },
];

const ModeGlyph: React.FC<{ mode: LayoutMode; active: boolean }> = ({ mode, active }) => {
  const stroke = active ? 'var(--lt-cyan)' : 'var(--lt-subtle)';
  const fill = active ? 'rgba(0, 209, 255, 0.2)' : 'rgba(169,184,223,0.18)';

  if (mode === 'linear') {
    return (
      <svg width="58" height="40" viewBox="0 0 58 40" aria-hidden="true">
        <line x1="6" y1="20" x2="52" y2="20" stroke={stroke} strokeWidth="1.5" strokeDasharray="3 2" />
        <rect x="9" y="15" width="8" height="10" rx="2" fill={fill} stroke={stroke} strokeWidth="1.2" />
        <rect x="24" y="15" width="8" height="10" rx="2" fill={fill} stroke={stroke} strokeWidth="1.2" />
        <rect x="39" y="15" width="8" height="10" rx="2" fill={fill} stroke={stroke} strokeWidth="1.2" />
      </svg>
    );
  }

  if (mode === 'circular') {
    return (
      <svg width="58" height="40" viewBox="0 0 58 40" aria-hidden="true">
        <circle cx="29" cy="20" r="13" fill="none" stroke={stroke} strokeWidth="1.4" />
        <circle cx="29" cy="7" r="2.4" fill={fill} stroke={stroke} strokeWidth="1" />
        <circle cx="41" cy="20" r="2.4" fill={fill} stroke={stroke} strokeWidth="1" />
        <circle cx="29" cy="33" r="2.4" fill={fill} stroke={stroke} strokeWidth="1" />
        <circle cx="17" cy="20" r="2.4" fill={fill} stroke={stroke} strokeWidth="1" />
      </svg>
    );
  }

  if (mode === 'hub-spoke') {
    return (
      <svg width="58" height="40" viewBox="0 0 58 40" aria-hidden="true">
        <circle cx="29" cy="20" r="3" fill={fill} stroke={stroke} strokeWidth="1.2" />
        <line x1="29" y1="20" x2="45" y2="11" stroke={stroke} strokeWidth="1.2" />
        <line x1="29" y1="20" x2="45" y2="29" stroke={stroke} strokeWidth="1.2" />
        <line x1="29" y1="20" x2="13" y2="20" stroke={stroke} strokeWidth="1.2" />
        <circle cx="45" cy="11" r="2.4" fill={fill} stroke={stroke} strokeWidth="1" />
        <circle cx="45" cy="29" r="2.4" fill={fill} stroke={stroke} strokeWidth="1" />
        <circle cx="13" cy="20" r="2.4" fill={fill} stroke={stroke} strokeWidth="1" />
      </svg>
    );
  }

  return (
    <svg width="58" height="40" viewBox="0 0 58 40" aria-hidden="true">
      <circle cx="14" cy="11" r="2.2" fill={fill} stroke={stroke} strokeWidth="1" />
      <circle cx="27" cy="16" r="2.4" fill={fill} stroke={stroke} strokeWidth="1" />
      <circle cx="43" cy="10" r="2.2" fill={fill} stroke={stroke} strokeWidth="1" />
      <circle cx="17" cy="28" r="2.4" fill={fill} stroke={stroke} strokeWidth="1" />
      <circle cx="35" cy="30" r="2.2" fill={fill} stroke={stroke} strokeWidth="1" />
      <line x1="14" y1="11" x2="27" y2="16" stroke={stroke} strokeWidth="0.9" opacity="0.5" />
      <line x1="27" y1="16" x2="43" y2="10" stroke={stroke} strokeWidth="0.9" opacity="0.5" />
      <line x1="27" y1="16" x2="17" y2="28" stroke={stroke} strokeWidth="0.9" opacity="0.5" />
      <line x1="17" y1="28" x2="35" y2="30" stroke={stroke} strokeWidth="0.9" opacity="0.5" />
    </svg>
  );
};

export const LayoutModePanel: React.FC<Props> = ({ mode, params, unitSystem, onModeChange, onParamsChange }) => {
  const setCircular = (patch: Partial<LayoutParams['circular']>) =>
    onParamsChange({ ...params, circular: { ...params.circular, ...patch } });
  const setHubSpoke = (patch: Partial<LayoutParams['hub-spoke']>) =>
    onParamsChange({ ...params, 'hub-spoke': { ...params['hub-spoke'], ...patch } });
  const setSplat = (patch: Partial<LayoutParams['splat']>) =>
    onParamsChange({ ...params, splat: { ...params.splat, ...patch } });
  return (
    <div className="wp-panel no-print">
      <h2 className="wp-heading">Layout mode</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
        {MODES.map(({ value, label, desc }) => (
          <button
            key={value}
            className="wp-btn-secondary"
            onClick={() => onModeChange(value)}
            title={desc}
            style={{
              borderColor: mode === value ? 'var(--lt-cyan)' : undefined,
              color: mode === value ? 'var(--lt-cyan)' : undefined,
              textAlign: 'left',
              minHeight: 96,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span className="flex-shrink-0 w-[62px] h-[42px] rounded-md border flex items-center justify-center" style={{ borderColor: mode === value ? 'var(--lt-cyan)' : 'var(--lt-line)' }}>
              <ModeGlyph mode={value} active={mode === value} />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-sm">{label}</span>
              <span className="block text-xs opacity-60 font-normal">{desc}</span>
            </span>
          </button>
        ))}
      </div>

      {mode === 'circular' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <LengthInput label="Center X" unitSystem={unitSystem} mmValue={params.circular.centerX} onChange={(mm) => setCircular({ centerX: mm })} />
          <LengthInput label="Center Y" unitSystem={unitSystem} mmValue={params.circular.centerY} onChange={(mm) => setCircular({ centerY: mm })} />
          <LengthInput label="Radius" unitSystem={unitSystem} mmValue={params.circular.radius} onChange={(mm) => setCircular({ radius: mm })} allowNegative={false} min={0} />
          <label className="flex flex-col gap-1.5"><span className="wp-label">Start angle °</span>
            <input className="wp-input" type="number" value={params.circular.startAngleDeg} onChange={e => setCircular({ startAngleDeg: parseFloat(e.target.value) || 0 })} /></label>
        </div>
      )}

      {mode === 'hub-spoke' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <LengthInput label="Center X" unitSystem={unitSystem} mmValue={params['hub-spoke'].centerX} onChange={(mm) => setHubSpoke({ centerX: mm })} />
          <LengthInput label="Center Y" unitSystem={unitSystem} mmValue={params['hub-spoke'].centerY} onChange={(mm) => setHubSpoke({ centerY: mm })} />
          <LengthInput label="Radius" unitSystem={unitSystem} mmValue={params['hub-spoke'].radius} onChange={(mm) => setHubSpoke({ radius: mm })} allowNegative={false} min={0} />
        </div>
      )}

      {mode === 'splat' && (
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="wp-label">Seed (change for a different arrangement)</span>
            <div className="flex gap-2">
              <input className="wp-input flex-1" type="number" value={params.splat?.seed ?? 42}
                onChange={e => setSplat({ seed: parseInt(e.target.value, 10) || 0 })} />
              <button className="wp-btn-secondary" onClick={() => setSplat({ seed: Math.floor(Math.random() * 9999) })}>
                Shuffle
              </button>
            </div>
          </label>
        </div>
      )}
    </div>
  );
};
