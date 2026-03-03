import { useCallback, useEffect, useRef } from 'react';
import type { CellCoordinate } from '../../core';
import { clamp, createSingleRange, isSameCell } from '../selection';
import type { EditingState, SelectionState } from '../types';
import { readCellCoordinateFromEventTarget } from '../utils/cell-coordinate';

type DragMode = 'replace' | 'extend' | 'append';

/**
 * 드래그 선택 진행 중 추적해야 하는 컨텍스트입니다.
 */
interface DragContext {
  mode: DragMode;
  rangeIndex: number;
  anchor: CellCoordinate;
}

/**
 * `useDragSelection` 훅 입력 옵션입니다.
 */
export interface UseDragSelectionOptions {
  selectionState: SelectionState;
  activeCell: CellCoordinate;
  editing: EditingState | null;
  setSelectionState: React.Dispatch<React.SetStateAction<SelectionState>>;
  setActiveCell: React.Dispatch<React.SetStateAction<CellCoordinate>>;
  gridFocusRef: React.RefObject<HTMLDivElement | null>;
  commitEditingOnBlur: () => boolean;
}

/**
 * `useDragSelection` 훅 반환값입니다.
 */
export interface UseDragSelectionResult {
  handleGridMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleGridMouseOver: (event: React.MouseEvent<HTMLDivElement>) => void;
  resetDragState: () => void;
}

/**
 * 셀 선택 드래그 상호작용을 전담하는 훅입니다.
 *
 * - 단일 선택, `Shift` 확장 선택, `Ctrl/Meta` 다중 추가 선택을 처리합니다.
 * - 드래그 중 발생하는 잦은 포인터 이벤트는 `requestAnimationFrame`으로 배치해
 *   상태 업데이트 빈도를 프레임 단위로 제한합니다.
 * - 마우스 업 시점에 미처 반영되지 않은 마지막 포인터 좌표를 flush 하여
 *   드래그 종료 순간의 선택 상태를 정확히 반영합니다.
 *
 * @param options 선택 상태/편집 상태/포커스 제어에 필요한 의존성
 * @returns 그리드 루트에 연결할 마우스 이벤트 핸들러와 드래그 상태 리셋 함수
 */
