import { describe, expect, it } from 'vitest';
import {
  buildSelectionDerivedState,
  getSelectionOutlineShadow,
  isCellSelectedByRanges,
  isColumnSelectedByRanges,
  isRowSelectedByRanges
} from './selection-view';
import type { SelectionRange } from './types';

const range = (anchorRow: number, anchorCol: number, focusRow: number, focusCol: number): SelectionRange => ({
  anchor: { rowIndex: anchorRow, colIndex: anchorCol },
  focus: { rowIndex: focusRow, colIndex: focusCol }
});

describe('spreadsheet/selection-view', () => {
  it('builds selected row/column sets from ranges', () => {
    const derived = buildSelectionDerivedState({
      ranges: [range(2, 1, 4, 3)],
      visibleRows: [1, 2, 3, 4, 5],
      visibleCols: [0, 1, 2, 3, 4]
    });

    expect(derived.selectedRowSet.has(2)).toBe(true);
    expect(derived.selectedRowSet.has(4)).toBe(true);
    expect(derived.selectedRowSet.has(1)).toBe(false);
    expect(derived.selectedColSet.has(1)).toBe(true);
    expect(derived.selectedColSet.has(3)).toBe(true);
    expect(derived.selectedColSet.has(0)).toBe(false);
  });

  it('checks cell selected status by normalized ranges', () => {
    const derived = buildSelectionDerivedState({ ranges: [range(1, 1, 2, 2)] });

    expect(isCellSelectedByRanges({ rowIndex: 1, colIndex: 1 }, derived.normalizedRanges)).toBe(true);
    expect(isCellSelectedByRanges({ rowIndex: 2, colIndex: 2 }, derived.normalizedRanges)).toBe(true);
    expect(isCellSelectedByRanges({ rowIndex: 3, colIndex: 3 }, derived.normalizedRanges)).toBe(false);
  });

  it('checks row and column selected status by normalized ranges', () => {
    const derived = buildSelectionDerivedState({ ranges: [range(3, 5, 6, 7)] });

    expect(isRowSelectedByRanges(3, derived.normalizedRanges)).toBe(true);
    expect(isRowSelectedByRanges(7, derived.normalizedRanges)).toBe(false);
    expect(isColumnSelectedByRanges(5, derived.normalizedRanges)).toBe(true);
    expect(isColumnSelectedByRanges(8, derived.normalizedRanges)).toBe(false);
  });

  it('returns outline shadow only on perimeter cells', () => {
    const derived = buildSelectionDerivedState({ ranges: [range(2, 2, 4, 4)] });

    const perimeter = getSelectionOutlineShadow({ rowIndex: 2, colIndex: 2 }, derived.normalizedRanges, '#1a73e8');
    const inside = getSelectionOutlineShadow({ rowIndex: 3, colIndex: 3 }, derived.normalizedRanges, '#1a73e8');

    expect(perimeter).toContain('inset 0 1px');
    expect(perimeter).toContain('inset 1px 0');
    expect(inside).toBeUndefined();
  });
});
