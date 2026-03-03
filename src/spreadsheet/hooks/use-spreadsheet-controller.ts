import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_RENDERER_CONFIG, getCellValue, type CellCoordinate, type DataState } from '../../core';
import {
  SHEET_LAYOUT,
  clamp,
  clearRangesValue,
  createFullSheetRange,
  createInitialDataState,
  createSingleRange,
  readCellCoordinateFromEventTarget,
  type EditingState,
  type SelectionState,
  type SpreadsheetProps,
  useDragSelection,
  useGridDerivedState,
  useGridScroll,
  writeCellValue
} from '../index';

/**
 * `Spreadsheet` 렌더링에 필요한 상태/이벤트를 제공하는 컨트롤러 결과 모델입니다.
 */
export interface SpreadsheetController {
  dataState: DataState;
  activeCell: CellCoordinate;
  editing: EditingState | null;
  rendererStrategy: SpreadsheetProps['rendererStrategy'];
  renderRowTitle: boolean;
  renderColumnTitle: boolean;
  renderToolbar: boolean;
  dynamicBufferPx: number;
  scrollLeft: number;
  rowHeaderWidth: number;
  totalGridWidth: number;
  totalGridHeight: number;
  contentWidth: number;
  visibleRows: number[];
  visibleCols: number[];
  selectedRowSet: Set<number>;
  selectedColSet: Set<number>;
  selectionOverlayRects: ReturnType<typeof useGridDerivedState>['selectionOverlayRects'];
  activeCellRect: ReturnType<typeof useGridDerivedState>['activeCellRect'];
  columnWidthsByIndex: number[];
  rowHeightsByIndex: number[];
  columnOffsets: number[];
  rowOffsets: number[];
  formulaValue: string;
  editingDraftValue: string;
  viewportHeight: number;
  defaultRowHeight: number;
  defaultColumnWidth: number;
  userSelectMode: 'auto' | 'none';
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  gridFocusRef: React.RefObject<HTMLDivElement | null>;
  editingInputRef: React.RefObject<HTMLInputElement | null>;
  handleScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  handleGridKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  handleGridMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleGridMouseOver: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleGridDoubleClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleSelectAllMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleColumnHeaderMouseDown: (colIndex: number, event: React.MouseEvent<HTMLDivElement>) => void;
  handleColumnHeaderMouseEnter: (colIndex: number) => void;
  handleRowHeaderMouseDown: (rowIndex: number, event: React.MouseEvent<HTMLDivElement>) => void;
  handleRowHeaderMouseEnter: (rowIndex: number) => void;
  handleColumnResizeMouseDown: (colIndex: number, event: React.MouseEvent<HTMLDivElement>) => void;
  handleRowResizeMouseDown: (rowIndex: number, event: React.MouseEvent<HTMLDivElement>) => void;
  handleEditingInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleEditingInputCompositionStart: () => void;
  handleEditingInputCompositionEnd: () => void;
  handleEditingInputKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  handleEditingInputBlur: () => void;
}

/**
 * `Spreadsheet` 컴포넌트의 모든 상호작용/상태 로직을 캡슐화한 컨트롤러 훅입니다.
 *
 * - controlled/uncontrolled 활성 셀/선택 상태를 통합 처리합니다.
 * - 스크롤 가상화, 드래그 선택, 키보드 네비게이션, 편집 커밋을 내부에서 관리합니다.
 * - 렌더 계층은 이 훅이 반환하는 상태와 핸들러를 그대로 연결하면 됩니다.
 *
 * @param props 스프레드시트 공개 props
 * @returns 뷰 렌더링에 필요한 상태/핸들러 묶음
 */
