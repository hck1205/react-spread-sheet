import type { CellCoordinate } from '../../core';

/**
 * 셀 DOM dataset 구조입니다.
 */
export interface CellCoordinateDataset {
  rowIndex?: string;
  colIndex?: string;
}

/**
 * DOM dataset 값에서 셀 좌표를 안전하게 파싱합니다.
 *
 * - `rowIndex`, `colIndex`는 문자열 숫자여야 합니다.
 * - 둘 중 하나라도 누락되거나 숫자로 해석할 수 없으면 `null`을 반환합니다.
 * - 소수/음수 값도 숫자라면 허용하며, 범위 보정은 호출 측에서 처리합니다.
 *
 * @param dataset 셀 DOM 요소의 dataset 값
 * @returns 파싱된 셀 좌표 또는 `null`
 */
export const parseCellCoordinateFromDataset = (dataset: CellCoordinateDataset): CellCoordinate | null => {
  const rowIndex = Number(dataset.rowIndex);
  const colIndex = Number(dataset.colIndex);

  if (!Number.isFinite(rowIndex) || !Number.isFinite(colIndex)) {
    return null;
  }

  return {
    rowIndex,
    colIndex
  };
};

/**
 * 마우스 이벤트 타겟에서 가장 가까운 셀 요소를 찾아 좌표를 추출합니다.
 *
 * - 셀 요소는 `data-sheet-cell="true"` 속성을 가진 엘리먼트로 식별합니다.
 * - 타겟이 DOM Element가 아니거나, 셀 요소를 찾지 못하면 `null`을 반환합니다.
 * - dataset 파싱은 `parseCellCoordinateFromDataset`을 통해 일관되게 수행합니다.
 *
 * @param target 브라우저 이벤트의 `target`
 * @returns 셀 좌표 또는 `null`
 */
export const readCellCoordinateFromEventTarget = (target: EventTarget | null): CellCoordinate | null => {
  if (!(target instanceof Element)) {
    return null;
  }

  const cellElement = target.closest<HTMLElement>('[data-sheet-cell="true"]');
  if (!cellElement) {
    return null;
  }

  return parseCellCoordinateFromDataset({
    rowIndex: cellElement.dataset.rowIndex,
    colIndex: cellElement.dataset.colIndex
  });
};
