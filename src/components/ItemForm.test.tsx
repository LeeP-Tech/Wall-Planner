import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ItemForm } from './ItemForm';
import type { ItemDef } from '../lib/types';

const makeItem = (overrides: Partial<ItemDef> = {}): ItemDef => ({
  id: 'test-id',
  name: 'My Picture',
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

describe('ItemForm', () => {
  describe('mode headings', () => {
    it('shows "New item" heading when no initial is provided', () => {
      render(<ItemForm unitSystem="metric" onSave={vi.fn()} onCancel={vi.fn()} />);
      expect(screen.getByText('New item')).toBeInTheDocument();
    });

    it('shows "Edit item" heading when an initial item is provided', () => {
      render(<ItemForm initial={makeItem()} unitSystem="metric" onSave={vi.fn()} onCancel={vi.fn()} />);
      expect(screen.getByText('Edit item')).toBeInTheDocument();
    });

    it('shows "Add item" on the submit button for new items', () => {
      render(<ItemForm unitSystem="metric" onSave={vi.fn()} onCancel={vi.fn()} />);
      expect(screen.getByRole('button', { name: 'Add item' })).toBeInTheDocument();
    });

    it('shows "Save changes" on the submit button when editing', () => {
      render(<ItemForm initial={makeItem()} unitSystem="metric" onSave={vi.fn()} onCancel={vi.fn()} />);
      expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
    });
  });

  describe('hole spacing visibility', () => {
    it('hides hole spacing when holeCount is 1', () => {
      render(<ItemForm initial={makeItem({ holeCount: 1 })} unitSystem="metric" onSave={vi.fn()} onCancel={vi.fn()} />);
      expect(screen.queryByLabelText(/hole spacing/i)).not.toBeInTheDocument();
    });

    it('shows hole spacing when holeCount is greater than 1', async () => {
      render(<ItemForm initial={makeItem({ holeCount: 2 })} unitSystem="metric" onSave={vi.fn()} onCancel={vi.fn()} />);
      expect(screen.getByLabelText(/hole spacing/i)).toBeInTheDocument();
    });

    it('shows hole spacing after user increases holeCount to 2', async () => {
      const user = userEvent.setup();
      render(<ItemForm unitSystem="metric" onSave={vi.fn()} onCancel={vi.fn()} />);
      expect(screen.queryByLabelText(/hole spacing/i)).not.toBeInTheDocument();
      const holeCountInput = screen.getByRole('spinbutton', { name: /no\. of holes/i });
      await user.clear(holeCountInput);
      await user.type(holeCountInput, '2');
      expect(screen.getByLabelText(/hole spacing/i)).toBeInTheDocument();
    });
  });

  describe('gutter override', () => {
    it('does not show "Use wall default gutter" button when gutterBefore is undefined', () => {
      render(<ItemForm initial={makeItem({ gutterBefore: undefined })} unitSystem="metric" onSave={vi.fn()} onCancel={vi.fn()} />);
      expect(screen.queryByRole('button', { name: /use wall default gutter/i })).not.toBeInTheDocument();
    });

    it('shows "Use wall default gutter" button when gutterBefore is set', () => {
      render(<ItemForm initial={makeItem({ gutterBefore: 50 })} unitSystem="metric" onSave={vi.fn()} onCancel={vi.fn()} />);
      expect(screen.getByRole('button', { name: /use wall default gutter/i })).toBeInTheDocument();
    });

    it('hides "Use wall default gutter" button after clicking it', async () => {
      const user = userEvent.setup();
      render(<ItemForm initial={makeItem({ gutterBefore: 50 })} unitSystem="metric" onSave={vi.fn()} onCancel={vi.fn()} />);
      await user.click(screen.getByRole('button', { name: /use wall default gutter/i }));
      expect(screen.queryByRole('button', { name: /use wall default gutter/i })).not.toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    it('does not call onSave when name is empty', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      render(<ItemForm unitSystem="metric" onSave={onSave} onCancel={vi.fn()} />);
      await user.click(screen.getByRole('button', { name: 'Add item' }));
      expect(onSave).not.toHaveBeenCalled();
    });

    it('calls onSave with the item when name is filled in', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      render(<ItemForm unitSystem="metric" onSave={onSave} onCancel={vi.fn()} />);
      await user.type(screen.getByRole('textbox', { name: /name/i }), 'New Picture');
      await user.click(screen.getByRole('button', { name: 'Add item' }));
      expect(onSave).toHaveBeenCalledOnce();
      expect(onSave.mock.calls[0][0].name).toBe('New Picture');
    });

    it('calls onSave with updated values when editing', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      render(<ItemForm initial={makeItem({ name: 'Old Name' })} unitSystem="metric" onSave={onSave} onCancel={vi.fn()} />);
      const nameInput = screen.getByRole('textbox', { name: /name/i });
      await user.clear(nameInput);
      await user.type(nameInput, 'New Name');
      await user.click(screen.getByRole('button', { name: 'Save changes' }));
      expect(onSave).toHaveBeenCalledOnce();
      expect(onSave.mock.calls[0][0].name).toBe('New Name');
      expect(onSave.mock.calls[0][0].id).toBe('test-id');
    });

    it('calls onCancel when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(<ItemForm unitSystem="metric" onSave={vi.fn()} onCancel={onCancel} />);
      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(onCancel).toHaveBeenCalledOnce();
    });
  });

  describe('prepopulation', () => {
    it('prepopulates name from initial item', () => {
      render(<ItemForm initial={makeItem({ name: 'Sunset Photo' })} unitSystem="metric" onSave={vi.fn()} onCancel={vi.fn()} />);
      expect(screen.getByRole('textbox', { name: /name/i })).toHaveValue('Sunset Photo');
    });
  });
});
