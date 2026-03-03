import { SHEET_CLASSNAME, SHEET_COLOR } from '../const';
import type { EditingState } from '../types';

/**
 * `EditingCellOverlay` 컴포넌트 입력 Props 입니다.
 */
export interface EditingCellOverlayProps {
  editing: EditingState;
  rect: { top: number; left: number; width: number; height: number };
  editingInputRef: React.RefObject<HTMLInputElement | null>;
  defaultValue: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCompositionStart: () => void;
  onCompositionEnd: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur: () => void;
}

/**
 * 편집 중인 셀의 입력창 오버레이를 렌더링합니다.
 *
 * @param props 편집 좌표, 레이아웃 정보, 입력 이벤트 핸들러
 * @returns 편집 입력 오버레이 JSX
 */
export function EditingCellOverlay({
  editing,
  rect,
  editingInputRef,
  defaultValue,
  onChange,
  onCompositionStart,
  onCompositionEnd,
  onKeyDown,
  onBlur
}: EditingCellOverlayProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        zIndex: 30
      }}
    >
      <input
        key={`editing-${editing.cell.rowIndex}-${editing.cell.colIndex}`}
        autoFocus
        ref={editingInputRef}
        defaultValue={defaultValue}
        className={SHEET_CLASSNAME.CELL_INPUT}
        style={{
          boxSizing: 'border-box',
          width: '100%',
          height: '100%',
          lineHeight: `${Math.max(16, rect.height - 4)}px`,
          color: SHEET_COLOR.TEXT_PRIMARY,
          backgroundColor: SHEET_COLOR.WHITE,
          caretColor: SHEET_COLOR.ACTIVE_BLUE,
          border: 'none'
        }}
        onChange={onChange}
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      />
    </div>
  );
}
