import { clamp } from './selection';

export interface VisibleRowWindowOptions {
  rowCount: number;
  rowHeight: number;
  viewportHeight: number;
  scrollTop: number;
  bufferPx: number;
}

export interface VisibleRowWindow {
  startRow: number;
  endRow: number;
  visibleRows: number[];
}

/**
 * 현재 스크롤 위치 기준으로 렌더링할 행 범위를 계산합니다.
 *
 * @param options 계산 옵션
 * @returns 시작/끝 행 인덱스와 렌더링 대상 행 배열
 */
export const getVisibleRowWindow = (options: VisibleRowWindowOptions): VisibleRowWindow => {
  const { rowCount, rowHeight, viewportHeight, scrollTop, bufferPx } = options;

  if (rowCount <= 0) {
    return {
      startRow: 0,
      endRow: -1,
      visibleRows: []
    };
  }

  const startRow = clamp(Math.floor((scrollTop - bufferPx) / rowHeight), 0, rowCount - 1);
  const endRow = clamp(Math.ceil((scrollTop + viewportHeight + bufferPx) / rowHeight), 0, rowCount - 1);
  const visibleRows =
    startRow <= endRow ? Array.from({ length: endRow - startRow + 1 }, (_, index) => startRow + index) : [];

  return { startRow, endRow, visibleRows };
};

export interface DynamicBufferOptions {
  previousBufferPx: number;
  baseBufferPx: number;
  maxBufferPx: number;
  scrollDeltaPx: number;
  deltaTimeMs: number;
  predictionMs: number;
  rowHeight: number;
}

/**
 * 스크롤 속도 기반 동적 버퍼 값을 계산합니다.
 *
 * @param options 계산 옵션
 * @returns 다음 버퍼 픽셀 값
 */
export const getNextDynamicBuffer = (options: DynamicBufferOptions): number => {
  const { previousBufferPx, baseBufferPx, maxBufferPx, scrollDeltaPx, deltaTimeMs, predictionMs, rowHeight } = options;
  const safeDeltaTime = Math.max(1, deltaTimeMs);
  const velocityPxPerMs = Math.abs(scrollDeltaPx) / safeDeltaTime;
  const predictedTravelPx = velocityPxPerMs * predictionMs;
  const nextBuffer = Math.min(maxBufferPx, Math.max(baseBufferPx, Math.ceil(predictedTravelPx)));

  if (Math.abs(nextBuffer - previousBufferPx) < rowHeight) {
    return previousBufferPx;
  }

  return nextBuffer;
};
