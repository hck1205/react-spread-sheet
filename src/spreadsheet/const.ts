/**
 * 시트 렌더링에서 공통으로 사용하는 폰트 패밀리입니다.
 */
export const SHEET_FONT_FAMILY = 'Calibri, "Segoe UI", Arial, sans-serif';

/**
 * 시트 레이아웃 상수입니다.
 */
export const SHEET_LAYOUT = {
  ROW_HEADER_WIDTH: 56
} as const;

/**
 * 시트 스타일 토큰입니다.
 */
export const SHEET_COLOR = {
  GRID_BORDER: '#ececec',
  SELECTED_GRID_BORDER: '#c6dafc',
  HEADER_BORDER: '#d9d9d9',
  OUTER_BORDER: '#bfbfbf',
  TOOLBAR_BORDER: '#d4d4d4',
  INPUT_BORDER: '#c8c8c8',
  ACTIVE_BLUE: '#1a73e8',
  SELECTED_BG: '#e8f0fe',
  HEADER_BG: '#f3f3f3',
  WHITE: '#fff',
  TEXT_PRIMARY: '#222',
  TEXT_SECONDARY: '#333',
  TEXT_MUTED: '#444',
  ERROR_BORDER: '#fda4af',
  ERROR_BG: '#ffe4e6',
  ERROR_TEXT: '#be123c'
} as const;

/**
 * 시트 공통 클래스 상수입니다.
 */
export const SHEET_CLASSNAME = {
  ROOT: 'overflow-hidden border border-[#bfbfbf] bg-white shadow-sm',
  TOP_INFO: 'mb-2 text-[11px] text-slate-500',
  TOOLBAR: 'mb-2 flex items-center gap-2 rounded border bg-[#f3f3f3] p-2 text-sm',
  NAME_BOX: 'w-16 rounded bg-white px-2 py-1 text-center font-medium',
  FORMULA_BAR: 'flex-1 rounded bg-white px-3 py-1',
  HEADER_ROW: 'flex border-b bg-[#f3f3f3]',
  HEADER_CORNER: 'select-none shrink-0 border-r text-center text-xs',
  HEADER_TRACK: 'min-w-0 flex-1 overflow-hidden',
  HEADER_COLS: 'flex select-none',
  HEADER_COL: 'shrink-0 border-r text-center text-xs',
  SCROLL_CONTAINER: 'overflow-auto',
  GRID_FOCUS: 'outline-none',
  ROW_HEADER: 'select-none border-b border-r text-center text-xs',
  CELL: 'overflow-hidden border-b border-r text-sm',
  CELL_TEXT: 'block h-full w-full overflow-hidden px-2 text-sm',
  CELL_INPUT: 'h-full w-full border-none bg-white px-2 text-sm outline-none',
  ERROR_BOX: 'mb-2 rounded border px-2 py-1 text-xs'
} as const;

/**
 * 편집 중일 때 툴바 입력 영역 보더 색을 반환합니다.
 *
 * @param editing 편집 상태 여부
 * @returns CSS border 문자열
 */
export const getToolbarBorder = (editing: boolean): string =>
  `1px solid ${editing ? SHEET_COLOR.ACTIVE_BLUE : SHEET_COLOR.INPUT_BORDER}`;
