# Core Architecture

`src/core`는 스프레드시트 엔진의 비즈니스 로직 계층입니다.  
UI(`Spreadsheet.tsx`)는 core를 호출하는 어댑터 역할만 수행하고, 상태 전이/명령 처리/저장 전략은 core에서 결정합니다.

## 폴더별 역할

| 영역 | 주요 파일 | 역할 | 연관 관계 |
|---|---|---|---|
| Model | `model/const.ts`, `model/types.ts` | 타입 후보 상수/도메인 타입/셀 유틸 제공 | Address, Storage, State, Commands |
| Address | `address/a1.ts` | 좌표 <-> A1, 좌표 <-> key 변환 | Model |
| Storage | `storage/store.ts` | Dense/Sparse 저장소 구현 및 팩토리 | Model, Address |
| State | `state/state.ts` | `dataState`/`uiState` 생성 및 갱신 | Model, Storage |
| Commands | `commands/const.ts`, `commands/reducer.ts` | 명령 실행, undo/redo, effect 처리 | State, Model, Plugins |
| Plugins | `plugins/hooks.ts` | before/after/effect hook 확장 지점 | Commands, State |
| Renderer | `renderer/const.ts`, `renderer/strategy.ts` | 렌더 전략 상수/타입 및 기본 설정 | UI 계층 |

### `model/`
- 도메인 기본 타입 정의
- 타입 후보 정적 상수는 `const.ts`에서 관리 (`CELL_TYPES`, `DATA_STORAGE_KINDS`)
- 셀 구조(`SpreadsheetCell`)와 저장 전략 타입(`DataStorageKind`) 제공
- 공통 유틸(`EMPTY_CELL`, `cloneCell`, `isCellEmpty`) 제공

### `address/`
- 좌표 체계 변환 유틸
- 내부 좌표(`rowIndex`, `colIndex`) <-> 문자열 키(`row:col`)
- 내부 좌표 <-> A1 표기(`A1`, `AB10`) 변환

### `storage/`
- 데이터 저장소 인터페이스와 구현체
- `DenseGridStore`: 2D 배열 기반 저장소
- `SparseGridStore`: Map 기반 저장소
- `createGridDataStore`: 전략(`dense|sparse`)에 맞는 저장소 생성

### `state/`
- 상태 스냅샷 생성/갱신 유틸
- `dataState`와 `uiState`를 분리해 생성
- 셀 읽기/쓰기(`getCell`, `setCell`)와 UI 갱신(`setSelection`, `setFocusedCell`) 제공

### `commands/`
- 명령 기반 상태 전이 계층
- 명령/액션/effect 문자열 상수는 `const.ts`에서 관리
- `SpreadsheetCommand`, `SpreadsheetAction`, `SpreadsheetEffect` 정의
- `spreadsheetReducer`에서 커맨드 실행 + undo/redo 처리
- `createSetCellCommand`로 undo 가능한 커맨드 생성

### `plugins/`
- 명령 파이프라인 확장 지점
- `beforeCommand`: 실행 전 커맨드 변환/취소
- `afterCommand`: 실행 후 후처리
- `mapEffects`: effect 재작성

### `renderer/`
- 렌더링 전략 타입/기본 설정 보관
- 렌더링 전략 후보 상수는 `const.ts`에서 관리 (`RENDERER_STRATEGIES`)
- 현재는 타입 계층(`RendererStrategy`, `RendererConfig`)만 담당
- 실제 렌더러 구현은 UI 레이어에서 사용

## 통합 시 관계(의존 방향)

의존 방향은 아래처럼 단방향을 유지합니다.

1. `model`  
2. `address` -> `model`
3. `storage` -> `model`, `address`
4. `state` -> `model`, `storage`
5. `plugins` -> `state`, `commands` 타입
6. `commands` -> `model`, `state`, `plugins`
7. `renderer` (독립 타입 계층)
8. UI(`Spreadsheet.tsx`) -> `core` 공개 API

핵심 원칙:
- `UI`는 저장소 구현 상세를 모릅니다.
- `commands`만이 상태 전이(특히 undo/redo)를 조율합니다.
- `plugins`는 reducer 바깥이 아니라 reducer 파이프라인 안에서 동작합니다.

## 런타임 데이터 흐름

1. UI 이벤트 발생 (`input`, `selection` 등)
2. UI가 `commands` 액션 dispatch
3. `commands`가 `beforeCommand` 플러그인 실행
4. `state`/`storage`를 통해 실제 상태 변경
5. `commands`가 history(undo/redo) 갱신
6. `afterCommand`/`mapEffects` 플러그인 실행
7. UI가 최신 상태를 다시 렌더링

## 대표 통합 시나리오

### 셀 값 변경
1. UI가 `createSetCellCommand` 생성
2. `spreadsheetReducer`가 커맨드 적용
3. 내부에서 `state.setCell` 호출
4. `state.setCell`은 `store.clone()` 후 데이터 반영
5. history undoStack에 커맨드 누적

### undo
1. UI가 `history/undo` 액션 dispatch
2. `commands`가 최근 커맨드의 역커맨드 계산
3. 역커맨드 적용 후 undo/redo 스택 재배치

## 확장 가이드

### 새 명령 추가
- `commands/reducer.ts`에 `SpreadsheetCommand` 유니온 확장
- `applyCommand`에 분기 추가
- 필요 시 effect 타입 확장
- 해당 폴더 테스트(`commands.test.ts`) 추가/수정

### 새 저장 전략 추가
- `storage/`에 `GridDataStore` 구현체 추가
- `createGridDataStore` 팩토리 분기 확장
- `state`/`commands` 변경 없이 동작하도록 인터페이스 준수

### 새 플러그인 추가
- `plugins` 인터페이스 준수 객체 작성
- UI에서 reducer 호출 시 plugins 배열 주입
- 부작용은 `mapEffects`/`afterCommand`에서 통제

## 테스트 규칙

- 각 폴더는 대응 테스트 파일을 유지합니다.
  - `address/address.test.ts`
  - `storage/storage.test.ts`
  - `state/state.test.ts`
  - `commands/commands.test.ts`
  - `model/model.test.ts`
  - `renderer/renderer.test.ts`
- 로직 변경 시 같은 폴더 테스트를 함께 갱신합니다.
