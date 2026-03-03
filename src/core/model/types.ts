import { CELL_TYPES, DATA_STORAGE_KINDS } from './const';

export type DataStorageKind = (typeof DATA_STORAGE_KINDS)[number];

export type CellType = (typeof CELL_TYPES)[number];

export interface CellMeta {
  format?: string;
  readOnly?: boolean;
  [key: string]: unknown;
}

export interface CellCoordinate {
  rowIndex: number;
  colIndex: number;
}

export interface SpreadsheetCell {
  value: string;
  type: CellType;
  meta: CellMeta;
}

/**
 * 스프레드시트 전역에서 재사용하는 기본 빈 셀 상수입니다.
 *
 * - dense 저장소는 초기 2차원 배열을 이 값으로 채웁니다.
 * - sparse 저장소는 "비어 있음" 판단의 기준값으로 사용합니다.
 *
 * @remarks
 * 이 객체 자체를 직접 수정하지 않고, 필요 시 `cloneCell`로 복제해 사용합니다.
 */
export const EMPTY_CELL: SpreadsheetCell = {
  value: '',
  type: 'empty',
  meta: {}
};

/**
 * 셀 객체를 깊은 복사(메타 객체 포함)하여 새 인스턴스로 반환합니다.
 *
 * @param cell 복사할 원본 셀
 * @returns 원본 참조와 분리된 새 셀 객체
 * @example
 * `const copied = cloneCell(originalCell)`
 */
export const cloneCell = (cell: SpreadsheetCell): SpreadsheetCell => ({
  value: cell.value,
  type: cell.type,
  meta: { ...cell.meta }
});

/**
 * 셀이 "완전한 빈 셀"인지 판별합니다.
 *
 * 판별 기준:
 * - `value === ''`
 * - `type === 'empty'`
 * - `meta`에 사용자 지정 속성이 없음
 *
 * @param cell 판별할 셀
 * @returns 완전한 빈 셀이면 `true`, 아니면 `false`
 */
export const isCellEmpty = (cell: SpreadsheetCell): boolean =>
  cell.value === '' && cell.type === 'empty' && Object.keys(cell.meta).length === 0;
