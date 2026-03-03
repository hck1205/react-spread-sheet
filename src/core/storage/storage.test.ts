import { describe, expect, it } from 'vitest';
import { createGridDataStore, DenseGridStore, SparseGridStore } from './index';
import { EMPTY_CELL, type SpreadsheetCell } from '../model';

const textCell = (value: string): SpreadsheetCell => ({
  value,
  type: 'text',
  meta: {}
});

describe('core/storage', () => {
  it('DenseGridStore stores and returns cloned values', () => {
    const store = new DenseGridStore(2, 2);
    const coord = { rowIndex: 1, colIndex: 1 };

    store.setCell(coord, textCell('hello'));
    const fetched = store.getCell(coord);
    fetched.value = 'changed';

    expect(store.getCell(coord).value).toBe('hello');
    expect(store.hasCell(coord)).toBe(true);
  });

  it('SparseGridStore removes empty cells', () => {
    const store = new SparseGridStore(3, 3);
    const coord = { rowIndex: 0, colIndex: 2 };

    store.setCell(coord, textCell('x'));
    expect(store.hasCell(coord)).toBe(true);

    store.setCell(coord, EMPTY_CELL);
    expect(store.hasCell(coord)).toBe(false);
    expect(store.entries()).toEqual([]);
  });

  it('factory returns store by kind', () => {
    expect(createGridDataStore('dense', 1, 1)).toBeInstanceOf(DenseGridStore);
    expect(createGridDataStore('sparse', 1, 1)).toBeInstanceOf(SparseGridStore);
  });
});
