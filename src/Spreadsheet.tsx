import { useMemo, useRef, useState } from 'react';
import {
  DEFAULT_RENDERER_CONFIG,
  createSpreadsheetState,
  getCell,
  columnIndexToLabel,
  type DataStorageKind,
  type RendererStrategy,
  type SpreadsheetCell
} from './core';

export type SpreadsheetValue = string[][];

export interface SpreadsheetProps {
  rows?: number;
  cols?: number;
  initialValue?: SpreadsheetValue;
  className?: string;
  storage?: DataStorageKind;
  rendererStrategy?: RendererStrategy;
  defaultColumnWidth?: number;
  defaultRowHeight?: number;
  viewportHeight?: number;
  overscan?: number;
  renderBufferPx?: number;
  maxRenderBufferPx?: number;
  scrollPredictionMs?: number;
}

export function Spreadsheet({
  rows = 10,
  cols = 5,
  initialValue,
  className,
  storage = 'sparse',
  rendererStrategy = 'div-grid',
  defaultColumnWidth = 120,
  defaultRowHeight = DEFAULT_RENDERER_CONFIG.rowHeight,
  viewportHeight = 520,
  overscan = DEFAULT_RENDERER_CONFIG.overscan,
  renderBufferPx = 480,
  maxRenderBufferPx = 2400,
  scrollPredictionMs = 140
}: SpreadsheetProps) {
  const state = useMemo(() => {
    const initialCells: Array<{ coord: { rowIndex: number; colIndex: number }; cell: SpreadsheetCell }> = [];

    if (initialValue) {
      initialValue.forEach((row, rowIndex) => {
        row.forEach((value, colIndex) => {
          if (value !== '') {
            initialCells.push({
              coord: { rowIndex, colIndex },
              cell: { value, type: 'text', meta: {} }
            });
          }
        });
      });
    }

    return createSpreadsheetState({
      rows,
      cols,
      storage,
      initialCells
    });
  }, [cols, initialValue, rows, storage]);

  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [dynamicBufferPx, setDynamicBufferPx] = useState(Math.max(renderBufferPx, overscan * defaultRowHeight));
  const lastScrollRef = useRef({
    top: 0,
    time: 0
  });

  const rowHeaderWidth = 56;
  const totalGridWidth = state.dataState.cols * defaultColumnWidth;
  const totalGridHeight = state.dataState.rows * defaultRowHeight;
  const contentWidth = rowHeaderWidth + totalGridWidth;
  const baseBufferPx = Math.max(renderBufferPx, overscan * defaultRowHeight);
  const startRow = Math.max(0, Math.floor((scrollTop - dynamicBufferPx) / defaultRowHeight));
  const endRow = Math.min(
    state.dataState.rows - 1,
    Math.ceil((scrollTop + viewportHeight + dynamicBufferPx) / defaultRowHeight)
  );
  const visibleRows =
    startRow <= endRow ? Array.from({ length: endRow - startRow + 1 }, (_, index) => startRow + index) : [];
  const visibleCols = useMemo(() => Array.from({ length: state.dataState.cols }, (_, index) => index), [state.dataState.cols]);

  return (
    <div className={className} style={{ fontFamily: 'Calibri, "Segoe UI", Arial, sans-serif' }}>
      <div className="mb-2 text-[11px] text-slate-500">
        stage-1 mvp-grid: rows={state.dataState.rows}, cols={state.dataState.cols}, storage={state.dataState.storage},
        renderer={rendererStrategy}, buffer={Math.round(dynamicBufferPx)}px
      </div>
      <div className="overflow-hidden border border-[#bfbfbf] bg-white shadow-sm">
        <div className="flex border-b border-[#d9d9d9] bg-[#f3f3f3]">
          <div
            className="shrink-0 border-r border-[#d9d9d9] text-center text-xs text-[#444]"
            style={{ width: rowHeaderWidth, height: defaultRowHeight, lineHeight: `${defaultRowHeight}px` }}
          />
          <div className="min-w-0 flex-1 overflow-hidden">
            <div
              className="flex"
              style={{
                width: totalGridWidth,
                transform: `translateX(-${scrollLeft}px)`
              }}
            >
              {Array.from({ length: state.dataState.cols }).map((_, colIndex) => (
                <div
                  key={`col-header-${colIndex}`}
                  className="shrink-0 border-r border-[#d9d9d9] text-center text-xs text-[#444]"
                  style={{ width: defaultColumnWidth, height: defaultRowHeight, lineHeight: `${defaultRowHeight}px` }}
                >
                  {columnIndexToLabel(colIndex)}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div
          className="overflow-auto"
          style={{ height: viewportHeight }}
          onScroll={(event) => {
            const nextTop = event.currentTarget.scrollTop;
            const nextLeft = event.currentTarget.scrollLeft;
            const now = performance.now();
            const deltaTop = Math.abs(nextTop - lastScrollRef.current.top);
            const deltaTime = Math.max(1, now - lastScrollRef.current.time);
            const velocityPxPerMs = deltaTop / deltaTime;
            const predictedTravelPx = velocityPxPerMs * scrollPredictionMs;

            setDynamicBufferPx((prev) => {
              const nextBuffer = Math.min(maxRenderBufferPx, Math.max(baseBufferPx, Math.ceil(predictedTravelPx)));
              if (Math.abs(nextBuffer - prev) < defaultRowHeight) {
                return prev;
              }

              return nextBuffer;
            });

            lastScrollRef.current.top = nextTop;
            lastScrollRef.current.time = now;

            setScrollTop(nextTop);
            setScrollLeft(nextLeft);
          }}
        >
          <div
            style={{
              position: 'relative',
              width: contentWidth,
              height: totalGridHeight
            }}
          >
            {visibleRows.map((rowIndex) => (
              <div
                key={`row-${rowIndex}`}
                style={{
                  position: 'absolute',
                  top: rowIndex * defaultRowHeight,
                  left: 0,
                  display: 'flex',
                  width: contentWidth,
                  height: defaultRowHeight
                }}
              >
                <div
                  className="border-b border-r border-[#d9d9d9] bg-[#f3f3f3] text-center text-xs text-[#444]"
                  style={{
                    position: 'sticky',
                    left: 0,
                    zIndex: 10,
                    width: rowHeaderWidth,
                    lineHeight: `${defaultRowHeight}px`
                  }}
                >
                  {rowIndex + 1}
                </div>
                <div className="flex">
                  {visibleCols.map((colIndex) => {
                    const cell = getCell(state.dataState, { rowIndex, colIndex });
                    return (
                      <div
                        key={`cell-${rowIndex}-${colIndex}`}
                        className="overflow-hidden border-b border-r border-[#ececec] bg-white px-2 text-sm text-[#222]"
                        style={{
                          width: defaultColumnWidth,
                          height: defaultRowHeight,
                          lineHeight: `${defaultRowHeight}px`,
                          whiteSpace: 'nowrap'
                        }}
                        title={cell.value}
                      >
                        {cell.value}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
