import type { CellCoordinate } from '../model';

const A_CODE = 'A'.charCodeAt(0);

/**
 * 좌표를 Map 키 문자열(`row:col`)로 직렬화합니다.
 *
 * @param coord 셀 좌표
 * @returns Map 저장에 사용하는 안정적인 키 문자열
 */
export const toCellKey = ({ rowIndex, colIndex }: CellCoordinate): string => `${rowIndex}:${colIndex}`;

/**
 * Map 키 문자열을 다시 좌표 객체로 역직렬화합니다.
 *
 * @param key `toCellKey`로 생성한 키 문자열
 * @returns 파싱된 좌표
 */
export const fromCellKey = (key: string): CellCoordinate => {
  const [row, col] = key.split(':').map(Number);

  return { rowIndex: row, colIndex: col };
};

/**
 * 0 기반 열 인덱스를 엑셀 스타일 열 라벨로 변환합니다.
 *
 * @param colIndex 0 기반 열 인덱스
 * @returns 열 라벨 (`0 -> A`, `25 -> Z`, `26 -> AA`)
 */
export const columnIndexToLabel = (colIndex: number): string => {
  let n = colIndex + 1;
  let out = '';

  while (n > 0) {
    const remainder = (n - 1) % 26;
    out = String.fromCharCode(A_CODE + remainder) + out;
    n = Math.floor((n - 1) / 26);
  }

  return out;
};

/**
 * 엑셀 스타일 열 라벨을 0 기반 열 인덱스로 변환합니다.
 *
 * @param label 열 라벨 (`A`, `Z`, `AA` 등)
 * @returns 0 기반 열 인덱스
 */
export const columnLabelToIndex = (label: string): number => {
  const normalized = label.trim().toUpperCase();
  let value = 0;

  for (const ch of normalized) {
    value = value * 26 + (ch.charCodeAt(0) - A_CODE + 1);
  }

  return value - 1;
};

/**
 * 내부 좌표를 A1 표기 문자열로 변환합니다.
 *
 * @param coord 내부 좌표
 * @returns A1 표기 주소 (`{rowIndex:0,colIndex:0} -> A1`)
 */
export const toA1Label = ({ rowIndex, colIndex }: CellCoordinate): string =>
  `${columnIndexToLabel(colIndex)}${rowIndex + 1}`;

/**
 * A1 표기 주소를 내부 0 기반 좌표로 파싱합니다.
 *
 * @param address A1 형식 주소 문자열
 * @returns 파싱된 좌표
 * @throws {Error} 주소 형식이 유효하지 않으면 예외를 던집니다.
 * @example
 * `fromA1Label('B3') // { rowIndex: 2, colIndex: 1 }`
 */
export const fromA1Label = (address: string): CellCoordinate => {
  const match = address.trim().toUpperCase().match(/^([A-Z]+)(\d+)$/);

  if (!match) {
    throw new Error(`Invalid A1 address: ${address}`);
  }

  const [, colLabel, rowText] = match;
  return {
    rowIndex: Number(rowText) - 1,
    colIndex: columnLabelToIndex(colLabel)
  };
};
