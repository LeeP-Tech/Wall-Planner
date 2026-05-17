import type { AccuracyStepMm, UnitSystem } from './types';

export const MM_PER_CM = 10;
export const MM_PER_IN = 25.4;
export const IN_PER_FT = 12;
export const ACCURACY_STEP_OPTIONS_MM: AccuracyStepMm[] = [10, 5, 2, 1];

export type LengthParseResult =
  | { ok: true; mm: number }
  | { ok: false; error: string };

const round1 = (n: number) => Math.round(n * 10) / 10;
const roundToStep = (value: number, step: number): number => Math.round(value / step) * step;

export const cmToMm = (cm: number): number => cm * MM_PER_CM;
export const mmToCm = (mm: number): number => mm / MM_PER_CM;
export const inchesToMm = (inches: number): number => inches * MM_PER_IN;
export const mmToInches = (mm: number): number => mm / MM_PER_IN;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export const normalizeNumber = (value: number): number =>
  Object.is(value, -0) ? 0 : value;

export const inputUnitLabel = (unit: UnitSystem): string =>
  unit === 'metric' ? 'cm' : 'in';

export const tableUnitLabel = (unit: UnitSystem): string =>
  unit === 'metric' ? 'cm' : 'ft/in';

export const toDisplayInput = (mm: number, unit: UnitSystem): number => {
  if (!isFiniteNumber(mm)) return 0;
  const display = unit === 'metric' ? mmToCm(mm) : mmToInches(mm);
  return round1(display);
};

export const parseDisplayNumberToMm = (
  raw: string,
  unit: UnitSystem,
  opts?: { allowNegative?: boolean; emptyAsZero?: boolean },
): LengthParseResult => {
  const allowNegative = opts?.allowNegative ?? true;
  const emptyAsZero = opts?.emptyAsZero ?? true;
  const trimmed = raw.trim();
  if (!trimmed) {
    if (emptyAsZero) return { ok: true, mm: 0 };
    return { ok: false, error: 'Value is required.' };
  }

  const n = Number.parseFloat(trimmed);
  if (!Number.isFinite(n)) {
    return { ok: false, error: 'Enter a valid number.' };
  }
  if (!allowNegative && n < 0) {
    return { ok: false, error: 'Value cannot be negative.' };
  }

  const mm = unit === 'metric' ? cmToMm(n) : inchesToMm(n);
  return { ok: true, mm: normalizeNumber(mm) };
};

const gcd = (a: number, b: number): number => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
};

const toFraction = (inches: number, denominator: number): { whole: number; num: number; den: number } => {
  const whole = Math.floor(inches);
  const frac = inches - whole;
  const units = Math.round(frac * denominator);
  if (units === 0) return { whole, num: 0, den: 1 };
  if (units === denominator) return { whole: whole + 1, num: 0, den: 1 };
  const divisor = gcd(units, denominator);
  return { whole, num: units / divisor, den: denominator / divisor };
};

const denominatorForAccuracy = (accuracyStepMm: AccuracyStepMm): number => {
  const candidates = [2, 4, 8, 16, 32] as const;
  let best: number = candidates[0];
  let bestDiff = Infinity;
  for (const den of candidates) {
    const mmPerTick = MM_PER_IN / den;
    const diff = Math.abs(mmPerTick - accuracyStepMm);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = den;
    }
  }
  return best;
};

export const accuracyLabel = (step: AccuracyStepMm): string => {
  const den = denominatorForAccuracy(step);
  return `${step} mm (~1/${den} in)`;
};