export const useDragSelection = (options: UseDragSelectionOptions): UseDragSelectionResult => {
  const { selectionState, activeCell, editing, setSelectionState, setActiveCell, gridFocusRef, commitEditingOnBlur } = options;

  const draggingRef = useRef<DragContext | null>(null);
  const pendingDragCellRef = useRef<CellCoordinate | null>(null);
  const lastAppliedDragCellRef = useRef<CellCoordinate | null>(null);
  const dragFrameRef = useRef<number | null>(null);

  /**
   * 드래그 포커스 좌표를 선택 상태에 반영합니다.
   *
   * @param cell 현재 포인터가 위치한 셀 좌표
   */
  const applyDragFocus = useCallback(
    (cell: CellCoordinate) => {
      const drag = draggingRef.current;
      if (!drag) {
        return;
      }

      const previousApplied = lastAppliedDragCellRef.current;
      if (previousApplied && isSameCell(previousApplied, cell)) {
        return;
      }

      setSelectionState((prev) => {
        const nextRanges = [...prev.ranges];
        const existingRange = nextRanges[drag.rangeIndex] ?? createSingleRange(drag.anchor);

        if (
          prev.primaryIndex === drag.rangeIndex &&
          isSameCell(existingRange.anchor, drag.anchor) &&
          isSameCell(existingRange.focus, cell)
        ) {
          return prev;
        }

        nextRanges[drag.rangeIndex] = {
          anchor: drag.anchor,
          focus: cell
        };

        return {
          ranges: nextRanges,
          primaryIndex: drag.rangeIndex
        };
      });

      setActiveCell((prev) => (isSameCell(prev, cell) ? prev : cell));
      lastAppliedDragCellRef.current = cell;
    },
    [setActiveCell, setSelectionState]
  );

  /**
   * `requestAnimationFrame` 큐에 남아있는 마지막 드래그 좌표를 즉시 반영합니다.
   */
  const flushPendingDragCell = useCallback(() => {
    if (dragFrameRef.current !== null) {
      cancelAnimationFrame(dragFrameRef.current);
      dragFrameRef.current = null;
    }

    const pending = pendingDragCellRef.current;
    pendingDragCellRef.current = null;
    if (pending) {
      applyDragFocus(pending);
    }
  }, [applyDragFocus]);

  /**
   * 드래그 관련 임시 상태를 모두 초기화합니다.
   */
  const resetDragState = useCallback(() => {
    flushPendingDragCell();
    draggingRef.current = null;
    lastAppliedDragCellRef.current = null;
  }, [flushPendingDragCell]);

  useEffect(() => {
    const onMouseUp = () => {
      resetDragState();
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!draggingRef.current) {
        return;
      }

      const target = document.elementFromPoint(event.clientX, event.clientY);
      const cell = readCellCoordinateFromEventTarget(target);
      if (!cell) {
        return;
      }

      pendingDragCellRef.current = cell;
      if (dragFrameRef.current !== null) {
        return;
      }

      dragFrameRef.current = requestAnimationFrame(() => {
        dragFrameRef.current = null;
        const pending = pendingDragCellRef.current;
        pendingDragCellRef.current = null;
        if (!pending) {
          return;
        }
        applyDragFocus(pending);
      });
    };

    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      resetDragState();
    };
  }, [applyDragFocus, resetDragState]);

  /**
   * 셀 포인터 다운 시 선택 모드(단일/확장/추가)를 결정하고 초기 상태를 설정합니다.
   *
   * @param cell 포인터 다운된 셀
   * @param event 마우스 다운 이벤트
   */
  const handleCellPointerDown = useCallback(
    (cell: CellCoordinate, event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (editing) {
        const committed = commitEditingOnBlur();
        if (!committed) {
          return;
        }
      }

      gridFocusRef.current?.focus();

      if (event.shiftKey) {
        const index = clamp(selectionState.primaryIndex, 0, selectionState.ranges.length - 1);
        const primary = selectionState.ranges[index] ?? createSingleRange(activeCell);

        draggingRef.current = {
          mode: 'extend',
          rangeIndex: index,
          anchor: primary.anchor
        };

        setSelectionState((prev) => {
          const safeIndex = clamp(index, 0, prev.ranges.length - 1);
          const source = prev.ranges[safeIndex] ?? createSingleRange(activeCell);
          const nextRanges = [...prev.ranges];
          nextRanges[safeIndex] = {
            anchor: source.anchor,
            focus: cell
          };

          return {
            ranges: nextRanges,
            primaryIndex: safeIndex
          };
        });
      } else if (event.ctrlKey || event.metaKey) {
        const appendIndex = selectionState.ranges.length;

        draggingRef.current = {
          mode: 'append',
          rangeIndex: appendIndex,
          anchor: cell
        };

        setSelectionState((prev) => {
          const nextRanges = [...prev.ranges, createSingleRange(cell)];
          return {
            ranges: nextRanges,
            primaryIndex: nextRanges.length - 1
          };
        });
      } else {
        draggingRef.current = {
          mode: 'replace',
          rangeIndex: 0,
          anchor: cell
        };

        setSelectionState({
          ranges: [createSingleRange(cell)],
          primaryIndex: 0
        });
      }

      pendingDragCellRef.current = null;
      lastAppliedDragCellRef.current = cell;
      setActiveCell((prev) => (isSameCell(prev, cell) ? prev : cell));
    },
    [activeCell, commitEditingOnBlur, editing, gridFocusRef, selectionState, setActiveCell, setSelectionState]
  );

  /**
   * 드래그 중 포인터가 다른 셀로 진입할 때 다음 프레임 업데이트를 예약합니다.
   *
   * @param cell 포인터 진입 셀
   */
  const handleCellPointerEnter = useCallback(
    (cell: CellCoordinate) => {
      if (!draggingRef.current) {
        return;
      }

      pendingDragCellRef.current = cell;
      if (dragFrameRef.current !== null) {
        return;
      }

      dragFrameRef.current = requestAnimationFrame(() => {
        dragFrameRef.current = null;
        const pending = pendingDragCellRef.current;
        pendingDragCellRef.current = null;
        if (!pending) {
          return;
        }
        applyDragFocus(pending);
      });
    },
    [applyDragFocus]
  );

  /**
   * 그리드 루트 `mouseDown`을 셀 좌표 기반 선택 처리로 위임합니다.
   *
   * @param event 그리드 루트 마우스 다운 이벤트
   */
  const handleGridMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const cell = readCellCoordinateFromEventTarget(event.target);
      if (!cell) {
        return;
      }
      handleCellPointerDown(cell, event);
    },
    [handleCellPointerDown]
  );

  /**
   * 그리드 루트 `mouseOver`를 드래그 확장 처리로 위임합니다.
   *
   * @param event 그리드 루트 마우스 오버 이벤트
   */
  const handleGridMouseOver = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const cell = readCellCoordinateFromEventTarget(event.target);
      if (!cell) {
        return;
      }

      const previousCell = readCellCoordinateFromEventTarget(event.relatedTarget);
      if (previousCell && isSameCell(previousCell, cell)) {
        return;
      }

      handleCellPointerEnter(cell);
    },
    [handleCellPointerEnter]
  );

  return {
    handleGridMouseDown,
    handleGridMouseOver,
    resetDragState
  };
};
