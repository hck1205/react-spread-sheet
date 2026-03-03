import type { DataState } from '../../../core';
import { SHEET_CLASSNAME } from '../../const';
import type { GridCellRect } from '../../hooks/use-grid-derived-state';
import type { EditingState } from '../../types';
import { ActiveCellOverlay } from '../ActiveCellOverlay';
import { EditingCellOverlay } from '../EditingCellOverlay';
import { GridRow } from '../GridRow';
import { SelectionOverlayLayer } from '../SelectionOverlayLayer';
import { SpreadsheetHeaderRow } from '../SpreadsheetHeaderRow';

/**
 * 그리드 표면(헤더, 스크롤 컨테이너, 셀 레이어) 렌더링 Props 입니다.
 *
 * 공개 API가 아닌 내부 전용 계약이며,
 * 컨트롤러에서 계산한 상태와 이벤트 핸들러를 화면 계층에 연결할 때 사용합니다.
 */
export interface SpreadsheetGridSurfaceProps {
  /** 컬럼 헤더 렌더 여부 */
  renderColumnTitle: boolean;
  /** 현재 가로 스크롤 위치(px) */
  scrollLeft: number;
  /** 선택된 컬럼 집합 */
  selectedColSet: Set<number>;
  /** viewport 높이(px) */
  viewportHeight: number;
  /** 드래그 선택 중 user-select 모드 제어 */
  userSelectMode: 'auto' | 'none';
  /** 실제 스크롤 컨테이너 ref */
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  /** 키보드 포커스 수신 루트 ref */
  gridFocusRef: React.RefObject<HTMLDivElement | null>;
  /** 스크롤 핸들러 */
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  /** 키보드 핸들러 */
  onGridKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  /** 포인터 다운 핸들러 */
  onGridMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
  /** 포인터 오버 핸들러(드래그 확장) */
  onGridMouseOver: (event: React.MouseEvent<HTMLDivElement>) => void;
  /** 더블클릭 핸들러(편집 진입) */
  onGridDoubleClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  /** 좌상단 전체 선택 핸들러 */
  onSelectAllMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
  /** 컬럼 헤더 mousedown 핸들러 */
  onColumnHeaderMouseDown: (colIndex: number, event: React.MouseEvent<HTMLDivElement>) => void;
  /** 컬럼 헤더 mouseenter 핸들러 */
  onColumnHeaderMouseEnter: (colIndex: number) => void;
  /** 전체 그리드 폭(px) */
  totalGridWidth: number;
  /** 콘텐츠 폭(px) */
  contentWidth: number;
  /** 전체 그리드 높이(px) */
  totalGridHeight: number;
  /** 현재 렌더할 가시 행 인덱스 배열 */
  visibleRows: number[];
  /** 현재 렌더할 가시 열 인덱스 배열 */
  visibleCols: number[];
  /** 행 헤더 렌더 여부 */
  renderRowTitle: boolean;
  /** 행 헤더 폭(px) */
  rowHeaderWidth: number;
  /** 기본 행 높이(px) */
  defaultRowHeight: number;
  /** 기본 열 너비(px) */
  defaultColumnWidth: number;
  /** 데이터 상태 */
  dataState: DataState;
  /** 선택된 행 집합 */
  selectedRowSet: Set<number>;
  /** 선택 오버레이 직사각형 목록 */
  selectionOverlayRects: GridCellRect[];
  /** 활성 셀 오버레이 직사각형 */
  activeCellRect: GridCellRect;
  /** 편집 상태 */
  editing: EditingState | null;
  /** 편집 입력 ref */
  editingInputRef: React.RefObject<HTMLInputElement | null>;
  /** 편집 중 draft 문자열 */
  editingDraftValue: string;
  /** 편집 입력 변경 핸들러 */
  onEditingInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** IME 조합 시작 핸들러 */
  onEditingInputCompositionStart: () => void;
  /** IME 조합 종료 핸들러 */
  onEditingInputCompositionEnd: () => void;
  /** 편집 입력 키다운 핸들러 */
  onEditingInputKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  /** 편집 입력 blur 핸들러 */
  onEditingInputBlur: () => void;
  /** 행 헤더 mousedown 핸들러 */
  onRowHeaderMouseDown: (rowIndex: number, event: React.MouseEvent<HTMLDivElement>) => void;
  /** 행 헤더 mouseenter 핸들러 */
  onRowHeaderMouseEnter: (rowIndex: number) => void;
}

