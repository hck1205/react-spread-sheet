import { SHEET_CLASSNAME, SHEET_COLOR, getToolbarBorder } from '../../const';
import type { SpreadsheetStatusModel } from '../../hooks/use-spreadsheet-status-model';

/**
 * 스프레드시트 상단 상태 섹션 렌더링에 필요한 Props 입니다.
 */
export interface SpreadsheetStatusSectionProps {
  /**
   * 렌더러 전략 이름입니다.
   *
   * 현재는 디버그 정보 문자열에만 사용되지만,
   * 향후 렌더러별 상태 표시/배지로 확장할 수 있도록 분리합니다.
   */
  rendererStrategy: string | undefined;
  /**
   * 현재 동적 렌더 버퍼(px) 값입니다.
   *
   * 가상 스크롤 상태를 빠르게 점검할 수 있도록 상단 정보줄에 표시합니다.
   */
  dynamicBufferPx: number;
  /**
   * 현재 전체 행 수입니다.
   */
  rows: number;
  /**
   * 현재 전체 열 수입니다.
   */
  cols: number;
  /**
   * 데이터 저장소 전략명(`sparse`, `dense`)입니다.
   */
  storage: string;
  /**
   * 툴바 렌더 여부입니다.
   */
  renderToolbar: boolean;
  /**
   * 상단 상태 렌더링용 ViewModel 입니다.
   */
  statusModel: SpreadsheetStatusModel;
  /**
   * 현재 활성 셀의 행 인덱스(0-based)입니다.
   *
   * `freeze to row n` 버튼의 n 계산에 사용됩니다.
   */
  activeRowIndex: number;
  /**
   * 현재 고정(freeze)된 행 개수입니다.
   *
   * 값이 `3`이면 1~3행이 고정된 상태를 의미합니다.
   */
  freezeRows: number;
  /**
   * 고정 행 개수를 변경하는 콜백입니다.
   *
   * 인자로 전달된 값은 "고정할 마지막 행 번호(1-based)"로 해석됩니다.
   */
  onFreezeRowsChange: (next: number) => void;
}

/**
 * 상단 상태 영역(디버그 정보, 에러 박스, 툴바)을 렌더링합니다.
 *
 * 이 컴포넌트는 `SpreadSheetGrid` 내부에 임베딩되어 동작하며,
 * 외부 사용자에게 별도 API 또는 조합 책임을 노출하지 않습니다.
 *
 * @param props 상단 상태 렌더링 입력 데이터
 * @returns 상단 상태 영역 JSX
 */
export function SpreadsheetStatusSection({
  rendererStrategy,
  dynamicBufferPx,
  rows,
  cols,
  storage,
  renderToolbar,
  statusModel,
  activeRowIndex,
  freezeRows,
  onFreezeRowsChange
}: SpreadsheetStatusSectionProps) {
  /** 버튼에서 사용하는 1-based freeze 목표 행 번호 */
  const activeRowNumber = activeRowIndex + 1;

  return (
    <>
      <div className={SHEET_CLASSNAME.TOP_INFO}>
        stage-2 editable-grid: rows={rows}, cols={cols}, storage={storage}, renderer={rendererStrategy},
        buffer={Math.round(dynamicBufferPx)}px, freezeRows={freezeRows}
      </div>
      {statusModel.hasError && statusModel.errorMessage && (
        <div
          className={SHEET_CLASSNAME.ERROR_BOX}
          style={{
            borderColor: SHEET_COLOR.ERROR_BORDER,
            backgroundColor: SHEET_COLOR.ERROR_BG,
            color: SHEET_COLOR.ERROR_TEXT
          }}
        >
          {statusModel.errorMessage}
        </div>
      )}
      {renderToolbar && (
        <div
          className={SHEET_CLASSNAME.TOOLBAR}
          style={{ borderColor: SHEET_COLOR.TOOLBAR_BORDER, backgroundColor: SHEET_COLOR.HEADER_BG }}
        >
          <div
            className={SHEET_CLASSNAME.NAME_BOX}
            style={{
              color: SHEET_COLOR.TEXT_SECONDARY,
              border: getToolbarBorder(statusModel.isEditing)
            }}
          >
            {statusModel.nameBoxLabel}
          </div>
          <div
            className={SHEET_CLASSNAME.FORMULA_BAR}
            style={{
              color: SHEET_COLOR.TEXT_SECONDARY,
              border: getToolbarBorder(statusModel.isEditing)
            }}
          >
            {statusModel.formulaText}
          </div>
        </div>
      )}
      <div className="mb-2 flex items-center gap-2 text-xs">
        <button className="rounded border px-2 py-1" onClick={() => onFreezeRowsChange(activeRowNumber)}>
          freeze to row {activeRowNumber}
        </button>
      </div>
    </>
  );
}
