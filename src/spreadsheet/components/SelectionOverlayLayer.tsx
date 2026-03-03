import { SHEET_COLOR } from '../const';
import type { GridCellRect } from '../hooks/use-grid-derived-state';

/**
 * `SelectionOverlayLayer` 컴포넌트 입력 Props 입니다.
 */
export interface SelectionOverlayLayerProps {
  rects: GridCellRect[];
}

/**
 * 선택 범위를 그리드 위 오버레이로 렌더링합니다.
 *
 * @param props 선택 영역 사각형 목록
 * @returns 선택 오버레이 JSX
 */
export function SelectionOverlayLayer({ rects }: SelectionOverlayLayerProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 2
      }}
    >
      {rects.map((rect, index) => (
        <div
          key={`selection-overlay-${index}`}
          style={{
            position: 'absolute',
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            backgroundColor: SHEET_COLOR.SELECTED_BG,
            opacity: 0.28,
            border: `1px solid ${SHEET_COLOR.ACTIVE_BLUE}`,
            boxSizing: 'border-box'
          }}
        />
      ))}
    </div>
  );
}
