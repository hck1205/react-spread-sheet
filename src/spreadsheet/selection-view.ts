import type { CellCoordinate } from '../core';
import type { SelectionRange } from './types';
import { normalizeRanges, type NormalizedRange } from './selection';

export interface SelectionDerivedOptions {
  ranges: SelectionRange[];
  visibleRows?: number[];
  visibleCols?: number[];
}

export interface SelectionDerivedState {
  normalizedRanges: NormalizedRange[];
  selectedRowSet: Set<number>;
  selectedColSet: Set<number>;
}

/**
 * 선택 범위 목록에서 렌더링에 필요한 파생 상태를 구성합니다.
 *
 * @param options 선택 범위 + 화면에 표시 중인 행/열 인덱스 목록
 * @returns 정규화 범위 + 선택된 행/열 집합
 */
export const buildSelectionDerivedState = (options: SelectionDerivedOptions): SelectionDerivedState => {
  const normalized = normalizeRanges(options.ranges);
  const rowSet = new Set<number>();
  const colSet = new Set<number>();

  if (options.visibleRows) {
    options.visibleRows.forEach((rowIndex) => {
      if (isRowSelectedByRanges(rowIndex, normalized)) {
        rowSet.add(rowIndex);
      }
    });
  } else {
    normalized.forEach((range) => {
      for (let rowIndex = range.top; rowIndex <= range.bottom; rowIndex += 1) {
        rowSet.add(rowIndex);
      }
    });
  }

  if (options.visibleCols) {
    options.visibleCols.forEach((colIndex) => {
      if (isColumnSelectedByRanges(colIndex, normalized)) {
        colSet.add(colIndex);
      }
    });
  } else {
    normalized.forEach((range) => {
      for (let colIndex = range.left; colIndex <= range.right; colIndex += 1) {
        colSet.add(colIndex);
      }
    });
  }

  return {
    normalizedRanges: normalized,
    selectedRowSet: rowSet,
    selectedColSet: colSet
  };
};

/**
 * 셀이 정규화된 선택 범위 목록에 포함되는지 확인합니다.
 *
 * @param cell 대상 셀
 * @param normalizedRanges 정규화된 범위 목록
 * @returns 포함되면 `true`
 */
export const isCellSelectedByRanges = (cell: CellCoordinate, normalizedRanges: NormalizedRange[]): boolean =>
  normalizedRanges.some(
    (range) =>
      cell.rowIndex >= range.top &&
      cell.rowIndex <= range.bottom &&
      cell.colIndex >= range.left &&
      cell.colIndex <= range.right
  );

/**
 * 행 인덱스가 정규화된 선택 범위 목록에 포함되는지 확인합니다.
 *
 * @param rowIndex 대상 행 인덱스
 * @param normalizedRanges 정규화된 범위 목록
 * @returns 포함되면 `true`
 */
export const isRowSelectedByRanges = (rowIndex: number, normalizedRanges: NormalizedRange[]): boolean =>
  normalizedRanges.some((range) => rowIndex >= range.top && rowIndex <= range.bottom);

/**
 * 열 인덱스가 정규화된 선택 범위 목록에 포함되는지 확인합니다.
 *
 * @param colIndex 대상 열 인덱스
 * @param normalizedRanges 정규화된 범위 목록
 * @returns 포함되면 `true`
 */
export const isColumnSelectedByRanges = (colIndex: number, normalizedRanges: NormalizedRange[]): boolean =>
  normalizedRanges.some((range) => colIndex >= range.left && colIndex <= range.right);

/**
 * 셀의 선택 외곽선 box-shadow 문자열을 계산합니다.
 *
 * @param cell 대상 셀
 * @param normalizedRanges 정규화된 범위 목록
 * @param lineColor 외곽선 색상
 * @returns box-shadow 문자열 또는 `undefined`
 */
export const getSelectionOutlineShadow = (
  cell: CellCoordinate,
  normalizedRanges: NormalizedRange[],
  lineColor: string
): string | undefined => {
  let top = false;
  let right = false;
  let bottom = false;
  let left = false;

  normalizedRanges.forEach((range) => {
    const inside =
      cell.rowIndex >= range.top &&
      cell.rowIndex <= range.bottom &&
      cell.colIndex >= range.left &&
      cell.colIndex <= range.right;

    if (!inside) {
      return;
    }

    if (cell.rowIndex === range.top) {
      top = true;
    }
    if (cell.rowIndex === range.bottom) {
      bottom = true;
    }
    if (cell.colIndex === range.left) {
      left = true;
    }
    if (cell.colIndex === range.right) {
      right = true;
    }
  });

  const shadows: string[] = [];
  if (top) {
    shadows.push(`inset 0 1px 0 0 ${lineColor}`);
  }
  if (bottom) {
    shadows.push(`inset 0 -1px 0 0 ${lineColor}`);
  }
  if (left) {
    shadows.push(`inset 1px 0 0 0 ${lineColor}`);
  }
  if (right) {
    shadows.push(`inset -1px 0 0 0 ${lineColor}`);
  }

  return shadows.length > 0 ? shadows.join(', ') : undefined;
};
