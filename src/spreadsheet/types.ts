import type { CellCoordinate, DataStorageKind, RendererStrategy } from '../core';

/**
 * 외부에서 초기 데이터를 주입할 때 사용하는 2차원 문자열 배열 타입입니다.
 */
export type SpreadsheetValue = string[][];

/**
 * 셀 검증/커밋 훅에서 사용하는 공통 페이로드입니다.
 */
export interface CellValidationPayload {
  rowIndex: number;
  colIndex: number;
  prevValue: string;
  nextValue: string;
}

/**
 * 커스텀 검증 훅의 상세 결과 타입입니다.
 */
export interface CellValidationResult {
  valid: boolean;
  value?: string;
  message?: string;
}

/**
 * `Spreadsheet` 컴포넌트 공개 Props 입니다.
 */
export interface SpreadsheetProps {
  rows?: number;
  cols?: number;
  initialValue?: SpreadsheetValue;
  className?: string;
  storage?: DataStorageKind;
  rendererStrategy?: RendererStrategy;
  defaultColumnWidth?: number;
  defaultRowHeight?: number;
  viewportHeight?: number;
  overscan?: number;
  renderBufferPx?: number;
  maxRenderBufferPx?: number;
  scrollPredictionMs?: number;
  /**
   * 행 타이틀(행 번호 헤더) 렌더 여부입니다.
   *
   * @default true
   */
  renderRowTitle?: boolean;
  /**
   * 컬럼 타이틀(상단 컬럼 헤더) 렌더 여부입니다.
   *
   * @default true
   */
  renderColumnTitle?: boolean;
  /**
   * 상단 툴바(이름 박스/수식 바) 렌더 여부입니다.
   *
   * @default true
   */
  renderToolbar?: boolean;
  onValidateCell?: (payload: CellValidationPayload) => boolean | CellValidationResult;
  onCellCommit?: (payload: CellValidationPayload) => void;
}

/**
 * 선택 영역의 anchor/focus 좌표 쌍입니다.
 */
export interface SelectionRange {
  anchor: CellCoordinate;
  focus: CellCoordinate;
}

/**
 * 현재 선택 상태(멀티 range + primary index)입니다.
 */
export interface SelectionState {
  ranges: SelectionRange[];
  primaryIndex: number;
}

/**
 * 편집 중인 셀의 임시 draft 상태입니다.
 */
export interface EditingState {
  cell: CellCoordinate;
  error: string | null;
}
