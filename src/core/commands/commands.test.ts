import { describe, expect, it } from 'vitest';
import { createSpreadsheetState, getCell } from '../state';
import type { SpreadsheetPlugin } from '../plugins';
import { ACTION_TYPE, COMMAND_KIND, EFFECT_TYPE } from './const';
import { createInitialReducerState, createSetCellCommand, spreadsheetReducer, type SpreadsheetAction } from './index';

describe('core/commands', () => {
  it('applies set-cell command and supports undo/redo', () => {
    const base = createInitialReducerState(createSpreadsheetState({ rows: 2, cols: 2 }));
    const coord = { rowIndex: 0, colIndex: 0 };

    const setAction: SpreadsheetAction = {
      type: ACTION_TYPE.COMMAND,
      command: createSetCellCommand(base, coord, { value: 'A', type: 'text', meta: {} })
    };

    const afterSet = spreadsheetReducer(base, setAction);
    expect(getCell(afterSet.dataState, coord).value).toBe('A');

    const afterUndo = spreadsheetReducer(afterSet, { type: ACTION_TYPE.HISTORY_UNDO });
    expect(getCell(afterUndo.dataState, coord).value).toBe('');

    const afterRedo = spreadsheetReducer(afterUndo, { type: ACTION_TYPE.HISTORY_REDO });
    expect(getCell(afterRedo.dataState, coord).value).toBe('A');
  });

  it('runs plugin hooks and can mutate command before execution', () => {
    const base = createInitialReducerState(createSpreadsheetState({ rows: 1, cols: 1 }));
    const coord = { rowIndex: 0, colIndex: 0 };

    const plugin: SpreadsheetPlugin = {
      name: 'uppercase',
      beforeCommand(context) {
        if (context.command.kind !== COMMAND_KIND.SET_CELL) {
          return context.command;
        }

        return {
          ...context.command,
          nextCell: {
            ...context.command.nextCell,
            value: context.command.nextCell.value.toUpperCase()
          }
        };
      }
    };

    const action: SpreadsheetAction = {
      type: ACTION_TYPE.COMMAND,
      command: createSetCellCommand(base, coord, { value: 'abc', type: 'text', meta: {} })
    };

    const next = spreadsheetReducer(base, action, [plugin]);
    expect(getCell(next.dataState, coord).value).toBe('ABC');
  });

  it('exposes static command/action/effect constants', () => {
    expect(COMMAND_KIND.SET_CELL).toBe('set-cell');
    expect(ACTION_TYPE.HISTORY_UNDO).toBe('history/undo');
    expect(EFFECT_TYPE.CELL_UPDATED).toBe('cell-updated');
  });
});