/**
 * 헤더/바디/오버레이를 포함한 그리드 표면을 렌더링합니다.
 *
 * `SpreadSheetGrid` 공개 컴포넌트 내부에서만 사용되며,
 * 외부 사용자가 직접 조립할 필요가 없도록 내부 구현을 캡슐화합니다.
 *
 * @param props 그리드 렌더링에 필요한 상태/핸들러 묶음
 * @returns 그리드 표면 JSX
 */
export function SpreadsheetGridSurface({
  renderColumnTitle,
  scrollLeft,
  selectedColSet,
  viewportHeight,
  userSelectMode,
  scrollContainerRef,
  gridFocusRef,
  onScroll,
  onGridKeyDown,
  onGridMouseDown,
  onGridMouseOver,
  onGridDoubleClick,
  onSelectAllMouseDown,
  onColumnHeaderMouseDown,
  onColumnHeaderMouseEnter,
  totalGridWidth,
  contentWidth,
  totalGridHeight,
  visibleRows,
  visibleCols,
  renderRowTitle,
  rowHeaderWidth,
  defaultRowHeight,
  defaultColumnWidth,
  dataState,
  selectedRowSet,
  selectionOverlayRects,
  activeCellRect,
  editing,
  editingInputRef,
  editingDraftValue,
  onEditingInputChange,
  onEditingInputCompositionStart,
  onEditingInputCompositionEnd,
  onEditingInputKeyDown,
  onEditingInputBlur,
  onRowHeaderMouseDown,
  onRowHeaderMouseEnter
}: SpreadsheetGridSurfaceProps) {
  return (
    <>
      {renderColumnTitle && (
        <SpreadsheetHeaderRow
          renderRowTitle={renderRowTitle}
          rowHeaderWidth={rowHeaderWidth}
          defaultRowHeight={defaultRowHeight}
          totalGridWidth={totalGridWidth}
          scrollLeft={scrollLeft}
          columnCount={dataState.cols}
          defaultColumnWidth={defaultColumnWidth}
          selectedColSet={selectedColSet}
          onSelectAllMouseDown={onSelectAllMouseDown}
          onColumnHeaderMouseDown={onColumnHeaderMouseDown}
          onColumnHeaderMouseEnter={onColumnHeaderMouseEnter}
        />
      )}
      <div
        ref={scrollContainerRef}
        className={SHEET_CLASSNAME.SCROLL_CONTAINER}
        style={{ height: viewportHeight, userSelect: userSelectMode }}
        onScroll={onScroll}
      >
        <div
          ref={gridFocusRef}
          role="grid"
          tabIndex={0}
          className={SHEET_CLASSNAME.GRID_FOCUS}
          onKeyDown={onGridKeyDown}
          onMouseDown={onGridMouseDown}
          onMouseOver={onGridMouseOver}
          onDoubleClick={onGridDoubleClick}
          onDragStart={(event) => event.preventDefault()}
        >
          <div
            style={{
              position: 'relative',
              width: contentWidth,
              height: totalGridHeight
            }}
          >
            <SelectionOverlayLayer rects={selectionOverlayRects} />
            <ActiveCellOverlay rect={activeCellRect} editing={Boolean(editing)} />
            {visibleRows.map((rowIndex) => (
              <GridRow
                key={`row-${rowIndex}`}
                rowIndex={rowIndex}
                rowHeaderWidth={rowHeaderWidth}
                renderRowTitle={renderRowTitle}
                defaultRowHeight={defaultRowHeight}
                defaultColumnWidth={defaultColumnWidth}
                contentWidth={contentWidth}
                visibleCols={visibleCols}
                dataState={dataState}
                selectedRow={selectedRowSet.has(rowIndex)}
                onRowHeaderMouseDown={onRowHeaderMouseDown}
                onRowHeaderMouseEnter={onRowHeaderMouseEnter}
              />
            ))}
            {editing && (
              <EditingCellOverlay
                editing={editing}
                rowHeaderWidth={rowHeaderWidth}
                defaultRowHeight={defaultRowHeight}
                defaultColumnWidth={defaultColumnWidth}
                editingInputRef={editingInputRef}
                defaultValue={editingDraftValue}
                onChange={onEditingInputChange}
                onCompositionStart={onEditingInputCompositionStart}
                onCompositionEnd={onEditingInputCompositionEnd}
                onKeyDown={onEditingInputKeyDown}
                onBlur={onEditingInputBlur}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
