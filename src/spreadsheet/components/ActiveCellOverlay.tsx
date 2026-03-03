import { SHEET_COLOR } from '../const';
import type { GridCellRect } from '../hooks/use-grid-derived-state';

/**
 * `ActiveCellOverlay` 컴포넌트 입력 Props 입니다.
 */
export interface ActiveCellOverlayProps {
  rect: GridCellRect;
  editing: boolean;
}

/**
 * 활성 셀 테두리 오버레이를 렌더링합니다.
 *
 * @param props 활성 셀 사각형과 편집 상태
 * @returns 활성 셀 오버레이 JSX
 */
export function ActiveCellOverlay({ rect, editing }: ActiveCellOverlayProps) {
  const borderWidth = editing ? 2 : 1.5;

  return (
    <div
      style={{
        position: 'absolute',
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        pointerEvents: 'none',
        zIndex: 20,
        boxSizing: 'border-box',
        border: `${borderWidth}px solid ${SHEET_COLOR.ACTIVE_BLUE}`,
        boxShadow: editing ? `0 0 0 1px ${SHEET_COLOR.ACTIVE_BLUE}` : 'none'
      }}
    />
  );
}
