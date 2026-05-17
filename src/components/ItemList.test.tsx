import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ItemList } from './ItemList';
import type { ItemDef, WallConfig } from '../lib/types';

const WALL_CONFIG: WallConfig = {
  width: 2500,
  height: 2000,
  alignment: 'centered',
  startOffset: 0,
  rowGutter: 100,
  defaultGutter: 50,
  centerHeightAt: 1000,
};

const makeItem = (overrides: Partial<ItemDef> = {}): ItemDef => ({
  id: `item-${Math.random()}`,
  name: 'Picture',
  width: 500,
  height: 400,
  row: 0,
  holeCount: 1,
  holeSpacing: 200,
  holeOffset: 0,
  holeVerticalOffset: 0,
  gutterBefore: undefined,
  ...overrides,
});

const defaultProps = {
  wallConfig: WALL_CONFIG,
  unitSystem: 'metric' as const,
  accuracyStepMm: 5 as const,
  onChange: vi.fn(),
};

describe('ItemList', () => {
  describe('empty state', () => {
    it('shows empty message when there are no items', () => {
      render(<ItemList {...defaultProps} items={[]} />);
      expect(screen.getByText(/no items yet/i)).toBeInTheDocument();
    });

    it('does not show empty message when there are items', () => {
      render(<ItemList {...defaultProps} items={[makeItem({ name: 'Shelf' })]} />);
      expect(screen.queryByText(/no items yet/i)).not.toBeInTheDocument();
    });
  });

  describe('item display', () => {
    it('renders item names', () => {
      const items = [makeItem({ name: 'Sunset Photo' }), makeItem({ name: 'Mirror' })];
      render(<ItemList {...defaultProps} items={items} />);
      expect(screen.getByText('Sunset Photo')).toBeInTheDocument();
      expect(screen.getByText('Mirror')).toBeInTheDocument();
    });

    it('shows hole count in item summary for single hole', () => {
      render(<ItemList {...defaultProps} items={[makeItem({ holeCount: 1 })]} />);
      expect(screen.getByText(/1 hole/)).toBeInTheDocument();
    });

    it('shows hole count and spacing for multi-hole items', () => {
      render(<ItemList {...defaultProps} items={[makeItem({ holeCount: 3, holeSpacing: 200 })]} />);
      expect(screen.getByText(/3 holes/)).toBeInTheDocument();
    });
  });

  describe('adding items', () => {
    it('shows the add form when "+ Add item" is clicked', async () => {
      const user = userEvent.setup();
      render(<ItemList {...defaultProps} items={[]} />);
      await user.click(screen.getByRole('button', { name: /\+ add item/i }));
      expect(screen.getByText('New item')).toBeInTheDocument();
    });

    it('hides the add button while the form is open', async () => {
      const user = userEvent.setup();
      render(<ItemList {...defaultProps} items={[]} />);
      await user.click(screen.getByRole('button', { name: /\+ add item/i }));
      expect(screen.queryByRole('button', { name: /\+ add item/i })).not.toBeInTheDocument();
    });

    it('calls onChange with new item when form is submitted', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ItemList {...defaultProps} items={[]} onChange={onChange} />);
      await user.click(screen.getByRole('button', { name: /\+ add item/i }));
      await user.type(screen.getByRole('textbox', { name: /name/i }), 'New Frame');
      await user.click(screen.getByRole('button', { name: 'Add item' }));
      expect(onChange).toHaveBeenCalledOnce();
      expect(onChange.mock.calls[0][0][0].name).toBe('New Frame');
    });

    it('hides the form and shows the button again on Cancel', async () => {
      const user = userEvent.setup();
      render(<ItemList {...defaultProps} items={[]} />);
      await user.click(screen.getByRole('button', { name: /\+ add item/i }));
      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(screen.queryByText('New item')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /\+ add item/i })).toBeInTheDocument();
    });
  });

  describe('editing items', () => {
    it('shows the edit form when Edit is clicked', async () => {
      const user = userEvent.setup();
      const item = makeItem({ name: 'Clock' });
      render(<ItemList {...defaultProps} items={[item]} />);
      await user.click(screen.getByRole('button', { name: 'Edit' }));
      expect(screen.getByText('Edit item')).toBeInTheDocument();
    });

    it('prepopulates the edit form with the item name', async () => {
      const user = userEvent.setup();
      const item = makeItem({ name: 'Clock' });
      render(<ItemList {...defaultProps} items={[item]} />);
      await user.click(screen.getByRole('button', { name: 'Edit' }));
      expect(screen.getByRole('textbox', { name: /name/i })).toHaveValue('Clock');
    });

    it('calls onChange with updated item on save', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const item = makeItem({ name: 'Clock' });
      render(<ItemList {...defaultProps} items={[item]} onChange={onChange} />);
      await user.click(screen.getByRole('button', { name: 'Edit' }));
      const nameInput = screen.getByRole('textbox', { name: /name/i });
      await user.clear(nameInput);
      await user.type(nameInput, 'Wall Clock');
      await user.click(screen.getByRole('button', { name: 'Save changes' }));
      expect(onChange).toHaveBeenCalledOnce();
      expect(onChange.mock.calls[0][0][0].name).toBe('Wall Clock');
    });
  });

  describe('deleting items', () => {
    it('calls onChange without the deleted item', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const items = [makeItem({ id: 'a', name: 'A' }), makeItem({ id: 'b', name: 'B' })];
      render(<ItemList {...defaultProps} items={items} onChange={onChange} />);
      await user.click(screen.getAllByRole('button', { name: '✕' })[0]);
      expect(onChange).toHaveBeenCalledOnce();
      expect(onChange.mock.calls[0][0]).toHaveLength(1);
      expect(onChange.mock.calls[0][0][0].id).toBe('b');
    });
  });

  describe('copying items', () => {
    it('calls onChange with a copy inserted after the original', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const item = makeItem({ id: 'orig', name: 'Photo' });
      render(<ItemList {...defaultProps} items={[item]} onChange={onChange} />);
      await user.click(screen.getByRole('button', { name: 'Copy' }));
      expect(onChange).toHaveBeenCalledOnce();
      const result: ItemDef[] = onChange.mock.calls[0][0];
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('orig');
      expect(result[1].name).toBe('Photo (copy)');
      expect(result[1].id).not.toBe('orig');
    });
  });

  describe('reordering items', () => {
    it('disables the left arrow on the first item', () => {
      const items = [makeItem({ id: 'a', name: 'A' }), makeItem({ id: 'b', name: 'B' })];
      render(<ItemList {...defaultProps} items={items} />);
      const leftButtons = screen.getAllByRole('button', { name: '←' });
      expect(leftButtons[0]).toBeDisabled();
      expect(leftButtons[1]).not.toBeDisabled();
    });

    it('disables the right arrow on the last item', () => {
      const items = [makeItem({ id: 'a', name: 'A' }), makeItem({ id: 'b', name: 'B' })];
      render(<ItemList {...defaultProps} items={items} />);
      const rightButtons = screen.getAllByRole('button', { name: '→' });
      expect(rightButtons[0]).not.toBeDisabled();
      expect(rightButtons[1]).toBeDisabled();
    });

    it('moves an item left when left arrow is clicked', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const items = [makeItem({ id: 'a', name: 'A' }), makeItem({ id: 'b', name: 'B' })];
      render(<ItemList {...defaultProps} items={items} onChange={onChange} />);
      const rightButtons = screen.getAllByRole('button', { name: '←' });
      await user.click(rightButtons[1]); // move B left
      expect(onChange).toHaveBeenCalledOnce();
      const result: ItemDef[] = onChange.mock.calls[0][0];
      expect(result[0].id).toBe('b');
      expect(result[1].id).toBe('a');
    });
  });

  describe('auto rows button', () => {
    it('does not show Auto rows button with a single item', () => {
      render(<ItemList {...defaultProps} items={[makeItem()]} />);
      expect(screen.queryByRole('button', { name: /auto rows/i })).not.toBeInTheDocument();
    });

    it('shows Auto rows button with multiple items', () => {
      const items = [makeItem(), makeItem()];
      render(<ItemList {...defaultProps} items={items} />);
      expect(screen.getByRole('button', { name: /auto rows/i })).toBeInTheDocument();
    });
  });
});
