import type { CellCoordinate, DataStorageKind, SpreadsheetCell } from '../model';
import { createGridDataStore, type GridDataStore } from '../storage';

export interface SelectionRange {
  anchor: CellCoordinate | null;
  focus: CellCoordinate | null;
}

export interface EditingState {
  activeCell: CellCoordinate | null;
  draftValue: string;
}

export interface ScrollState {
  scrollTop: number;
  scrollLeft: number;
}

export interface DataState {
  rows: number;
  cols: number;
  storage: DataStorageKind;
  store: GridDataStore;
  version: number;
}

export interface UiState {
  selection: SelectionRange;
  focusedCell: CellCoordinate | null;
  editing: EditingState;
  scroll: ScrollState;
}

export interface SpreadsheetState {
  dataState: DataState;
  uiState: UiState;
}

export interface CreateSpreadsheetStateOptions {
  rows: number;
  cols: number;
  storage?: DataStorageKind;
  initialCells?: Array<{ coord: CellCoordinate; cell: SpreadsheetCell }>;
}

/**
 * 데이터 상태를 생성합니다.
 *
 * @param options 상태 생성 옵션
 * @param options.rows 전체 행 수
 * @param options.cols 전체 열 수
 * @param options.storage 저장 전략 (`dense` | `sparse`)
 * @param options.initialCells 초기 시드 셀 목록
 * @returns 초기화된 데이터 상태
 */
export const createDataState = ({
  rows,
  cols,
  storage = 'sparse',
  initialCells = []
}: CreateSpreadsheetStateOptions): DataState => {
  const store = createGridDataStore(storage, rows, cols);

  initialCells.forEach(({ coord, cell }) => {
    store.setCell(coord, cell);
  });

  return {
    rows,
    cols,
    storage,
    store,
    version: 0
  };
};

/**
 * UI 상태 기본값을 생성합니다.
 *
 * @returns selection/focus/scroll/editing 기본값이 채워진 UI 상태
 */
export const createUiState = (): UiState => ({
  selection: {
    anchor: null,
    focus: null
  },
  focusedCell: null,
  editing: {
    activeCell: null,
    draftValue: ''
  },
  scroll: {
    scrollTop: 0,
    scrollLeft: 0
  }
});

/**
 * 전체 스프레드시트 상태를 생성합니다.
 *
 * @param options 데이터 상태 생성 옵션
 * @returns `dataState`와 `uiState`가 분리된 전체 상태
 */
export const createSpreadsheetState = (options: CreateSpreadsheetStateOptions): SpreadsheetState => ({
  dataState: createDataState(options),
  uiState: createUiState()
});

/**
 * 현재 데이터 저장소에서 셀을 읽습니다.
 *
 * @param dataState 데이터 상태
 * @param coord 조회 좌표
 * @returns 조회된 셀 복제본
 */
export const getCell = (dataState: DataState, coord: CellCoordinate): SpreadsheetCell => dataState.store.getCell(coord);

/**
 * 현재 데이터 저장소에서 셀 문자열 값만 읽습니다.
 *
 * @param dataState 데이터 상태
 * @param coord 조회 좌표
 * @returns 셀 문자열 값
 */
export const getCellValue = (dataState: DataState, coord: CellCoordinate): string => dataState.store.getCellValue(coord);

/**
 * 셀 값을 기록한 새로운 데이터 상태를 반환합니다.
 *
 * @param dataState 기존 데이터 상태
 * @param coord 기록 좌표
 * @param cell 기록할 셀 값
 * @returns store가 복제되고 `version`이 증가한 새 데이터 상태
 */
export const setCell = (dataState: DataState, coord: CellCoordinate, cell: SpreadsheetCell): DataState => {
  const nextStore = dataState.store.clone();
  nextStore.setCell(coord, cell);

  return {
    ...dataState,
    store: nextStore,
    version: dataState.version + 1
  };
};

/**
 * 선택 범위를 반영한 새로운 UI 상태를 반환합니다.
 *
 * @param uiState 기존 UI 상태
 * @param selection 새 선택 범위
 * @returns selection이 반영된 UI 상태
 */
export const setSelection = (uiState: UiState, selection: SelectionRange): UiState => ({
  ...uiState,
  selection
});

/**
 * 포커스 셀을 반영한 새로운 UI 상태를 반환합니다.
 *
 * @param uiState 기존 UI 상태
 * @param focusedCell 새 포커스 좌표
 * @returns focusedCell이 반영된 UI 상태
 */
export const setFocusedCell = (uiState: UiState, focusedCell: CellCoordinate | null): UiState => ({
  ...uiState,
  focusedCell
});
