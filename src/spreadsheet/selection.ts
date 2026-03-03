import type { CellCoordinate } from '../core';
import type { SelectionRange } from './types';

export interface NormalizedRange {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * 값을 최소/최대 범위로 제한합니다.
 *
 * @param value 원본 값
 * @param min 최소값
 * @param max 최대값
 * @returns 제한된 값
 */
export const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

/**
 * 두 셀 좌표가 같은지 확인합니다.
 *
 * @param a 좌표 A
 * @param b 좌표 B
 * @returns 동일 좌표면 `true`
 */
export const isSameCell = (a: CellCoordinate, b: CellCoordinate): boolean =>
  a.rowIndex === b.rowIndex && a.colIndex === b.colIndex;

/**
 * 단일 셀 선택 범위를 생성합니다.
 *
 * @param cell 기준 셀
 * @returns anchor/focus가 동일한 범위
 */
export const createSingleRange = (cell: CellCoordinate): SelectionRange => ({
  anchor: cell,
  focus: cell
});

/**
 * 시트 전체를 덮는 선택 범위를 생성합니다.
 *
 * - 시작 셀(anchor)은 항상 `(0, 0)`으로 고정합니다.
 * - 끝 셀(focus)은 전달받은 행/열 개수의 마지막 인덱스로 계산합니다.
 * - 최소 1x1 범위를 보장하기 위해 행/열 개수가 0 이하인 경우에도
 *   마지막 인덱스를 `0`으로 보정합니다.
 *
 * @param rowCount 시트의 전체 행 개수
 * @param colCount 시트의 전체 열 개수
 * @returns 시트 전체를 표현하는 선택 범위
 */
export const createFullSheetRange = (rowCount: number, colCount: number): SelectionRange => ({
  anchor: { rowIndex: 0, colIndex: 0 },
  focus: {
    rowIndex: Math.max(0, rowCount - 1),
    colIndex: Math.max(0, colCount - 1)
  }
});

/**
 * 선택 범위를 사각형 좌표로 정규화합니다.
 *
 * @param range 선택 범위
 * @returns top/bottom/left/right가 계산된 영역
 */
export const normalizeRange = (range: SelectionRange): NormalizedRange => ({
  top: Math.min(range.anchor.rowIndex, range.focus.rowIndex),
  bottom: Math.max(range.anchor.rowIndex, range.focus.rowIndex),
  left: Math.min(range.anchor.colIndex, range.focus.colIndex),
  right: Math.max(range.anchor.colIndex, range.focus.colIndex)
});

/**
 * 선택 범위 목록을 정규화된 사각형 목록으로 변환합니다.
 *
 * @param ranges 선택 범위 목록
 * @returns 정규화된 범위 목록
 */
export const normalizeRanges = (ranges: SelectionRange[]): NormalizedRange[] => ranges.map((range) => normalizeRange(range));

export interface RangeEdgeFlags {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
}

/**
 * 셀이 범위 안에 포함되는지 확인합니다.
 *
 * @param cell 대상 셀
 * @param range 선택 범위
 * @returns 포함되면 `true`
 */
export const isCellInRange = (cell: CellCoordinate, range: SelectionRange): boolean => {
  const normalized = normalizeRange(range);
  return (
    cell.rowIndex >= normalized.top &&
    cell.rowIndex <= normalized.bottom &&
    cell.colIndex >= normalized.left &&
    cell.colIndex <= normalized.right
  );
};

/**
 * 선택 범위 목록에서 특정 행이 포함되어 있는지 확인합니다.
 *
 * @param rowIndex 확인할 행 인덱스
 * @param ranges 선택 범위 목록
 * @returns 포함되면 `true`
 */
export const isRowInRanges = (rowIndex: number, ranges: SelectionRange[]): boolean =>
  ranges.some((range) => {
    const normalized = normalizeRange(range);
    return rowIndex >= normalized.top && rowIndex <= normalized.bottom;
  });

/**
 * 선택 범위 목록에서 특정 열이 포함되어 있는지 확인합니다.
 *
 * @param colIndex 확인할 열 인덱스
 * @param ranges 선택 범위 목록
 * @returns 포함되면 `true`
 */
export const isColInRanges = (colIndex: number, ranges: SelectionRange[]): boolean =>
  ranges.some((range) => {
    const normalized = normalizeRange(range);
    return colIndex >= normalized.left && colIndex <= normalized.right;
  });

/**
 * 셀이 선택 범위 외곽선의 어느 면에 걸쳐 있는지 계산합니다.
 *
 * @param cell 대상 셀 좌표
 * @param ranges 선택 범위 목록
 * @returns 외곽선 위치 플래그
 */
export const getCellRangeEdgeFlags = (cell: CellCoordinate, ranges: SelectionRange[]): RangeEdgeFlags => {
  const flags: RangeEdgeFlags = {
    top: false,
    right: false,
    bottom: false,
    left: false
  };

  ranges.forEach((range) => {
    const normalized = normalizeRange(range);
    const inside =
      cell.rowIndex >= normalized.top &&
      cell.rowIndex <= normalized.bottom &&
      cell.colIndex >= normalized.left &&
      cell.colIndex <= normalized.right;

    if (!inside) {
      return;
    }

    if (cell.rowIndex === normalized.top) {
      flags.top = true;
    }
    if (cell.rowIndex === normalized.bottom) {
      flags.bottom = true;
    }
    if (cell.colIndex === normalized.left) {
      flags.left = true;
    }
    if (cell.colIndex === normalized.right) {
      flags.right = true;
    }
  });

  return flags;
};
