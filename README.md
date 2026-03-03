# react-spread-sheet

npm 배포를 전제로 한 **React 기반 Spreadsheet 라이브러리 최소 셋업**입니다.

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
- `dist/style.css` (Tailwind styles)
