import { useMemo } from 'react';
import type { CellCoordinate, DataState } from '../../core';
import { buildSelectionOverlayRects } from '../selection-overlay';
import { buildSelectionDerivedState } from '../selection-view';
import type { SelectionRange } from '../types';
import { getVisibleRowWindow } from '../virtualization';

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
    activeCell
  } = options;

  const totalGridWidth = dataState.cols * defaultColumnWidth;
  const totalGridHeight = dataState.rows * defaultRowHeight;
  const contentWidth = rowHeaderWidth + totalGridWidth;

  const { visibleRows } = useMemo(
    () =>
      getVisibleRowWindow({
        rowCount: dataState.rows,
        rowHeight: defaultRowHeight,
        viewportHeight,
        scrollTop,
        bufferPx: dynamicBufferPx
      }),
    [dataState.rows, defaultRowHeight, viewportHeight, scrollTop, dynamicBufferPx]
  );

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
      buildSelectionOverlayRects({
        ranges: selectionRanges,
        rowHeight: defaultRowHeight,
        columnWidth: defaultColumnWidth,
        rowHeaderWidth
      }),
    [selectionRanges, defaultRowHeight, defaultColumnWidth, rowHeaderWidth]
  );

  const activeCellRect = useMemo(
    () => ({
      top: activeCell.rowIndex * defaultRowHeight,
      left: rowHeaderWidth + activeCell.colIndex * defaultColumnWidth,
      width: defaultColumnWidth,
      height: defaultRowHeight
    }),
    [activeCell, defaultRowHeight, defaultColumnWidth, rowHeaderWidth]
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
    activeCellRect
  };
};
