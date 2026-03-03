import { memo } from 'react';
import { getCellValue, type DataState } from '../../core';
import { SHEET_CLASSNAME, SHEET_COLOR } from '../const';

/**
 * `GridRow` 컴포넌트 입력 Props 입니다.
 */
export interface GridRowProps {
  rowIndex: number;
  rowHeaderWidth: number;
  renderRowTitle: boolean;
  defaultRowHeight: number;
  defaultColumnWidth: number;
  contentWidth: number;
  visibleCols: number[];
  dataState: DataState;
  selectedRow: boolean;
  onRowHeaderMouseDown: (rowIndex: number, event: React.MouseEvent<HTMLDivElement>) => void;
  onRowHeaderMouseEnter: (rowIndex: number) => void;
}

/**
 * 가상화된 단일 행을 렌더링합니다.
 *
 * - 행 헤더(번호)와 행 내 셀 텍스트를 함께 렌더링합니다.
 * - 셀 이벤트는 상위 그리드에서 위임 처리하므로, 셀에는 데이터 속성만 부여합니다.
 * - `memo`를 통해 행 props가 바뀌지 않으면 재렌더를 건너뜁니다.
 *
 * @param props 행 렌더링 입력값
 * @returns 행 JSX
 */
export const GridRow = memo(function GridRow({
  rowIndex,
  rowHeaderWidth,
  renderRowTitle,
  defaultRowHeight,
  defaultColumnWidth,
  contentWidth,
  visibleCols,
  dataState,
  selectedRow,
  onRowHeaderMouseDown,
  onRowHeaderMouseEnter
}: GridRowProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: rowIndex * defaultRowHeight,
        left: 0,
        display: 'flex',
        width: contentWidth,
        height: defaultRowHeight
      }}
    >
      {renderRowTitle && (
        <div
          className={SHEET_CLASSNAME.ROW_HEADER}
          draggable={false}
          onMouseDown={(event) => onRowHeaderMouseDown(rowIndex, event)}
          onMouseEnter={() => onRowHeaderMouseEnter(rowIndex)}
          style={{
            position: 'sticky',
            left: 0,
            zIndex: 10,
            width: rowHeaderWidth,
            lineHeight: `${defaultRowHeight}px`,
            cursor: 'pointer',
            color: selectedRow ? SHEET_COLOR.ACTIVE_BLUE : SHEET_COLOR.TEXT_MUTED,
            fontWeight: selectedRow ? 600 : 400,
            borderBottomColor: SHEET_COLOR.HEADER_BORDER,
            borderRightColor: SHEET_COLOR.HEADER_BORDER,
            backgroundColor: selectedRow ? SHEET_COLOR.SELECTED_BG : SHEET_COLOR.HEADER_BG
          }}
        >
          {rowIndex + 1}
        </div>
      )}
      <div className="flex">
        {visibleCols.map((colIndex) => {
          const cellValue = getCellValue(dataState, { rowIndex, colIndex });
          return (
            <div
              key={`cell-${rowIndex}-${colIndex}`}
              className={SHEET_CLASSNAME.CELL}
              data-sheet-cell="true"
              data-row-index={rowIndex}
              data-col-index={colIndex}
              title={cellValue}
              draggable={false}
              style={{
                position: 'relative',
                zIndex: 1,
                width: defaultColumnWidth,
                height: defaultRowHeight,
                whiteSpace: 'nowrap',
                color: SHEET_COLOR.TEXT_PRIMARY,
                borderBottomColor: SHEET_COLOR.GRID_BORDER,
                borderRightColor: SHEET_COLOR.GRID_BORDER,
                backgroundColor: SHEET_COLOR.WHITE
              }}
            >
              <span className={SHEET_CLASSNAME.CELL_TEXT} style={{ lineHeight: `${defaultRowHeight}px`, textOverflow: 'ellipsis' }}>
                {cellValue}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});
