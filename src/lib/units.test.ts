import { describe, expect, it } from 'vitest';
import {
  cmToMm,
  formatImperialFeetInches,
  formatLength,
  inchesToMm,
  mmToCm,
  parseDisplayNumberToMm,
  parseFeetInchesToMm,
  parseImperialTextToMm,
} from './units';

describe('units conversion', () => {
  it('converts cm to mm and back', () => {
    expect(cmToMm(12.5)).toBe(125);
    expect(mmToCm(250)).toBe(25);
  });

  it('converts inches to mm', () => {
    expect(inchesToMm(1)).toBeCloseTo(25.4, 6);
  });
});

describe('display parsing', () => {
  it('parses metric input as cm to mm', () => {
    const result = parseDisplayNumberToMm('25', 'metric', { allowNegative: false });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.mm).toBe(250);
    }
  });

  it('parses imperial decimal inches to mm', () => {
    const result = parseDisplayNumberToMm('10', 'imperial');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.mm).toBeCloseTo(254, 5);
    }
  });

  it('rejects negative values when configured', () => {
    const result = parseDisplayNumberToMm('-1', 'metric', { allowNegative: false });
    expect(result.ok).toBe(false);
  });
});

describe('imperial parsing and formatting', () => {
  it('parses split feet/inches values', () => {
    const result = parseFeetInchesToMm('5', '7');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.mm).toBeCloseTo(1701.8, 4);
    }
  });

  it('parses imperial free text values', () => {
    const result = parseImperialTextToMm('5\' 7"');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.mm).toBeCloseTo(1701.8, 4);
    }
  });

  it('formats imperial values as feet/inches', () => {
    expect(formatImperialFeetInches(1701.8)).toBe("5' 7\"");
  });

  it('formats based on selected unit system', () => {
    expect(formatLength(254, 'metric')).toBe('25.4 cm');
    expect(formatLength(254, 'imperial')).toBe("0' 10\"");
  });
});
