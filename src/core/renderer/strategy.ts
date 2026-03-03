import { RENDERER_STRATEGIES } from './const';

export type RendererStrategy = (typeof RENDERER_STRATEGIES)[number];

export interface RendererConfig {
  strategy: RendererStrategy;
  virtualization: boolean;
  rowHeight: number;
  overscan: number;
}

/**
 * 렌더러 기본 설정값입니다.
 *
 * 목적:
 * - 기본 전략을 `div-grid`로 통일
 * - 대용량 시트를 위한 virtualization 활성화
 * - 무난한 기본 행 높이/overscan 제공
 */
export const DEFAULT_RENDERER_CONFIG: RendererConfig = {
  strategy: 'div-grid',
  virtualization: true,
  rowHeight: 32,
  overscan: 6
};