export const formatImperialFeetInches = (mm: number, accuracyStepMm: AccuracyStepMm = 1): string => {
  const quantizedMm = roundToStep(mm, accuracyStepMm);
  const sign = quantizedMm < 0 ? '-' : '';
  const totalInches = Math.abs(mmToInches(quantizedMm));
  let feet = Math.floor(totalInches / IN_PER_FT);
  let inches = totalInches - feet * IN_PER_FT;
  const denominator = denominatorForAccuracy(accuracyStepMm);

  if (inches >= IN_PER_FT - 1e-9) {
    feet += 1;
    inches = 0;
  }

  const frac = toFraction(inches, denominator);
  let inchText = '';
  if (frac.num === 0) {
    inchText = `${frac.whole}`;
  } else if (frac.whole === 0) {
    inchText = `${frac.num}/${frac.den}`;
  } else {
    inchText = `${frac.whole} ${frac.num}/${frac.den}`;
  }

  return `${sign}${feet}' ${inchText}"`;
};

export const formatLength = (mm: number, unit: UnitSystem): string => {
  return formatLengthWithAccuracy(mm, unit, 1);
};

export const formatLengthWithAccuracy = (mm: number, unit: UnitSystem, accuracyStepMm: AccuracyStepMm): string => {
  const quantizedMm = roundToStep(mm, accuracyStepMm);
  if (unit === 'metric') {
    const cm = mmToCm(quantizedMm);
    const fixed = cm.toFixed(1);
    const trimmed = fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
    return `${trimmed} cm`;
  }
  return formatImperialFeetInches(quantizedMm, accuracyStepMm);
};

export const formatSignedLength = (mm: number, unit: UnitSystem, accuracyStepMm: AccuracyStepMm): string => {
  const prefix = mm > 0 ? '+' : '';
  return `${prefix}${formatLengthWithAccuracy(mm, unit, accuracyStepMm)}`;
};

export const parseFeetInchesToMm = (feetRaw: string, inchesRaw: string): LengthParseResult => {
  const feet = Number.parseInt(feetRaw.trim() || '0', 10);
  const inches = Number.parseFloat(inchesRaw.trim() || '0');
  if (!Number.isFinite(feet) || !Number.isFinite(inches)) {
    return { ok: false, error: 'Feet/inches values are invalid.' };
  }
  if (inches < 0) {
    return { ok: false, error: 'Inches cannot be negative.' };
  }
  const totalInches = feet * IN_PER_FT + inches;
  return { ok: true, mm: inchesToMm(totalInches) };
};

export const mmToFeetInchesParts = (mm: number): { feet: string; inches: string } => {
  const totalInches = mmToInches(mm);
  const sign = totalInches < 0 ? -1 : 1;
  const absInches = Math.abs(totalInches);
  const feetPart = Math.floor(absInches / IN_PER_FT);
  const inchPart = absInches - feetPart * IN_PER_FT;
  const signedFeet = sign < 0 ? -feetPart : feetPart;
  const roundedInches = Math.round(inchPart * 1000) / 1000;
  return {
    feet: String(signedFeet),
    inches: String(roundedInches),
  };
};

export const parseImperialTextToMm = (text: string): LengthParseResult => {
  const trimmed = text.trim().toLowerCase();
  if (!trimmed) return { ok: false, error: 'Value is required.' };

  const feetInches = trimmed.match(/^(-?\d+)\s*(?:ft|')\s*(\d+(?:\.\d+)?)?\s*(?:in|\")?$/i);
  if (feetInches) {
    const feet = Number.parseInt(feetInches[1], 10);
    const inches = Number.parseFloat(feetInches[2] ?? '0');
    if (!Number.isFinite(feet) || !Number.isFinite(inches)) {
      return { ok: false, error: 'Feet/inches values are invalid.' };
    }
    const sign = feet < 0 ? -1 : 1;
    const totalInches = Math.abs(feet) * IN_PER_FT + inches;
    return { ok: true, mm: sign * inchesToMm(totalInches) };
  }

  const inchesOnly = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*(?:in|\")$/i);
  if (inchesOnly) {
    const inches = Number.parseFloat(inchesOnly[1]);
    if (!Number.isFinite(inches)) return { ok: false, error: 'Inches value is invalid.' };
    return { ok: true, mm: inchesToMm(inches) };
  }

  return { ok: false, error: 'Use formats like 5\' 7\" or 67in.' };
};
