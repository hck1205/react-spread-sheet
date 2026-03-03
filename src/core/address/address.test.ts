import { describe, expect, it } from 'vitest';
import {
  columnIndexToLabel,
  columnLabelToIndex,
  fromA1Label,
  fromCellKey,
  toA1Label,
  toCellKey
} from './index';

describe('core/address', () => {
  it('converts between coordinate and map key', () => {
    const coord = { rowIndex: 7, colIndex: 3 };
    const key = toCellKey(coord);

    expect(key).toBe('7:3');
    expect(fromCellKey(key)).toEqual(coord);
  });

  it('converts between index and column labels', () => {
    expect(columnIndexToLabel(0)).toBe('A');
    expect(columnIndexToLabel(25)).toBe('Z');
    expect(columnIndexToLabel(26)).toBe('AA');
    expect(columnLabelToIndex('A')).toBe(0);
    expect(columnLabelToIndex('Z')).toBe(25);
    expect(columnLabelToIndex('AA')).toBe(26);
  });

  it('converts between coordinate and A1 label', () => {
    const coord = { rowIndex: 9, colIndex: 27 };
    const label = toA1Label(coord);

    expect(label).toBe('AB10');
    expect(fromA1Label(label)).toEqual(coord);
  });

  it('throws when A1 format is invalid', () => {
    expect(() => fromA1Label('1A')).toThrowError('Invalid A1 address: 1A');
  });
});
