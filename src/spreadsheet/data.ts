import { createSpreadsheetState, EMPTY_CELL, getCell, setCell, type DataState, type SpreadsheetCell } from '../core';
import type { SelectionRange, SpreadsheetValue } from './types';
import { normalizeRange } from './selection';

interface CreateInitialDataStateOptions {
  rows: number;
  cols: number;
  storage: 'sparse' | 'dense';
  initialValue?: SpreadsheetValue;
}

/**
 * 초기 rows/cols/initialValue를 기반으로 dataState를 생성합니다.
 *
 * @param options 초기 상태 옵션
 * @returns 생성된 dataState
 */
export const createInitialDataState = ({
  rows,
  cols,
  storage,
  initialValue
}: CreateInitialDataStateOptions): DataState => {
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

  return createSpreadsheetState({
    rows,
    cols,
    storage,
    initialCells
  }).dataState;
};

/**
 * 특정 셀 값을 기록한 다음 dataState를 반환합니다.
 *
 * @param prevState 기존 dataState
 * @param rowIndex 행 인덱스
 * @param colIndex 열 인덱스
 * @param nextValue 새 값
 * @returns 셀 값이 반영된 dataState
 */
export const writeCellValue = (
  prevState: DataState,
  rowIndex: number,
  colIndex: number,
  nextValue: string
): DataState => {
  const prevCell = getCell(prevState, { rowIndex, colIndex });
  const nextCell: SpreadsheetCell = {
    ...prevCell,
    value: nextValue,
    type: nextValue === '' ? 'empty' : 'text'
  };
  return setCell(prevState, { rowIndex, colIndex }, nextCell);
};

/**
 * 선택된 range들에 포함된 모든 셀 값을 비웁니다.
 *
 * @param prevState 기존 dataState
 * @param ranges 선택 range 목록
 * @returns 값이 변경된 경우 새 dataState, 변경 없으면 원본 상태
 */
export const clearRangesValue = (prevState: DataState, ranges: SelectionRange[]): DataState => {
  const nextStore = prevState.store.clone();
  let changed = false;

  ranges.forEach((range) => {
    const normalized = normalizeRange(range);
    for (let rowIndex = normalized.top; rowIndex <= normalized.bottom; rowIndex += 1) {
      for (let colIndex = normalized.left; colIndex <= normalized.right; colIndex += 1) {
        const coord = { rowIndex, colIndex };
        if (!nextStore.hasCell(coord)) {
          continue;
        }

        changed = true;
        nextStore.setCell(coord, EMPTY_CELL);
      }
    }
  });

  if (!changed) {
    return prevState;
  }

  return {
    ...prevState,
    store: nextStore,
    version: prevState.version + 1
  };
};
