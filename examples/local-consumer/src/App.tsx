import { SpreadSheetGrid, type SpreadsheetValue } from '@your-scope/react-spread-sheet';

const initialValue: SpreadsheetValue = [
  ['Name', 'Role', 'Team', 'Status'],
  ['Matt', 'Frontend', 'Sheet', 'Active'],
  ['Jin', 'Backend', 'Core', 'Active'],
  ['Ara', 'Design', 'UX', 'Review']
];

export function App() {
  return (
    <main className="app-shell">
      <section className="panel">
        <p className="eyebrow">Local Consumer Example</p>
        <h1>react-spread-sheet install usage</h1>
        <p className="desc">
          이 화면은 라이브러리를 file dependency로 설치한 소비자 앱입니다. 편집/선택/드래그 동작을 로컬에서
          바로 테스트할 수 있습니다.
        </p>
        <SpreadSheetGrid
          rows={2000}
          cols={20}
          initialValue={initialValue}
          storage="sparse"
          rendererStrategy="div-grid"
          defaultColumnWidth={120}
          defaultRowHeight={30}
          viewportHeight={520}
          overscan={8}
          renderToolbar
          renderColumnTitle
          renderRowTitle
        />
      </section>
    </main>
  );
}
