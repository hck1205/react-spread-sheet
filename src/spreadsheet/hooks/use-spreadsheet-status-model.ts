import { useMemo } from 'react';
import { columnIndexToLabel, type CellCoordinate } from '../../core';
import type { EditingState } from '../types';

/**
 * 상단 상태 영역(이름 박스/수식바/에러박스) 렌더링 모델 생성 입력값입니다.
 */
export interface BuildSpreadsheetStatusModelParams {
  /**
   * 현재 활성 셀 좌표입니다.
   *
   * 이름 박스(A1 표기)를 계산할 때 사용됩니다.
   */
  activeCell: CellCoordinate;
  /**
   * 현재 편집 상태입니다.
   *
   * 편집 중이면 에러 메시지 노출 여부를 결정하고,
   * 툴바 입력 영역 강조 스타일 판단에 사용됩니다.
   */
  editing: EditingState | null;
  /**
   * 수식바에 노출할 문자열입니다.
   *
   * 편집 중에는 draft 값, 비편집 상태에서는 활성 셀 값이 들어옵니다.
   */
  formulaValue: string;
}

/**
 * 상단 상태 영역 렌더링에 필요한 정규화된 ViewModel 입니다.
 */
export interface SpreadsheetStatusModel {
  /** 현재 표시할 이름 박스 문자열(예: `C12`) */
  nameBoxLabel: string;
  /** 현재 수식바 문자열 */
  formulaText: string;
  /** 편집 모드 활성 여부 */
  isEditing: boolean;
  /** 에러 영역 노출 여부 */
  hasError: boolean;
  /** 에러 메시지. 에러가 없으면 `null` */
  errorMessage: string | null;
}

/**
 * 상단 상태 영역 렌더링에 필요한 ViewModel 을 생성합니다.
 *
 * 이 함수는 **순수 함수**이며, UI 컴포넌트 외부에서 독립적으로 테스트할 수 있습니다.
 * 라이브러리 내부에서는 훅(`useSpreadsheetStatusModel`)에서 이 함수를 호출해
 * memoization된 결과를 컴포넌트에 전달합니다.
 *
 * @param params 상태 모델 계산에 필요한 입력 데이터
 * @returns 상단 상태 영역 렌더링에 즉시 사용할 수 있는 ViewModel
 */
export const buildSpreadsheetStatusModel = (
  params: BuildSpreadsheetStatusModelParams
): SpreadsheetStatusModel => {
  const { activeCell, editing, formulaValue } = params;

  return {
    nameBoxLabel: `${columnIndexToLabel(activeCell.colIndex)}${activeCell.rowIndex + 1}`,
    formulaText: formulaValue,
    isEditing: Boolean(editing),
    hasError: Boolean(editing?.error),
    errorMessage: editing?.error ?? null
  };
};

/**
 * 상단 상태 영역 ViewModel 을 계산하는 전용 훅입니다.
 *
 * - 입력값이 동일하면 이전 계산 결과를 재사용해 불필요한 렌더 계산을 줄입니다.
 * - 외부 사용자 API가 아닌 라이브러리 내부 렌더 계층에서만 사용됩니다.
 *
 * @param params 상태 모델 계산 입력값
 * @returns memoization된 상단 상태 ViewModel
 */
export const useSpreadsheetStatusModel = (
  params: BuildSpreadsheetStatusModelParams
): SpreadsheetStatusModel =>
  useMemo(
    () => buildSpreadsheetStatusModel(params),
    [params.activeCell.colIndex, params.activeCell.rowIndex, params.editing, params.formulaValue]
  );
