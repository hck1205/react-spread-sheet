import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getNextDynamicBuffer } from '../virtualization';

/**
 * `useGridScroll` 훅 입력 옵션입니다.
 */
export interface UseGridScrollOptions {
  defaultRowHeight: number;
  overscan: number;
  renderBufferPx: number;
  maxRenderBufferPx: number;
  scrollPredictionMs: number;
}

/**
 * `useGridScroll` 훅 결과 값입니다.
 */
export interface UseGridScrollResult {
  scrollTop: number;
  scrollLeft: number;
  dynamicBufferPx: number;
  handleScroll: (event: React.UIEvent<HTMLDivElement>) => void;
}

/**
 * 그리드 스크롤 좌표와 동적 렌더 버퍼를 관리합니다.
 *
 * - `scrollTop`, `scrollLeft`를 상태로 유지해 뷰포트 계산의 입력으로 제공합니다.
 * - 스크롤 속도를 기반으로 예측 버퍼를 확장/축소해 빠른 스크롤 시 빈 화면 노출을 줄입니다.
 * - 버퍼 기본값은 `max(renderBufferPx, overscan * rowHeight)`로 계산합니다.
 *
 * @param options 스크롤/버퍼 계산에 필요한 레이아웃 옵션
 * @returns 스크롤 좌표, 현재 버퍼 값, `onScroll` 핸들러
 */
export const useGridScroll = (options: UseGridScrollOptions): UseGridScrollResult => {
  const { defaultRowHeight, overscan, renderBufferPx, maxRenderBufferPx, scrollPredictionMs } = options;

  const baseBufferPx = useMemo(
    () => Math.max(renderBufferPx, overscan * defaultRowHeight),
    [renderBufferPx, overscan, defaultRowHeight]
  );

  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [dynamicBufferPx, setDynamicBufferPx] = useState(baseBufferPx);
  const lastScrollRef = useRef({
    top: 0,
    time: 0
  });

  useEffect(() => {
    setDynamicBufferPx(baseBufferPx);
  }, [baseBufferPx]);

  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const nextTop = event.currentTarget.scrollTop;
      const nextLeft = event.currentTarget.scrollLeft;
      const now = performance.now();
      const deltaTop = Math.abs(nextTop - lastScrollRef.current.top);

      setDynamicBufferPx((prev) =>
        getNextDynamicBuffer({
          previousBufferPx: prev,
          baseBufferPx,
          maxBufferPx: maxRenderBufferPx,
          scrollDeltaPx: deltaTop,
          deltaTimeMs: now - lastScrollRef.current.time,
          predictionMs: scrollPredictionMs,
          rowHeight: defaultRowHeight
        })
      );

      lastScrollRef.current.top = nextTop;
      lastScrollRef.current.time = now;

      setScrollTop(nextTop);
      setScrollLeft(nextLeft);
    },
    [baseBufferPx, maxRenderBufferPx, scrollPredictionMs, defaultRowHeight]
  );

  return {
    scrollTop,
    scrollLeft,
    dynamicBufferPx,
    handleScroll
  };
};
