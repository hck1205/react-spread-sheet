import { useMemo, useReducer, useState } from 'react';
import {
  createInitialReducerState,
  createSetCellCommand,
  createSpreadsheetState,
  getCell,
  ACTION_TYPE,
  columnIndexToLabel,
  spreadsheetReducer,
  toA1Label,
  type DataStorageKind,
  type SpreadsheetAction,
  type RendererStrategy,
  type SpreadsheetCell,
  type SpreadsheetReducerState
} from './core';

export type SpreadsheetValue = string[][];

export interface SpreadsheetProps {
  rows?: number;
  cols?: number;
  initialValue?: SpreadsheetValue;
  className?: string;
  storage?: DataStorageKind;
  rendererStrategy?: RendererStrategy;
}

export function Spreadsheet({
  rows = 10,
  cols = 5,
  initialValue,
  className,
  storage = 'sparse',
  rendererStrategy = 'dom-table'
}: SpreadsheetProps) {
  const initialState = useMemo(() => {
    const initialCells: Array<{ coord: { rowIndex: number; colIndex: number }; cell: SpreadsheetCell }> = [];

    if (initialValue) {
      initialValue.forEach((row, rowIndex) => {
        row.forEach((value, colIndex) => {
          if (value !== '') {
            initialCells.push({
              coord: { rowIndex, colIndex },
              cell: { value, type: 'text', meta: {} }
            });
          }
        });
      });
    }

    return createInitialReducerState(
      createSpreadsheetState({
        rows,
        cols,
        storage,
        initialCells
      })
    );
  }, [cols, initialValue, rows, storage]);

  const [state, dispatch] = useReducer(
    (currentState: SpreadsheetReducerState, action: SpreadsheetAction) => spreadsheetReducer(currentState, action),
    initialState
  );
  const [activeCell, setActiveCell] = useState<{ rowIndex: number; colIndex: number } | null>(null);

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const coord = { rowIndex, colIndex };
    const prev = getCell(state.dataState, coord);
    const nextCell: SpreadsheetCell = {
      ...prev,
      value,
      type: value === '' ? 'empty' : 'text'
    };

    dispatch({
      type: ACTION_TYPE.COMMAND,
      command: createSetCellCommand(state, coord, nextCell)
    });
  };

  const activeAddress = activeCell ? toA1Label(activeCell) : 'A1';
  const activeValue = activeCell ? getCell(state.dataState, activeCell).value : '';

  return (
    <div className={className} style={{ fontFamily: 'Calibri, "Segoe UI", Arial, sans-serif' }}>
      <div className="mb-2 flex items-center gap-2 rounded border border-[#d4d4d4] bg-[#f3f3f3] p-2 text-sm">
        <div className="w-14 rounded border border-[#c8c8c8] bg-white px-2 py-1 text-center font-medium text-[#333]">
          {activeAddress}
        </div>
        <div className="flex-1 rounded border border-[#c8c8c8] bg-white px-3 py-1 text-[#333]">{activeValue}</div>
      </div>
      <div className="mb-2 text-[11px] text-slate-500">
        storage={state.dataState.storage}, renderer={rendererStrategy}
      </div>
      <div className="overflow-auto border border-[#bfbfbf] bg-white shadow-sm">
        <table className="min-w-full border-collapse bg-white">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-20 w-12 border border-[#d9d9d9] bg-[#f3f3f3] text-xs font-normal text-[#666]" />
              {Array.from({ length: state.dataState.cols }).map((_, colIndex) => (
                <th
                  key={`col-head-${colIndex}`}
                  className="sticky top-0 z-10 min-w-24 border border-[#d9d9d9] bg-[#f3f3f3] px-2 py-1 text-center text-xs font-normal text-[#444]"
                >
                  {columnIndexToLabel(colIndex)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: state.dataState.rows }).map((_, rowIndex) => (
              <tr key={`row-${rowIndex}`}>
                <th className="sticky left-0 z-10 w-12 border border-[#d9d9d9] bg-[#f3f3f3] px-1 py-1 text-center text-xs font-normal text-[#444]">
                  {rowIndex + 1}
                </th>
                {Array.from({ length: state.dataState.cols }).map((_, colIndex) => {
                  const coord = { rowIndex, colIndex };
                  const cell = getCell(state.dataState, coord);
                  const isActive =
                    activeCell?.rowIndex === rowIndex && activeCell?.colIndex === colIndex;

                  return (
                    <td key={`cell-${rowIndex}-${colIndex}`} className="min-w-24 border border-[#e6e6e6] p-0">
                      <input
                        className="h-7 w-full border border-transparent bg-white px-2 text-sm text-[#222] outline-none"
                        style={
                          isActive
                            ? {
                                borderColor: '#217346',
                                boxShadow: 'inset 0 0 0 1px #217346'
                              }
                            : undefined
                        }
                        value={cell.value}
                        onChange={(event) => updateCell(rowIndex, colIndex, event.target.value)}
                        onFocus={() => setActiveCell(coord)}
                        aria-label={toA1Label(coord)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
