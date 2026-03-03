/**
 * 데이터 저장 전략 후보 목록입니다.
 *
 * @remarks
 * 타입은 `DataStorageKind`에서 이 상수로부터 파생됩니다.
 */
export const DATA_STORAGE_KINDS = ['sparse', 'dense'] as const;

/**
 * 셀 데이터 타입 후보 목록입니다.
 *
 * @remarks
 * 타입은 `CellType`에서 이 상수로부터 파생됩니다.
 */
export const CELL_TYPES = ['empty', 'text', 'number', 'boolean', 'date', 'formula'] as const;
