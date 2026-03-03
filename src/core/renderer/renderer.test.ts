import { describe, expect, it } from 'vitest';
import { DEFAULT_RENDERER_CONFIG, RENDERER_STRATEGIES } from './index';

describe('core/renderer', () => {
  it('exposes sane defaults for virtualized grid rendering', () => {
    expect(DEFAULT_RENDERER_CONFIG).toEqual({
      strategy: 'div-grid',
      virtualization: true,
      rowHeight: 32,
      overscan: 6
    });
  });

  it('exposes static renderer strategy constants', () => {
    expect(RENDERER_STRATEGIES).toEqual(['dom-table', 'div-grid', 'canvas', 'hybrid']);
  });
});
