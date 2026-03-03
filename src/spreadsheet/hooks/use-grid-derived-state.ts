import { useMemo } from 'react';
import type { CellCoordinate, DataState } from '../../core';
import { buildSelectionDerivedState } from '../selection-view';
import { normalizeRange } from '../selection';
import type { SelectionRange } from '../types';

/**
 * 셀 또는 범위 오버레이의 픽셀 사각형 좌표입니다.
 */
export interface GridCellRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * `useGridDerivedState` 훅 입력 옵션입니다.
 */
export interface UseGridDerivedStateOptions {
  dataState: DataState;
  rowHeaderWidth: number;
  defaultRowHeight: number;
  defaultColumnWidth: number;
  viewportHeight: number;
  scrollTop: number;
  dynamicBufferPx: number;
  selectionRanges: SelectionRange[];
  activeCell: CellCoordinate;
  columnWidths?: Record<number, number>;
  rowHeights?: Record<number, number>;
}

/**
 * `useGridDerivedState` 훅 결과 값입니다.
 */
export interface UseGridDerivedStateResult {
  totalGridWidth: number;
  totalGridHeight: number;
  contentWidth: number;
  visibleRows: number[];
  visibleCols: number[];
  selectedRowSet: Set<number>;
  selectedColSet: Set<number>;
  selectionOverlayRects: GridCellRect[];
  activeCellRect: GridCellRect;
  columnWidthsByIndex: number[];
  rowHeightsByIndex: number[];
  columnOffsets: number[];
  rowOffsets: number[];
}

/**
 * 렌더링에 필요한 파생 레이아웃/선택 상태를 계산합니다.
 *
 * - 스크롤/버퍼 입력으로 현재 표시해야 할 행 목록을 계산합니다.
 * - 선택 범위를 기반으로 헤더 강조용 행/열 집합을 계산합니다.
 * - 선택 오버레이와 활성 셀 오버레이의 픽셀 좌표를 생성합니다.
 *
 * @param options 그리드 크기, 스크롤, 선택 관련 입력값
 * @returns 렌더링에 바로 사용할 파생 상태 묶음
 */
export const useGridDerivedState = (options: UseGridDerivedStateOptions): UseGridDerivedStateResult => {
  const {
    dataState,
    rowHeaderWidth,
    defaultRowHeight,
    defaultColumnWidth,
    viewportHeight,
    scrollTop,
    dynamicBufferPx,
    selectionRanges,
    activeCell,
    columnWidths = {},
    rowHeights = {}
  } = options;

  const columnWidthsByIndex = useMemo(
    () =>
      Array.from({ length: dataState.cols }, (_, index) => {
        const value = columnWidths[index];
        return typeof value === 'number' ? Math.max(40, value) : defaultColumnWidth;
      }),
    [columnWidths, dataState.cols, defaultColumnWidth]
  );

  const rowHeightsByIndex = useMemo(
    () =>
      Array.from({ length: dataState.rows }, (_, index) => {
        const value = rowHeights[index];
        return typeof value === 'number' ? Math.max(20, value) : defaultRowHeight;
      }),
    [dataState.rows, defaultRowHeight, rowHeights]
  );

  const columnOffsets = useMemo(() => {
    const offsets = Array.from({ length: columnWidthsByIndex.length + 1 }, () => 0);
    for (let index = 0; index < columnWidthsByIndex.length; index += 1) {
      offsets[index + 1] = offsets[index] + columnWidthsByIndex[index];
    }
    return offsets;
  }, [columnWidthsByIndex]);

  const rowOffsets = useMemo(() => {
    const offsets = Array.from({ length: rowHeightsByIndex.length + 1 }, () => 0);
    for (let index = 0; index < rowHeightsByIndex.length; index += 1) {
      offsets[index + 1] = offsets[index] + rowHeightsByIndex[index];
    }
    return offsets;
  }, [rowHeightsByIndex]);

  const totalGridWidth = columnOffsets[columnOffsets.length - 1] ?? 0;
  const totalGridHeight = rowOffsets[rowOffsets.length - 1] ?? 0;
  const contentWidth = rowHeaderWidth + totalGridWidth;

  const visibleRows = useMemo(() => {
    if (dataState.rows <= 0) {
      return [];
    }

    const startY = Math.max(0, scrollTop - dynamicBufferPx);
    const endY = scrollTop + viewportHeight + dynamicBufferPx;
    let start = 0;
    while (start < dataState.rows && rowOffsets[start + 1] <= startY) {
      start += 1;
    }

    let end = start;
    while (end < dataState.rows && rowOffsets[end] < endY) {
      end += 1;
    }

    return Array.from({ length: Math.max(0, end - start) }, (_, index) => start + index);
  }, [dataState.rows, dynamicBufferPx, rowOffsets, scrollTop, viewportHeight]);

  const visibleCols = useMemo(() => Array.from({ length: dataState.cols }, (_, index) => index), [dataState.cols]);

  const { selectedRowSet, selectedColSet } = useMemo(
    () =>
      buildSelectionDerivedState({
        ranges: selectionRanges,
        visibleRows,
        visibleCols
      }),
    [selectionRanges, visibleRows, visibleCols]
  );

  const selectionOverlayRects = useMemo(
    () =>
      selectionRanges.map((range) => {
        const normalized = normalizeRange(range);
        return {
          top: rowOffsets[normalized.top] ?? 0,
          left: rowHeaderWidth + (columnOffsets[normalized.left] ?? 0),
          width:
            (columnOffsets[normalized.right + 1] ?? columnOffsets[normalized.right] ?? 0) -
            (columnOffsets[normalized.left] ?? 0),
          height: (rowOffsets[normalized.bottom + 1] ?? rowOffsets[normalized.bottom] ?? 0) - (rowOffsets[normalized.top] ?? 0)
        };
      }),
    [selectionRanges, rowOffsets, rowHeaderWidth, columnOffsets]
  );

  const activeCellRect = useMemo(
    () => ({
      top: rowOffsets[activeCell.rowIndex] ?? 0,
      left: rowHeaderWidth + (columnOffsets[activeCell.colIndex] ?? 0),
      width: columnWidthsByIndex[activeCell.colIndex] ?? defaultColumnWidth,
      height: rowHeightsByIndex[activeCell.rowIndex] ?? defaultRowHeight
    }),
    [activeCell, rowOffsets, rowHeaderWidth, columnOffsets, columnWidthsByIndex, defaultColumnWidth, rowHeightsByIndex, defaultRowHeight]
  );

  return {
    totalGridWidth,
    totalGridHeight,
    contentWidth,
    visibleRows,
    visibleCols,
    selectedRowSet,
    selectedColSet,
    selectionOverlayRects,
    activeCellRect,
    columnWidthsByIndex,
    rowHeightsByIndex,
    columnOffsets,
    rowOffsets
  };
};
