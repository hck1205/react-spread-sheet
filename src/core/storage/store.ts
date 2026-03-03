import { fromCellKey, toCellKey } from '../address';
import type { CellCoordinate, DataStorageKind, SpreadsheetCell } from '../model';
import { cloneCell, EMPTY_CELL, isCellEmpty } from '../model';

export interface GridDataStore {
  readonly kind: DataStorageKind;
  readonly rows: number;
  readonly cols: number;
  clone(): GridDataStore;
  getCell(coord: CellCoordinate): SpreadsheetCell;
  getCellValue(coord: CellCoordinate): string;
  setCell(coord: CellCoordinate, cell: SpreadsheetCell): void;
  hasCell(coord: CellCoordinate): boolean;
  clearCell(coord: CellCoordinate): void;
  entries(): Array<{ coord: CellCoordinate; cell: SpreadsheetCell }>;
}

/**
 * 지정한 크기의 dense 2차원 그리드를 생성합니다.
 *
 * @param rows 전체 행 수
 * @param cols 전체 열 수
 * @returns 모든 좌표가 빈 셀로 초기화된 2차원 배열
 */
const createDenseGrid = (rows: number, cols: number): SpreadsheetCell[][] =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => cloneCell(EMPTY_CELL)));

/**
 * dense 저장소 구현체입니다.
 *
 * 특징:
 * - 모든 좌표를 2차원 배열에 유지
 * - 빈 셀도 메모리에 포함
 * - 고정 크기 그리드에서 빠른 인덱스 접근에 유리
 */
export class DenseGridStore implements GridDataStore {
  public readonly kind: DataStorageKind = 'dense';
  public readonly rows: number;
  public readonly cols: number;
  private readonly grid: SpreadsheetCell[][];

  constructor(rows: number, cols: number, initial?: SpreadsheetCell[][]) {
    this.rows = rows;
    this.cols = cols;
    this.grid = initial ?? createDenseGrid(rows, cols);
  }

  /**
   * 저장소 전체를 복제한 새 인스턴스를 반환합니다.
   *
   * @returns 원본과 분리된 dense 저장소 복제본
   */
  clone(): GridDataStore {
    return new DenseGridStore(
      this.rows,
      this.cols,
      this.grid.map((row) => row.map((cell) => cloneCell(cell)))
    );
  }

  /**
   * 좌표의 셀을 조회합니다.
   *
   * @param coord 조회 좌표
   * @returns 셀 복제본. 범위를 벗어나면 빈 셀 복제본 반환
   */
  getCell(coord: CellCoordinate): SpreadsheetCell {
    const cell = this.grid[coord.rowIndex]?.[coord.colIndex];

    if (!cell) {
      return cloneCell(EMPTY_CELL);
    }

    return cloneCell(cell);
  }

  /**
   * 좌표의 셀 문자열 값만 조회합니다.
   *
   * @param coord 조회 좌표
   * @returns 셀 문자열 값. 값이 없으면 빈 문자열 반환
   */
  getCellValue(coord: CellCoordinate): string {
    return this.grid[coord.rowIndex]?.[coord.colIndex]?.value ?? '';
  }

  /**
   * 좌표에 셀 값을 기록합니다.
   *
   * @param coord 대상 좌표
   * @param cell 기록할 셀 값
   * @remarks 행 인덱스가 없는 경우 쓰기를 무시합니다.
   */
  setCell(coord: CellCoordinate, cell: SpreadsheetCell): void {
    if (!this.grid[coord.rowIndex]) {
      return;
    }

    this.grid[coord.rowIndex][coord.colIndex] = cloneCell(cell);
  }

  /**
   * 좌표 셀이 실질적으로 비어있지 않은지 확인합니다.
   *
   * @param coord 확인 좌표
   * @returns 비어있지 않으면 `true`
   */
  hasCell(coord: CellCoordinate): boolean {
    const cell = this.grid[coord.rowIndex]?.[coord.colIndex];

    if (!cell) {
      return false;
    }

    return !isCellEmpty(cell);
  }

  /**
   * 좌표의 셀을 기본 빈 셀로 초기화합니다.
   *
   * @param coord 초기화할 좌표
   */
  clearCell(coord: CellCoordinate): void {
    this.setCell(coord, EMPTY_CELL);
  }

