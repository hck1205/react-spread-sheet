# react-spread-sheet

npm 배포를 전제로 한 **React 기반 Spreadsheet 라이브러리 최소 셋업**입니다.

## 사용 원칙 (Public API)

- 소비자는 `SpreadSheetGrid` **하나의 컴포넌트만 렌더링**하면 됩니다.
- 내부 선택/편집/드래그 로직은 라이브러리에 캡슐화되어 있으며 사용자에게 위임하지 않습니다.
- 기본 기능은 항상 활성화됩니다.
  - 셀 드래그 선택
  - 행/열 헤더 드래그 다중 선택
  - 셀 편집(더블클릭/키보드)
  - 좌상단 코너 클릭 전체 선택

```tsx
import { SpreadSheetGrid } from '@your-scope/react-spread-sheet';

export function App() {
  return <SpreadSheetGrid rows={1000} cols={26} />;
}
```

```tsx
// 렌더 섹션 제어
<SpreadSheetGrid renderToolbar={false} renderColumnTitle={true} renderRowTitle={true} />
```

## 포함된 스택

- React (peer dependency)
- TypeScript
- Vite (library mode)
- Jotai
- Emotion
- Tailwind CSS

## 0단계 아키텍처 스켈레톤

- 데이터 모델: `rows/cols + cell(value/type/meta)`, 저장소는 `sparse | dense` 지원
- 좌표 시스템: `rowIndex/colIndex` + `A1` 변환 유틸
- 상태 분리: `dataState` 와 `uiState(selection/focus/scroll/editing)` 분리
- 이벤트 구조: `Command(undo/redo 가능) + Reducer + Effects + Plugin Hook`
- 렌더러 전략: `dom-table | div-grid | canvas | hybrid` 타입/설정 제공

## Core 폴더 규칙

- `src/core`는 기능별 하위 폴더로 분리한다.
- 각 하위 폴더는 `index.ts`를 통해 외부 공개 API를 노출한다.
- 루트 `src/core/index.ts`는 하위 폴더 `index.ts`만 re-export 한다.
- 각 폴더의 함수/검증 로직은 대응되는 테스트 코드(`*.test.ts`)를 반드시 작성한다.
- core의 함수에는 JSDoc을 작성해 입력/출력/부작용을 명확히 문서화한다.

## 시작하기

```bash
npm install
npm run typecheck
npm run build
```

## 로컬 소비자 앱 예제 (설치 사용자 시나리오)

라이브러리를 실제 설치해서 쓰는 흐름을 검증하려면 `examples/local-consumer`를 사용하세요.
이 예제는 `@your-scope/react-spread-sheet`를 `file:../..`로 설치해 로컬 테스트에 활용합니다.

```bash
# 1) 예제 의존성 설치
npm run example:install

# 2) 예제 실행
npm run example:dev
```

브라우저에서 `http://127.0.0.1:4173`을 열면 됩니다.

라이브러리 소스 변경사항 반영 테스트:

```bash
# 라이브러리 빌드
npm run build

# 필요 시 예제에서 재설치
npm run example:install
```

## 배포 전 체크리스트

1. `package.json`의 `name`을 실제 npm 스코프로 변경
2. `version` 업데이트
3. npm 로그인
4. 배포

```bash
npm login
npm publish
```

## 출력물

빌드 결과물은 `dist/`에 생성됩니다.

- `dist/index.js` (ESM)
- `dist/index.cjs` (CommonJS)
- `dist/index.d.ts` (TypeScript types)
- `dist/react-spread-sheet.css` (Tailwind styles)
