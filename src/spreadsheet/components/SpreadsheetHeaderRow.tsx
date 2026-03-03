import { columnIndexToLabel } from '../../core';
import { SHEET_CLASSNAME, SHEET_COLOR } from '../const';

/**
 * `SpreadsheetHeaderRow` 컴포넌트 입력 Props 입니다.
 */
export interface SpreadsheetHeaderRowProps {
  renderRowTitle: boolean;
  rowHeaderWidth: number;
  defaultRowHeight: number;
  totalGridWidth: number;
  scrollLeft: number;
  columnCount: number;
  columnWidthsByIndex: number[];
  columnOffsets: number[];
  selectedColSet: Set<number>;
  onSelectAllMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
  onColumnHeaderMouseDown: (colIndex: number, event: React.MouseEvent<HTMLDivElement>) => void;
  onColumnHeaderMouseEnter: (colIndex: number) => void;
  onColumnResizeMouseDown: (colIndex: number, event: React.MouseEvent<HTMLDivElement>) => void;
}

/**
 * 시트 상단 컬럼 헤더 행을 렌더링합니다.
 *
 * - 좌상단 코너 클릭 시 전체 선택 동작을 트리거합니다.
 * - 수평 스크롤 위치에 맞춰 컬럼 라벨 트랙을 동기화합니다.
 * - 선택된 컬럼은 헤더 강조 스타일로 표시합니다.
 *
 * @param props 헤더 렌더링에 필요한 레이아웃/선택 정보
 * @returns 헤더 JSX
 */
export function SpreadsheetHeaderRow({
  renderRowTitle,
  rowHeaderWidth,
  defaultRowHeight,
  totalGridWidth,
  scrollLeft,
  columnCount,
  columnWidthsByIndex,
  columnOffsets,
  selectedColSet,
  onSelectAllMouseDown,
  onColumnHeaderMouseDown,
  onColumnHeaderMouseEnter,
  onColumnResizeMouseDown
}: SpreadsheetHeaderRowProps) {
  return (
    <div className={SHEET_CLASSNAME.HEADER_ROW} style={{ borderBottomColor: SHEET_COLOR.HEADER_BORDER }}>
      {renderRowTitle && (
        <div
          className={SHEET_CLASSNAME.HEADER_CORNER}
          style={{ width: rowHeaderWidth, height: defaultRowHeight, lineHeight: `${defaultRowHeight}px`, cursor: 'pointer' }}
          onMouseDown={onSelectAllMouseDown}
        />
      )}
      <div className={SHEET_CLASSNAME.HEADER_TRACK}>
        <div
          className={SHEET_CLASSNAME.HEADER_COLS}
          style={{
            width: totalGridWidth,
            height: defaultRowHeight,
            transform: `translateX(-${scrollLeft}px)`,
            position: 'relative'
          }}
        >
          {Array.from({ length: columnCount }).map((_, colIndex) => {
            const selectedColumn = selectedColSet.has(colIndex);
            return (
              <div
                key={`col-header-${colIndex}`}
                className={SHEET_CLASSNAME.HEADER_COL}
                draggable={false}
                onMouseDown={(event) => onColumnHeaderMouseDown(colIndex, event)}
                onMouseEnter={() => onColumnHeaderMouseEnter(colIndex)}
                style={{
                  position: 'absolute',
                  left: columnOffsets[colIndex] ?? colIndex * 120,
                  width: columnWidthsByIndex[colIndex] ?? 120,
                  height: defaultRowHeight,
                  lineHeight: `${defaultRowHeight}px`,
                  cursor: 'pointer',
                  color: selectedColumn ? SHEET_COLOR.ACTIVE_BLUE : SHEET_COLOR.TEXT_MUTED,
                  fontWeight: selectedColumn ? 600 : 400,
                  borderRightColor: SHEET_COLOR.HEADER_BORDER,
                  backgroundColor: selectedColumn ? SHEET_COLOR.SELECTED_BG : SHEET_COLOR.HEADER_BG
                }}
              >
                {columnIndexToLabel(colIndex)}
                <div
                  className={SHEET_CLASSNAME.HEADER_RESIZE_HANDLE}
                  onMouseDown={(event) => onColumnResizeMouseDown(colIndex, event)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