  /**
   * dense 그리드에서 비어있지 않은 셀만 순회 가능한 목록으로 반환합니다.
   *
   * @returns `{ coord, cell }` 쌍 배열
   */
  entries(): Array<{ coord: CellCoordinate; cell: SpreadsheetCell }> {
    const result: Array<{ coord: CellCoordinate; cell: SpreadsheetCell }> = [];

    for (let rowIndex = 0; rowIndex < this.rows; rowIndex += 1) {
      for (let colIndex = 0; colIndex < this.cols; colIndex += 1) {
        const coord = { rowIndex, colIndex };
        if (this.hasCell(coord)) {
          result.push({ coord, cell: this.getCell(coord) });
        }
      }
    }

    return result;
  }
}

/**
 * sparse 저장소 구현체입니다.
 *
 * 특징:
 * - 비어있지 않은 셀만 Map에 저장
 * - 큰 시트에서 데이터가 듬성듬성 있을 때 메모리 효율이 좋음
 */
export class SparseGridStore implements GridDataStore {
  public readonly kind: DataStorageKind = 'sparse';
  public readonly rows: number;
  public readonly cols: number;
  private readonly cells: Map<string, SpreadsheetCell>;

  constructor(rows: number, cols: number, initial?: Map<string, SpreadsheetCell>) {
    this.rows = rows;
    this.cols = cols;
    this.cells = initial ?? new Map<string, SpreadsheetCell>();
  }

  /**
   * sparse 저장소를 복제한 새 인스턴스를 반환합니다.
   *
   * @returns 원본과 분리된 sparse 저장소 복제본
   */
  clone(): GridDataStore {
    return new SparseGridStore(
      this.rows,
      this.cols,
      new Map(Array.from(this.cells.entries()).map(([key, cell]) => [key, cloneCell(cell)]))
    );
  }

  /**
   * 좌표 셀을 조회합니다.
   *
   * @param coord 조회 좌표
   * @returns 셀 복제본. 값이 없으면 빈 셀 복제본 반환
   */
  getCell(coord: CellCoordinate): SpreadsheetCell {
    const key = toCellKey(coord);
    const cell = this.cells.get(key);

    if (!cell) {
      return cloneCell(EMPTY_CELL);
    }

    return cloneCell(cell);
  }

  /**
   * 좌표의 셀 문자열 값만 조회합니다.
   *
   * @param coord 조회 좌표
   * @returns 셀 문자열 값. 값이 없으면 빈 문자열 반환
   */
  getCellValue(coord: CellCoordinate): string {
    return this.cells.get(toCellKey(coord))?.value ?? '';
  }

  /**
   * 셀 값을 기록합니다.
   *
   * @param coord 대상 좌표
   * @param cell 기록할 셀 값
   * @remarks 빈 셀인 경우 Map에서 제거하여 sparse 특성을 유지합니다.
   */
  setCell(coord: CellCoordinate, cell: SpreadsheetCell): void {
    const key = toCellKey(coord);

    if (isCellEmpty(cell)) {
      this.cells.delete(key);
      return;
    }

    this.cells.set(key, cloneCell(cell));
  }

  /**
   * 좌표가 sparse Map에 존재하는지 확인합니다.
   *
   * @param coord 확인 좌표
   * @returns 키가 존재하면 `true`
   */
  hasCell(coord: CellCoordinate): boolean {
    return this.cells.has(toCellKey(coord));
  }

  /**
   * 좌표 셀을 sparse Map에서 제거합니다.
   *
   * @param coord 제거할 좌표
   */
  clearCell(coord: CellCoordinate): void {
    this.cells.delete(toCellKey(coord));
  }

  /**
   * sparse Map의 모든 엔트리를 좌표/셀 형태로 반환합니다.
   *
   * @returns `{ coord, cell }` 쌍 배열
   */
  entries(): Array<{ coord: CellCoordinate; cell: SpreadsheetCell }> {
    return Array.from(this.cells.entries()).map(([key, cell]) => ({
      coord: fromCellKey(key),
      cell: cloneCell(cell)
    }));
  }
}

/**
 * 저장 전략에 맞는 데이터 저장소 구현체를 생성합니다.
 *
 * @param kind 저장소 종류 (`dense` | `sparse`)
 * @param rows 전체 행 수
 * @param cols 전체 열 수
 * @returns 선택된 저장소 인스턴스
 */
export const createGridDataStore = (kind: DataStorageKind, rows: number, cols: number): GridDataStore =>
  kind === 'dense' ? new DenseGridStore(rows, cols) : new SparseGridStore(rows, cols);
