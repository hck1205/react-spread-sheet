import { describe, expect, it } from 'vitest';
import { createFullSheetRange, getCellRangeEdgeFlags, isColInRanges, isRowInRanges } from './selection';
import type { SelectionRange } from './types';

const range = (anchorRow: number, anchorCol: number, focusRow: number, focusCol: number): SelectionRange => ({
  anchor: { rowIndex: anchorRow, colIndex: anchorCol },
  focus: { rowIndex: focusRow, colIndex: focusCol }
});

describe('spreadsheet/selection', () => {
  it('creates a full-sheet selection range', () => {
    expect(createFullSheetRange(10, 5)).toEqual({
      anchor: { rowIndex: 0, colIndex: 0 },
      focus: { rowIndex: 9, colIndex: 4 }
    });

    expect(createFullSheetRange(0, 0)).toEqual({
      anchor: { rowIndex: 0, colIndex: 0 },
      focus: { rowIndex: 0, colIndex: 0 }
    });
  });

  it('detects row/column membership in selection ranges', () => {
    const ranges = [range(2, 1, 4, 3)];

    expect(isRowInRanges(1, ranges)).toBe(false);
    expect(isRowInRanges(3, ranges)).toBe(true);
    expect(isColInRanges(0, ranges)).toBe(false);
    expect(isColInRanges(2, ranges)).toBe(true);
  });

  it('returns correct edge flags for selected perimeter cells', () => {
    const ranges = [range(2, 1, 4, 3)];

    expect(getCellRangeEdgeFlags({ rowIndex: 2, colIndex: 1 }, ranges)).toEqual({
      top: true,
      right: false,
      bottom: false,
      left: true
    });

    expect(getCellRangeEdgeFlags({ rowIndex: 3, colIndex: 2 }, ranges)).toEqual({
      top: false,
      right: false,
      bottom: false,
      left: false
    });

    expect(getCellRangeEdgeFlags({ rowIndex: 4, colIndex: 3 }, ranges)).toEqual({
      top: false,
      right: true,
      bottom: true,
      left: false
    });
  });

  it('merges edge flags across multi-ranges', () => {
    const ranges = [range(1, 1, 1, 1), range(1, 2, 2, 2)];
    expect(getCellRangeEdgeFlags({ rowIndex: 1, colIndex: 2 }, ranges)).toEqual({
      top: true,
      right: true,
      bottom: false,
      left: true
    });
  });
});
