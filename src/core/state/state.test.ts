import { describe, expect, it } from 'vitest';
import {
  createDataState,
  createSpreadsheetState,
  createUiState,
  getCell,
  setCell,
  setFocusedCell,
  setSelection
} from './index';

describe('core/state', () => {
  it('creates separated data and ui states', () => {
    const state = createSpreadsheetState({ rows: 5, cols: 4, storage: 'sparse' });

    expect(state.dataState.rows).toBe(5);
    expect(state.dataState.cols).toBe(4);
    expect(state.uiState.focusedCell).toBeNull();
    expect(state.uiState.selection.anchor).toBeNull();
  });

  it('setCell clones store and increments version', () => {
    const dataState = createDataState({ rows: 2, cols: 2, storage: 'dense' });
    const coord = { rowIndex: 0, colIndex: 0 };
    const nextState = setCell(dataState, coord, { value: '42', type: 'number', meta: {} });

    expect(dataState.version).toBe(0);
    expect(nextState.version).toBe(1);
    expect(getCell(nextState, coord).value).toBe('42');
    expect(getCell(dataState, coord).value).toBe('');
  });

  it('updates selection and focus independently in ui state', () => {
    const uiState = createUiState();
    const selected = setSelection(uiState, {
      anchor: { rowIndex: 1, colIndex: 1 },
      focus: { rowIndex: 2, colIndex: 2 }
    });
    const focused = setFocusedCell(selected, { rowIndex: 1, colIndex: 1 });

    expect(focused.selection.focus).toEqual({ rowIndex: 2, colIndex: 2 });
    expect(focused.focusedCell).toEqual({ rowIndex: 1, colIndex: 1 });
  });
});
