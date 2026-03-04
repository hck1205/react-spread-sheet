import { SHEET_CLASSNAME, SHEET_FONT_FAMILY } from '../const';
import { useSpreadsheetController } from '../hooks/use-spreadsheet-controller';
import { useSpreadsheetStatusModel } from '../hooks/use-spreadsheet-status-model';
import type { SpreadsheetProps } from '../types';
import { SpreadsheetGridSurface } from './internal/SpreadsheetGridSurface';
import { SpreadsheetStatusSection } from './internal/SpreadsheetStatusSection';

/**
 * 라이브러리의 단일 공개 Spreadsheet 컴포넌트입니다.
 *
 * 외부 소비자는 이 컴포넌트 하나만 렌더링하면 되며,
 * 선택/드래그/편집/가상화/헤더 동기화 로직은 내부 훅/컴포넌트로 캡슐화됩니다.
 *
 * 설계 원칙:
 * - 공개 API는 `SpreadsheetProps`로만 제한합니다.
 * - 내부 렌더 단위(`SpreadsheetStatusSection`, `SpreadsheetGridSurface`)는 atomic하게 분리합니다.
 * - 컨트롤러(`useSpreadsheetController`)가 상태/이벤트를 단일 소스로 제공합니다.
 *
 * @param props 스프레드시트 공개 설정/콜백 Props
 * @returns 완전한 스프레드시트 UI JSX
 */
export function SpreadSheetGrid(props: SpreadsheetProps) {
  const controller = useSpreadsheetController(props);

  const statusModel = useSpreadsheetStatusModel({
    activeCell: controller.activeCell,
    editing: controller.editing,
    formulaValue: controller.formulaValue
  });

  return (
    <div
      className={props.className}
      style={{ fontFamily: SHEET_FONT_FAMILY }}
      onDragStart={(event) => event.preventDefault()}
    >
      <SpreadsheetStatusSection
        rendererStrategy={controller.rendererStrategy}
        dynamicBufferPx={controller.dynamicBufferPx}
        rows={controller.dataState.rows}
        cols={controller.dataState.cols}
        storage={controller.dataState.storage}
        renderToolbar={controller.renderToolbar}
        statusModel={statusModel}
        activeRowIndex={controller.activeCell.rowIndex}
        freezeRows={controller.freezeRows}
        onFreezeRowsChange={controller.handleFreezeRowsChange}
      />
      <div className={SHEET_CLASSNAME.ROOT}>
        <SpreadsheetGridSurface
          renderColumnTitle={controller.renderColumnTitle}
          scrollTop={controller.scrollTop}
          scrollLeft={controller.scrollLeft}
          selectedColSet={controller.selectedColSet}
          viewportHeight={controller.viewportHeight}
          userSelectMode={controller.userSelectMode}
          scrollContainerRef={controller.scrollContainerRef}
          gridFocusRef={controller.gridFocusRef}
          onScroll={controller.handleScroll}
          onGridKeyDown={controller.handleGridKeyDown}
          onGridMouseDown={controller.handleGridMouseDown}
          onGridMouseOver={controller.handleGridMouseOver}
          onGridDoubleClick={controller.handleGridDoubleClick}
          onSelectAllMouseDown={controller.handleSelectAllMouseDown}
          onColumnHeaderMouseDown={controller.handleColumnHeaderMouseDown}
          onColumnHeaderMouseEnter={controller.handleColumnHeaderMouseEnter}
          onColumnResizeMouseDown={controller.handleColumnResizeMouseDown}
          totalGridWidth={controller.totalGridWidth}
          contentWidth={controller.contentWidth}
          totalGridHeight={controller.totalGridHeight}
          visibleRows={controller.visibleRows}
          visibleCols={controller.visibleCols}
          renderRowTitle={controller.renderRowTitle}
          rowHeaderWidth={controller.rowHeaderWidth}
          defaultRowHeight={controller.defaultRowHeight}
          columnWidthsByIndex={controller.columnWidthsByIndex}
          rowHeightsByIndex={controller.rowHeightsByIndex}
          columnOffsets={controller.columnOffsets}
          rowOffsets={controller.rowOffsets}
          freezeRows={controller.freezeRows}
          dataState={controller.dataState}
          selectedRowSet={controller.selectedRowSet}
          selectionOverlayRects={controller.selectionOverlayRects}
          activeCellRect={controller.activeCellRect}
          editing={controller.editing}
          editingInputRef={controller.editingInputRef}
          editingDraftValue={controller.editingDraftValue}
          onEditingInputChange={controller.handleEditingInputChange}
          onEditingInputCompositionStart={controller.handleEditingInputCompositionStart}
          onEditingInputCompositionEnd={controller.handleEditingInputCompositionEnd}
          onEditingInputKeyDown={controller.handleEditingInputKeyDown}
          onEditingInputBlur={controller.handleEditingInputBlur}
          onRowHeaderMouseDown={controller.handleRowHeaderMouseDown}
          onRowHeaderMouseEnter={controller.handleRowHeaderMouseEnter}
          onRowResizeMouseDown={controller.handleRowResizeMouseDown}
        />
      </div>
    </div>
  );
}
