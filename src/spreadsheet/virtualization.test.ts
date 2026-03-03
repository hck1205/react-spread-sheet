import { describe, expect, it } from 'vitest';
import { getNextDynamicBuffer, getVisibleRowWindow } from './virtualization';

describe('spreadsheet/virtualization', () => {
  it('computes visible row window with buffer', () => {
    const result = getVisibleRowWindow({
      rowCount: 100,
      rowHeight: 20,
      viewportHeight: 100,
      scrollTop: 200,
      bufferPx: 40
    });

    expect(result.startRow).toBe(8);
    expect(result.endRow).toBe(17);
    expect(result.visibleRows[0]).toBe(8);
    expect(result.visibleRows[result.visibleRows.length - 1]).toBe(17);
  });

  it('returns empty window when rowCount is zero', () => {
    const result = getVisibleRowWindow({
      rowCount: 0,
      rowHeight: 30,
      viewportHeight: 300,
      scrollTop: 0,
      bufferPx: 100
    });

    expect(result).toEqual({
      startRow: 0,
      endRow: -1,
      visibleRows: []
    });
  });

  it('keeps previous buffer when change is smaller than row height', () => {
    const next = getNextDynamicBuffer({
      previousBufferPx: 500,
      baseBufferPx: 480,
      maxBufferPx: 2400,
      scrollDeltaPx: 20,
      deltaTimeMs: 20,
      predictionMs: 140,
      rowHeight: 32
    });

    expect(next).toBe(500);
  });

  it('increases buffer for fast scrolling and clamps to max', () => {
    const next = getNextDynamicBuffer({
      previousBufferPx: 480,
      baseBufferPx: 480,
      maxBufferPx: 900,
      scrollDeltaPx: 5000,
      deltaTimeMs: 10,
      predictionMs: 140,
      rowHeight: 32
    });

    expect(next).toBe(900);
  });
});