export const useSpreadsheetController = (props: SpreadsheetProps): SpreadsheetController => {
  const {
    rows = 10,
    cols = 5,
    initialValue,
    storage = 'sparse',
    rendererStrategy = 'div-grid',
    defaultColumnWidth = 120,
    defaultRowHeight = DEFAULT_RENDERER_CONFIG.rowHeight,
    viewportHeight = 520,
    overscan = DEFAULT_RENDERER_CONFIG.overscan,
    renderBufferPx = 480,
    maxRenderBufferPx = 2400,
    scrollPredictionMs = 140,
    renderRowTitle = true,
    renderColumnTitle = true,
    renderToolbar = true,
    onValidateCell,
    onCellCommit
  } = props;

  const initialDataState = useMemo(
    () =>
      createInitialDataState({
        rows,
        cols,
        storage,
        initialValue
      }),
    [cols, initialValue, rows, storage]
  );

  const [dataState, setDataState] = useState<DataState>(initialDataState);
  const [activeCell, setActiveCell] = useState<CellCoordinate>({ rowIndex: 0, colIndex: 0 });
  const [selectionState, setSelectionState] = useState<SelectionState>({
    ranges: [createSingleRange({ rowIndex: 0, colIndex: 0 })],
    primaryIndex: 0
  });
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<number, number>>({});
  const [rowHeights, setRowHeights] = useState<Record<number, number>>({});
  const activeCellRef = useRef<CellCoordinate>(activeCell);
  const selectionStateRef = useRef<SelectionState>(selectionState);
  const headerDragRef = useRef<{ type: 'row' | 'column'; anchorIndex: number } | null>(null);
  const lastHeaderDragIndexRef = useRef<number | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const gridFocusRef = useRef<HTMLDivElement | null>(null);
  const resizeDragRef = useRef<
    | { type: 'column'; index: number; startClient: number; startSize: number }
    | { type: 'row'; index: number; startClient: number; startSize: number }
    | null
  >(null);
  const composingRef = useRef(false);
  const editingDraftRef = useRef('');
  const editingInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    activeCellRef.current = activeCell;
  }, [activeCell]);

  useEffect(() => {
    selectionStateRef.current = selectionState;
  }, [selectionState]);

  const applyActiveCell = useCallback(
    (next: React.SetStateAction<CellCoordinate>): void => {
      const resolved =
        typeof next === 'function' ? (next as (prev: CellCoordinate) => CellCoordinate)(activeCellRef.current) : next;
      activeCellRef.current = resolved;
      setActiveCell(resolved);
    },
    []
  );

  const applySelectionState = useCallback(
    (next: React.SetStateAction<SelectionState>): void => {
      const resolved =
        typeof next === 'function'
          ? (next as (prev: SelectionState) => SelectionState)(selectionStateRef.current)
          : next;
      selectionStateRef.current = resolved;
      setSelectionState(resolved);
    },
    []
  );

  useEffect(() => {
    setDataState(initialDataState);
    setActiveCell({ rowIndex: 0, colIndex: 0 });
    setSelectionState({
      ranges: [createSingleRange({ rowIndex: 0, colIndex: 0 })],
      primaryIndex: 0
    });
    setEditing(null);
    setColumnWidths({});
    setRowHeights({});
  }, [initialDataState]);

  const { scrollTop, scrollLeft, dynamicBufferPx, handleScroll } = useGridScroll({
    defaultRowHeight,
    overscan,
    renderBufferPx,
    maxRenderBufferPx,
    scrollPredictionMs
  });

  const rowHeaderWidth = renderRowTitle ? SHEET_LAYOUT.ROW_HEADER_WIDTH : 0;
  const {
    totalGridWidth,
    totalGridHeight,
    contentWidth,
    visibleRows,
    visibleCols,
    selectedRowSet,
    selectedColSet,
    selectionOverlayRects,
    activeCellRect,
    columnWidthsByIndex,
    rowHeightsByIndex,
    columnOffsets,
    rowOffsets
  } = useGridDerivedState({
    dataState,
    rowHeaderWidth,
    defaultRowHeight,
    defaultColumnWidth,
    viewportHeight,
    scrollTop,
    dynamicBufferPx,
    selectionRanges: selectionState.ranges,
    activeCell,
    columnWidths,
    rowHeights
  });

  const ensureCellInView = (cell: CellCoordinate) => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const cellTop = rowOffsets[cell.rowIndex] ?? cell.rowIndex * defaultRowHeight;
    const cellBottom = rowOffsets[cell.rowIndex + 1] ?? cellTop + defaultRowHeight;
    if (cellTop < container.scrollTop) {
      container.scrollTop = cellTop;
    } else if (cellBottom > container.scrollTop + container.clientHeight) {
      container.scrollTop = cellBottom - container.clientHeight;
    }

    const cellLeft = rowHeaderWidth + (columnOffsets[cell.colIndex] ?? cell.colIndex * defaultColumnWidth);
    const cellRight = rowHeaderWidth + (columnOffsets[cell.colIndex + 1] ?? cellLeft + defaultColumnWidth);
    if (cellLeft < container.scrollLeft) {
      container.scrollLeft = cellLeft;
    } else if (cellRight > container.scrollLeft + container.clientWidth) {
      container.scrollLeft = cellRight - container.clientWidth;
    }
  };

  const setSingleSelection = (cell: CellCoordinate) => {
    applySelectionState({
      ranges: [createSingleRange(cell)],
      primaryIndex: 0
    });
  };

  const updatePrimaryRangeFocus = (focus: CellCoordinate) => {
    applySelectionState((prev) => {
      const index = clamp(prev.primaryIndex, 0, prev.ranges.length - 1);
      const source = prev.ranges[index] ?? createSingleRange(activeCell);
      const nextRanges = [...prev.ranges];
      nextRanges[index] = {
        anchor: source.anchor,
        focus
      };

      return {
        ranges: nextRanges,
        primaryIndex: index
      };
    });
  };

  const moveActiveCell = (nextCell: CellCoordinate, extendSelection: boolean) => {
    const clamped: CellCoordinate = {
      rowIndex: clamp(nextCell.rowIndex, 0, dataState.rows - 1),
      colIndex: clamp(nextCell.colIndex, 0, dataState.cols - 1)
    };

    applyActiveCell(clamped);
    if (extendSelection) {
      updatePrimaryRangeFocus(clamped);
    } else {
      setSingleSelection(clamped);
    }
    ensureCellInView(clamped);
  };

  const commitEdit = (source: 'enter' | 'blur' | 'tab'): boolean => {
    if (!editing) {
      return true;
    }

    const prevValue = getCellValue(dataState, editing.cell);
    let nextValue = editingDraftRef.current;

    if (onValidateCell) {
      const result = onValidateCell({
        rowIndex: editing.cell.rowIndex,
        colIndex: editing.cell.colIndex,
        prevValue,
        nextValue
      });

      if (typeof result === 'boolean') {
        if (!result) {
          setEditing((prev) => (prev ? { ...prev, error: '유효성 검증에 실패했습니다.' } : prev));
          return false;
        }
      } else if (!result.valid) {
        setEditing((prev) => (prev ? { ...prev, error: result.message ?? '유효성 검증에 실패했습니다.' } : prev));
        return false;
      } else if (typeof result.value === 'string') {
        nextValue = result.value;
      }
    }

    setDataState((prevState) => writeCellValue(prevState, editing.cell.rowIndex, editing.cell.colIndex, nextValue));

    onCellCommit?.({
      rowIndex: editing.cell.rowIndex,
      colIndex: editing.cell.colIndex,
      prevValue,
      nextValue
    });

    setEditing(null);

    if (source === 'enter') {
      moveActiveCell({ rowIndex: editing.cell.rowIndex + 1, colIndex: editing.cell.colIndex }, false);
    } else if (source === 'tab') {
      moveActiveCell({ rowIndex: editing.cell.rowIndex, colIndex: editing.cell.colIndex + 1 }, false);
    }

    return true;
  };

  const cancelEdit = () => {
    editingDraftRef.current = getCellValue(dataState, activeCell);
    setEditing(null);
  };

  const startEdit = (cell: CellCoordinate, seedValue?: string) => {
    const value = seedValue ?? getCellValue(dataState, cell);
    editingDraftRef.current = value;
    applyActiveCell(cell);
    setSingleSelection(cell);
    setEditing({
      cell,
      error: null
    });
    ensureCellInView(cell);
    setTimeout(() => {
      const input = editingInputRef.current;
      if (!input) {
        return;
      }
      input.focus();
      const cursorIndex = input.value.length;
      input.setSelectionRange(cursorIndex, cursorIndex);
    }, 0);
  };

  const clearSelectedCells = () => {
    setDataState((prev) => clearRangesValue(prev, selectionState.ranges));
  };

  const commitEditingOnBlur = (): boolean => {
    if (!editing) {
      return true;
    }
    return commitEdit('blur');
  };

  const { handleGridMouseDown, handleGridMouseOver, resetDragState } = useDragSelection({
    selectionState,
    activeCell,
    editing,
    setSelectionState: applySelectionState,
    setActiveCell: applyActiveCell,
    gridFocusRef,
    commitEditingOnBlur
  });

  const handleSelectAllMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!renderRowTitle || !renderColumnTitle) {
      return;
    }

    if (dataState.rows <= 0 || dataState.cols <= 0) {
      return;
    }

    if (!commitEditingOnBlur()) {
      return;
    }

    gridFocusRef.current?.focus();

    const fullRange = createFullSheetRange(dataState.rows, dataState.cols);
    applySelectionState({
      ranges: [fullRange],
      primaryIndex: 0
    });
    applyActiveCell(fullRange.anchor);
    resetDragState();
  };

  const handleColumnHeaderMouseDown = (colIndex: number, event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!renderColumnTitle) {
      return;
    }

    if (dataState.rows <= 0 || dataState.cols <= 0) {
      return;
    }

    if (!commitEditingOnBlur()) {
      return;
    }

    gridFocusRef.current?.focus();

    const range = {
      anchor: { rowIndex: 0, colIndex },
      focus: { rowIndex: dataState.rows - 1, colIndex }
    };

    applySelectionState({
      ranges: [range],
      primaryIndex: 0
    });
    applyActiveCell(range.anchor);
    headerDragRef.current = { type: 'column', anchorIndex: colIndex };
    lastHeaderDragIndexRef.current = colIndex;
    resetDragState();
  };

  const handleColumnHeaderMouseEnter = (colIndex: number) => {
    const drag = headerDragRef.current;
    if (!drag || drag.type !== 'column') {
      return;
    }

    const left = Math.min(drag.anchorIndex, colIndex);
    const right = Math.max(drag.anchorIndex, colIndex);
    const range = {
      anchor: { rowIndex: 0, colIndex: left },
      focus: { rowIndex: dataState.rows - 1, colIndex: right }
    };

    applySelectionState({
      ranges: [range],
      primaryIndex: 0
    });
    applyActiveCell({ rowIndex: 0, colIndex: left });
  };

  const handleRowHeaderMouseDown = (rowIndex: number, event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!renderRowTitle) {
      return;
    }

    if (dataState.rows <= 0 || dataState.cols <= 0) {
      return;
    }

    if (!commitEditingOnBlur()) {
      return;
    }

    gridFocusRef.current?.focus();

    const range = {
      anchor: { rowIndex, colIndex: 0 },
      focus: { rowIndex, colIndex: dataState.cols - 1 }
    };

    applySelectionState({
      ranges: [range],
      primaryIndex: 0
    });
    applyActiveCell(range.anchor);
    headerDragRef.current = { type: 'row', anchorIndex: rowIndex };
    lastHeaderDragIndexRef.current = rowIndex;
    resetDragState();
  };

  const handleRowHeaderMouseEnter = (rowIndex: number) => {
    const drag = headerDragRef.current;
    if (!drag || drag.type !== 'row') {
      return;
    }

    const top = Math.min(drag.anchorIndex, rowIndex);
    const bottom = Math.max(drag.anchorIndex, rowIndex);
    const range = {
      anchor: { rowIndex: top, colIndex: 0 },
      focus: { rowIndex: bottom, colIndex: dataState.cols - 1 }
    };

    applySelectionState({
      ranges: [range],
      primaryIndex: 0
    });
    applyActiveCell({ rowIndex: top, colIndex: 0 });
  };

  const handleGridDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const cell = readCellCoordinateFromEventTarget(event.target);
    if (!cell) {
      return;
    }
    startEdit(cell);
  };

  const handleColumnResizeMouseDown = (colIndex: number, event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    resizeDragRef.current = {
      type: 'column',
      index: colIndex,
      startClient: event.clientX,
      startSize: columnWidthsByIndex[colIndex] ?? defaultColumnWidth
    };
  };

  const handleRowResizeMouseDown = (rowIndex: number, event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    resizeDragRef.current = {
      type: 'row',
      index: rowIndex,
      startClient: event.clientY,
      startSize: rowHeightsByIndex[rowIndex] ?? defaultRowHeight
    };
  };

  const handleEditingInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    editingDraftRef.current = event.target.value;
    if (editing?.error) {
      setEditing((prev) => (prev ? { ...prev, error: null } : prev));
    }
  };

  const handleEditingInputCompositionStart = () => {
    composingRef.current = true;
  };

  const handleEditingInputCompositionEnd = () => {
    composingRef.current = false;
  };

  const handleEditingInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelEdit();
      return;
    }

    if (event.key === 'Enter') {
      if (composingRef.current) {
        return;
      }
      event.preventDefault();
      commitEdit('enter');
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      commitEdit('tab');
    }
  };

  const handleEditingInputBlur = () => {
    if (composingRef.current) {
      setTimeout(() => {
        if (!composingRef.current) {
          commitEdit('blur');
        }
      }, 0);
      return;
    }

    commitEdit('blur');
  };

  const handleGridKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (editing) {
      return;
    }

    const pageStep = Math.max(1, Math.floor(viewportHeight / defaultRowHeight) - 1);
    const extend = event.shiftKey;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        moveActiveCell({ rowIndex: activeCell.rowIndex - 1, colIndex: activeCell.colIndex }, extend);
        return;
      case 'ArrowDown':
        event.preventDefault();
        moveActiveCell({ rowIndex: activeCell.rowIndex + 1, colIndex: activeCell.colIndex }, extend);
        return;
      case 'ArrowLeft':
        event.preventDefault();
        moveActiveCell({ rowIndex: activeCell.rowIndex, colIndex: activeCell.colIndex - 1 }, extend);
        return;
      case 'ArrowRight':
        event.preventDefault();
        moveActiveCell({ rowIndex: activeCell.rowIndex, colIndex: activeCell.colIndex + 1 }, extend);
        return;
      case 'Tab':
        event.preventDefault();
        moveActiveCell(
          {
            rowIndex: activeCell.rowIndex,
            colIndex: activeCell.colIndex + (event.shiftKey ? -1 : 1)
          },
          false
        );
        return;
      case 'PageUp':
        event.preventDefault();
        moveActiveCell({ rowIndex: activeCell.rowIndex - pageStep, colIndex: activeCell.colIndex }, extend);
        return;
      case 'PageDown':
        event.preventDefault();
        moveActiveCell({ rowIndex: activeCell.rowIndex + pageStep, colIndex: activeCell.colIndex }, extend);
        return;
      case 'Home':
        event.preventDefault();
        moveActiveCell({ rowIndex: activeCell.rowIndex, colIndex: 0 }, extend);
        return;
      case 'End':
        event.preventDefault();
        moveActiveCell({ rowIndex: activeCell.rowIndex, colIndex: dataState.cols - 1 }, extend);
        return;
      case 'Enter':
      case 'F2':
        event.preventDefault();
        startEdit(activeCell);
        return;
      case 'Backspace':
      case 'Delete':
        event.preventDefault();
        clearSelectedCells();
        return;
      default:
        break;
    }

    const isPrintable =
      event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey && event.key !== 'Process';

    if (isPrintable) {
      event.preventDefault();
      startEdit(activeCell, event.key);
    }
  };

  useEffect(() => {
    if (!editing) {
      return;
    }
    ensureCellInView(editing.cell);
  }, [editing]);

  useEffect(() => {
    const updateColumnDragByPointer = (targetColIndex: number) => {
      const drag = headerDragRef.current;
      if (!drag || drag.type !== 'column') {
        return;
      }

      if (lastHeaderDragIndexRef.current === targetColIndex) {
        return;
      }

      const left = Math.min(drag.anchorIndex, targetColIndex);
      const right = Math.max(drag.anchorIndex, targetColIndex);
      const range = {
        anchor: { rowIndex: 0, colIndex: left },
        focus: { rowIndex: dataState.rows - 1, colIndex: right }
      };

      applySelectionState({
        ranges: [range],
        primaryIndex: 0
      });
      applyActiveCell({ rowIndex: 0, colIndex: left });
      lastHeaderDragIndexRef.current = targetColIndex;
    };

    const updateRowDragByPointer = (targetRowIndex: number) => {
      const drag = headerDragRef.current;
      if (!drag || drag.type !== 'row') {
        return;
      }

      if (lastHeaderDragIndexRef.current === targetRowIndex) {
        return;
      }

      const top = Math.min(drag.anchorIndex, targetRowIndex);
      const bottom = Math.max(drag.anchorIndex, targetRowIndex);
      const range = {
        anchor: { rowIndex: top, colIndex: 0 },
        focus: { rowIndex: bottom, colIndex: dataState.cols - 1 }
      };

      applySelectionState({
        ranges: [range],
        primaryIndex: 0
      });
      applyActiveCell({ rowIndex: top, colIndex: 0 });
      lastHeaderDragIndexRef.current = targetRowIndex;
    };

    const onMouseMove = (event: MouseEvent) => {
      const resize = resizeDragRef.current;
      if (resize) {
        if (resize.type === 'column') {
          const delta = event.clientX - resize.startClient;
          const next = Math.max(40, resize.startSize + delta);
          setColumnWidths((prev) => ({ ...prev, [resize.index]: next }));
        } else {
          const delta = event.clientY - resize.startClient;
          const next = Math.max(20, resize.startSize + delta);
          setRowHeights((prev) => ({ ...prev, [resize.index]: next }));
        }
        return;
      }

      const drag = headerDragRef.current;
      if (!drag) {
        return;
      }

      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) {
        return;
      }

      const rect = scrollContainer.getBoundingClientRect();
      const localX = event.clientX - rect.left + scrollContainer.scrollLeft;
      const localY = event.clientY - rect.top + scrollContainer.scrollTop;

      if (drag.type === 'column') {
        if (!renderColumnTitle) {
          return;
        }
        const bodyX = localX - rowHeaderWidth;
        const colIndex = clamp(
          columnOffsets.findIndex((offset, index) => index < columnOffsets.length - 1 && bodyX >= offset && bodyX < (columnOffsets[index + 1] ?? 0)),
          0,
          dataState.cols - 1
        );
        updateColumnDragByPointer(colIndex);
        return;
      }

      if (!renderRowTitle) {
        return;
      }
      const rowIndex = clamp(
        rowOffsets.findIndex((offset, index) => index < rowOffsets.length - 1 && localY >= offset && localY < (rowOffsets[index + 1] ?? 0)),
        0,
        dataState.rows - 1
      );
      updateRowDragByPointer(rowIndex);
    };

    const onMouseUp = () => {
      resizeDragRef.current = null;
      headerDragRef.current = null;
      lastHeaderDragIndexRef.current = null;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [
    applyActiveCell,
    applySelectionState,
    columnOffsets,
    dataState.cols,
    dataState.rows,
    defaultColumnWidth,
    defaultRowHeight,
    renderColumnTitle,
    renderRowTitle,
    rowHeaderWidth,
    rowOffsets
  ]);

  return {
    dataState,
    activeCell,
    editing,
    rendererStrategy,
    renderRowTitle,
    renderColumnTitle,
    renderToolbar,
    dynamicBufferPx,
    scrollLeft,
    rowHeaderWidth,
    totalGridWidth,
    totalGridHeight,
    contentWidth,
    visibleRows,
    visibleCols,
    selectedRowSet,
    selectedColSet,
    selectionOverlayRects,
    activeCellRect,
    columnWidthsByIndex,
    rowHeightsByIndex,
    columnOffsets,
    rowOffsets,
    formulaValue: editing ? editingDraftRef.current : getCellValue(dataState, activeCell),
    editingDraftValue: editingDraftRef.current,
    viewportHeight,
    defaultRowHeight,
    defaultColumnWidth,
    userSelectMode: editing ? 'auto' : 'none',
    scrollContainerRef,
    gridFocusRef,
    editingInputRef,
    handleScroll,
    handleGridKeyDown,
    handleGridMouseDown,
    handleGridMouseOver,
    handleGridDoubleClick,
    handleSelectAllMouseDown,
    handleColumnHeaderMouseDown,
    handleColumnHeaderMouseEnter,
    handleRowHeaderMouseDown,
    handleRowHeaderMouseEnter,
    handleColumnResizeMouseDown,
    handleRowResizeMouseDown,
    handleEditingInputChange,
    handleEditingInputCompositionStart,
    handleEditingInputCompositionEnd,
    handleEditingInputKeyDown,
    handleEditingInputBlur
  };
};
