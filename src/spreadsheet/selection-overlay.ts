import { normalizeRanges } from './selection';
import type { SelectionRange } from './types';

/**
 * 선택 오버레이 사각형 좌표 모델입니다.
 */
export interface SelectionOverlayRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * 선택 오버레이 계산 입력 옵션입니다.
 */
export interface SelectionOverlayOptions {
  ranges: SelectionRange[];
  rowHeight: number;
  columnWidth: number;
  rowHeaderWidth: number;
}

/**
 * 선택 범위 목록을 화면 오버레이 사각형 좌표로 변환합니다.
 *
 * - 모든 범위는 내부적으로 정규화(`top/bottom/left/right`) 후 계산합니다.
 * - `left` 좌표는 행 헤더 너비를 포함한 본문 그리드 기준 좌표입니다.
 * - 반환되는 사각형은 가시화 레이어에서 바로 사용할 수 있도록 픽셀 단위입니다.
 *
 * @param options 선택 범위와 셀/헤더 레이아웃 정보
 * @returns 선택 영역 오버레이 사각형 목록
 */
export const buildSelectionOverlayRects = (options: SelectionOverlayOptions): SelectionOverlayRect[] => {
  const normalizedRanges = normalizeRanges(options.ranges);

  return normalizedRanges.map((range) => ({
    top: range.top * options.rowHeight,
    left: options.rowHeaderWidth + range.left * options.columnWidth,
    width: (range.right - range.left + 1) * options.columnWidth,
    height: (range.bottom - range.top + 1) * options.rowHeight
  }));
};
