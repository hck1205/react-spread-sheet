import { describe, expect, it } from 'vitest';
import { CELL_TYPES, DATA_STORAGE_KINDS, EMPTY_CELL, cloneCell, isCellEmpty, type SpreadsheetCell } from './index';

describe('core/model', () => {
  it('cloneCell creates a deep copy for meta object', () => {
    const source: SpreadsheetCell = {
      value: '10',
      type: 'number',
      meta: { format: '0.00' }
    };

    const cloned = cloneCell(source);
    cloned.meta.format = '0';

    expect(source.meta.format).toBe('0.00');
    expect(cloned).toEqual({
      value: '10',
      type: 'number',
      meta: { format: '0' }
    });
  });

  it('isCellEmpty only returns true for canonical empty shape', () => {
    expect(isCellEmpty(EMPTY_CELL)).toBe(true);
    expect(isCellEmpty({ value: '', type: 'text', meta: {} })).toBe(false);
    expect(isCellEmpty({ value: 'x', type: 'text', meta: {} })).toBe(false);
    expect(isCellEmpty({ value: '', type: 'empty', meta: { readOnly: true } })).toBe(false);
  });

  it('exposes static constants for type candidates', () => {
    expect(DATA_STORAGE_KINDS).toEqual(['sparse', 'dense']);
    expect(CELL_TYPES).toContain('formula');
  });
});
