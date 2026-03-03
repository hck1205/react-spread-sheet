/**
 * 커맨드 종류 상수입니다.
 *
 * @remarks
 * 리듀서 분기 비교 시 문자열 하드코딩 대신 이 값을 사용합니다.
 */
export const COMMAND_KIND = {
  SET_CELL: 'set-cell',
  SELECT_CELL: 'select-cell'
} as const;

/**
 * 리듀서 액션 종류 상수입니다.
 */
export const ACTION_TYPE = {
  COMMAND: 'command',
  HISTORY_UNDO: 'history/undo',
  HISTORY_REDO: 'history/redo'
} as const;

/**
 * 리듀서 effect 종류 상수입니다.
 */
export const EFFECT_TYPE = {
  CELL_UPDATED: 'cell-updated',
  SELECTION_UPDATED: 'selection-updated'
} as const;
