import { describe, expect, it } from 'vitest';
import { buildSpreadsheetStatusModel } from './use-spreadsheet-status-model';

describe('buildSpreadsheetStatusModel', () => {
  it('활성 셀 좌표를 이름 박스 라벨로 변환한다', () => {
    const model = buildSpreadsheetStatusModel({
      activeCell: { rowIndex: 4, colIndex: 2 },
      editing: null,
      formulaValue: '123'
    });

    expect(model.nameBoxLabel).toBe('C5');
    expect(model.formulaText).toBe('123');
    expect(model.isEditing).toBe(false);
    expect(model.hasError).toBe(false);
    expect(model.errorMessage).toBeNull();
  });

  it('편집 에러가 있으면 에러 노출 플래그와 메시지를 반환한다', () => {
    const model = buildSpreadsheetStatusModel({
      activeCell: { rowIndex: 0, colIndex: 0 },
      editing: { cell: { rowIndex: 0, colIndex: 0 }, error: '유효성 검증 실패' },
      formulaValue: 'draft'
    });

    expect(model.nameBoxLabel).toBe('A1');
    expect(model.formulaText).toBe('draft');
    expect(model.isEditing).toBe(true);
    expect(model.hasError).toBe(true);
    expect(model.errorMessage).toBe('유효성 검증 실패');
  });
});
