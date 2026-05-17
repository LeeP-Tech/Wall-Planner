import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MeasurementTable } from './MeasurementTable';
import type { HoleResult } from '../lib/types';

const ITEM_ID = 'item-1';
const ITEM_ID_2 = 'item-2';

const makeHole = (overrides: Partial<HoleResult>): HoleResult => ({
  itemId: ITEM_ID,
  itemName: 'Picture 1',
  holeIndex: 0,
  fromLeft: 1000,
  fromRight: 1500,
  fromTop: 900,
  fromBottom: 1100,
  fromCenter: -250,
  fromVerticalCenter: -100,
  distToNextHole: undefined,
  ...overrides,
});

describe('MeasurementTable', () => {
  it('shows empty state when there are no holes', () => {
    render(<MeasurementTable holes={[]} orderedItemIds={[]} unitSystem="metric" accuracyStepMm={5} />);
    expect(screen.getByText('Add items to see measurements.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Drill positions' })).toBeInTheDocument();
  });

  it('renders the table heading when holes are present', () => {
    const holes = [makeHole({})];
    render(<MeasurementTable holes={holes} orderedItemIds={[ITEM_ID]} unitSystem="metric" accuracyStepMm={5} />);
    expect(screen.getByRole('heading', { name: 'Drill positions' })).toBeInTheDocument();
  });

  it('renders the item name', () => {
    const holes = [makeHole({})];
    render(<MeasurementTable holes={holes} orderedItemIds={[ITEM_ID]} unitSystem="metric" accuracyStepMm={5} />);
    expect(screen.getByText('Picture 1')).toBeInTheDocument();
  });

  it('renders measurement values in metric (cm)', () => {
    // fromLeft = 1000mm = 100cm
    const holes = [makeHole({ fromLeft: 1000, fromRight: 1500, fromTop: 900, fromBottom: 1100 })];
    render(<MeasurementTable holes={holes} orderedItemIds={[ITEM_ID]} unitSystem="metric" accuracyStepMm={5} />);
    expect(screen.getByText('100 cm')).toBeInTheDocument();
    expect(screen.getByText('150 cm')).toBeInTheDocument();
    expect(screen.getByText('90 cm')).toBeInTheDocument();
    expect(screen.getByText('110 cm')).toBeInTheDocument();
  });

  it('renders measurement values in imperial (ft/in)', () => {
    // fromLeft = 304.8mm = exactly 1 ft
    const holes = [makeHole({ fromLeft: 304.8 })];
    render(<MeasurementTable holes={holes} orderedItemIds={[ITEM_ID]} unitSystem="imperial" accuracyStepMm={5} />);
    expect(screen.getByText("1' 0\"")).toBeInTheDocument();
  });

  it('shows "—" for gap to next hole on a single-hole item', () => {
    const holes = [makeHole({ distToNextHole: undefined })];
    render(<MeasurementTable holes={holes} orderedItemIds={[ITEM_ID]} unitSystem="metric" accuracyStepMm={5} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows gap value for multi-hole items except the last', () => {
    const holes = [
      makeHole({ holeIndex: 0, distToNextHole: 200 }),
      makeHole({ holeIndex: 1, distToNextHole: undefined }),
    ];
    render(<MeasurementTable holes={holes} orderedItemIds={[ITEM_ID]} unitSystem="metric" accuracyStepMm={5} />);
    expect(screen.getByText('20 cm')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('prefixes positive fromCenter with "+"', () => {
    const holes = [makeHole({ fromCenter: 440 })];
    render(<MeasurementTable holes={holes} orderedItemIds={[ITEM_ID]} unitSystem="metric" accuracyStepMm={5} />);
    expect(screen.getByText('+44 cm')).toBeInTheDocument();
  });

  it('shows negative fromCenter with "−" prefix', () => {
    const holes = [makeHole({ fromCenter: -440 })];
    render(<MeasurementTable holes={holes} orderedItemIds={[ITEM_ID]} unitSystem="metric" accuracyStepMm={5} />);
    expect(screen.getByText('-44 cm')).toBeInTheDocument();
  });

  it('shows "0 cm" (no sign) when fromCenter is zero', () => {
    const holes = [makeHole({ fromCenter: 0 })];
    render(<MeasurementTable holes={holes} orderedItemIds={[ITEM_ID]} unitSystem="metric" accuracyStepMm={5} />);
    expect(screen.getByText('0 cm')).toBeInTheDocument();
  });

  it('renders multiple items with their names', () => {
    const holes = [
      makeHole({ itemId: ITEM_ID, itemName: 'Picture 1' }),
      makeHole({ itemId: ITEM_ID_2, itemName: 'Shelf' }),
    ];
    render(<MeasurementTable holes={holes} orderedItemIds={[ITEM_ID, ITEM_ID_2]} unitSystem="metric" accuracyStepMm={5} />);
    expect(screen.getByText('Picture 1')).toBeInTheDocument();
    expect(screen.getByText('Shelf')).toBeInTheDocument();
  });

  it('renders the hole index number (1-based)', () => {
    const holes = [
      makeHole({ holeIndex: 0, distToNextHole: 200 }),
      makeHole({ holeIndex: 1, distToNextHole: undefined }),
    ];
    render(<MeasurementTable holes={holes} orderedItemIds={[ITEM_ID]} unitSystem="metric" accuracyStepMm={5} />);
    const rows = screen.getAllByRole('row');
    // rows[0] = header, rows[1] = hole 1, rows[2] = hole 2
    expect(within(rows[1]).getByText('1')).toBeInTheDocument();
    expect(within(rows[2]).getByText('2')).toBeInTheDocument();
  });

  it('renders the footnote about centre direction', () => {
    const holes = [makeHole({})];
    render(<MeasurementTable holes={holes} orderedItemIds={[ITEM_ID]} unitSystem="metric" accuracyStepMm={5} />);
    expect(screen.getByText(/negative = left of wall centre/i)).toBeInTheDocument();
  });

  it('respects accuracy rounding — 10mm step rounds 1050mm to 105 cm', () => {
    const holes = [makeHole({ fromLeft: 1050 })];
    render(<MeasurementTable holes={holes} orderedItemIds={[ITEM_ID]} unitSystem="metric" accuracyStepMm={10} />);
    expect(screen.getByText('105 cm')).toBeInTheDocument();
  });
});
