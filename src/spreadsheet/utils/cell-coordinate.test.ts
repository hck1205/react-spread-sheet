import { describe, expect, it } from 'vitest';
import { parseCellCoordinateFromDataset } from './cell-coordinate';

describe('spreadsheet/utils/cell-coordinate', () => {
  it('parses valid numeric dataset values', () => {
    expect(parseCellCoordinateFromDataset({ rowIndex: '12', colIndex: '3' })).toEqual({
      rowIndex: 12,
      colIndex: 3
    });
  });

  it('returns null when dataset values are missing or invalid', () => {
    expect(parseCellCoordinateFromDataset({ rowIndex: '1' })).toBeNull();
    expect(parseCellCoordinateFromDataset({ colIndex: '1' })).toBeNull();
    expect(parseCellCoordinateFromDataset({ rowIndex: 'a', colIndex: '1' })).toBeNull();
  });
});
