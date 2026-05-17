import React, { useEffect, useMemo, useState } from 'react';
import type { UnitSystem } from '../lib/types';
import {
  inputUnitLabel,
  mmToFeetInchesParts,
  parseDisplayNumberToMm,
  parseFeetInchesToMm,
  parseImperialTextToMm,
  toDisplayInput,
} from '../lib/units';

interface Props {
  label: string;
  unitSystem: UnitSystem;
  mmValue: number;
  allowNegative?: boolean;
  min?: number;
  step?: string;
  onChange: (mm: number) => void;
}

export const LengthInput: React.FC<Props> = ({
  label,
  unitSystem,
  mmValue,
  allowNegative = true,
  min,
  step = 'any',
  onChange,
}) => {
  const unit = inputUnitLabel(unitSystem);
  const [mainValue, setMainValue] = useState('');
  const [feetValue, setFeetValue] = useState('0');
  const [inchesValue, setInchesValue] = useState('0');
  const [freeTextValue, setFreeTextValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const feetInchesParts = useMemo(() => mmToFeetInchesParts(mmValue), [mmValue]);

  useEffect(() => {
    setMainValue(String(toDisplayInput(mmValue, unitSystem)));
    if (unitSystem === 'imperial') {
      setFeetValue(feetInchesParts.feet);
      setInchesValue(feetInchesParts.inches);
    }
  }, [mmValue, unitSystem, feetInchesParts.feet, feetInchesParts.inches]);

  const applyMm = (nextMm: number) => {
    if (!allowNegative && nextMm < 0) {
      setError('Value cannot be negative.');
      return;
    }
    setError(null);
    onChange(nextMm);
  };

  return (
    <label className="flex flex-col gap-1.5">
      <span className="wp-label">{`${label} (${unit})`}</span>
      <input
        type="number"
        min={min}
        step={step}
        value={mainValue}
        onChange={(e) => {
          const raw = e.target.value;
          setMainValue(raw);
          const parsed = parseDisplayNumberToMm(raw, unitSystem, { allowNegative, emptyAsZero: true });
          if (!parsed.ok) {
            setError(parsed.error);
            return;
          }
          applyMm(parsed.mm);
        }}
        className="wp-input"
      />

      {unitSystem === 'imperial' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              step="1"
              value={feetValue}
              onChange={(e) => {
                const raw = e.target.value;
                setFeetValue(raw);
                const parsed = parseFeetInchesToMm(raw, inchesValue);
                if (!parsed.ok) {
                  setError(parsed.error);
                  return;
                }
                applyMm(parsed.mm);
              }}
              className="wp-input"
              placeholder="ft"
              title="Feet"
            />
            <input
              type="number"
              step="any"
              value={inchesValue}
              onChange={(e) => {
                const raw = e.target.value;
                setInchesValue(raw);
                const parsed = parseFeetInchesToMm(feetValue, raw);
                if (!parsed.ok) {
                  setError(parsed.error);
                  return;
                }
                applyMm(parsed.mm);
              }}
              className="wp-input"
              placeholder="in"
              title="Inches"
            />
          </div>
          <input
            type="text"
            value={freeTextValue}
            onChange={(e) => setFreeTextValue(e.target.value)}
            onBlur={() => {
              if (!freeTextValue.trim()) return;
              const parsed = parseImperialTextToMm(freeTextValue);
              if (!parsed.ok) {
                setError(parsed.error);
                return;
              }
              applyMm(parsed.mm);
              setFreeTextValue('');
            }}
            className="wp-input"
            placeholder={"Imperial text, e.g. 5' 7\" or 67in"}
          />
        </>
      )}

      {error && <span className="text-xs" style={{ color: 'var(--lt-red)' }}>{error}</span>}
    </label>
  );
};
