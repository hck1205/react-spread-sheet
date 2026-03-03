# react-spread-sheet

npm 배포를 전제로 한 **React 기반 Spreadsheet 라이브러리 최소 셋업**입니다.

## 포함된 스택

- React (peer dependency)
- TypeScript
- Vite (library mode)
- Jotai
- Emotion
- Tailwind CSS

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
