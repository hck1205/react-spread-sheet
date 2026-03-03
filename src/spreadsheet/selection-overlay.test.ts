import { describe, expect, it } from 'vitest';
import { buildSelectionOverlayRects } from './selection-overlay';

describe('spreadsheet/selection-overlay', () => {
  it('converts a single range into overlay rect coordinates', () => {
    const rects = buildSelectionOverlayRects({
      ranges: [
        {
          anchor: { rowIndex: 2, colIndex: 1 },
          focus: { rowIndex: 4, colIndex: 3 }
        }
      ],
      rowHeight: 28,
      columnWidth: 120,
      rowHeaderWidth: 56
    });

    expect(rects).toEqual([
      {
        top: 56,
        left: 176,
        width: 360,
        height: 84
      }
    ]);
  });

  it('normalizes reversed ranges when creating rects', () => {
    const rects = buildSelectionOverlayRects({
      ranges: [
        {
          anchor: { rowIndex: 6, colIndex: 5 },
          focus: { rowIndex: 3, colIndex: 2 }
        }
      ],
      rowHeight: 20,
      columnWidth: 100,
      rowHeaderWidth: 40
    });

    expect(rects).toEqual([
      {
        top: 60,
        left: 240,
        width: 400,
        height: 80
      }
    ]);
  });
});
