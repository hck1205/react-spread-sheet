import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Spreadsheet } from './Spreadsheet';
import './styles.css';

const sampleRows = [
  ['Item', 'Q1', 'Q2', 'Q3', 'Q4'],
  ['Revenue', '1200', '1360', '1490', '1710'],
  ['Cost', '700', '760', '820', '900'],
  ['Profit', '500', '600', '670', '810']
];

function DevApp() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto max-w-6xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">react-spread-sheet</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">MVP Grid (10,000 rows)</h1>
        <p className="mt-3 text-slate-600">
          row virtualization + 고정 헤더 + 스크롤 동기화가 적용된 1단계 기본 그리드입니다.
        </p>
        <div className="mt-6">
          <Spreadsheet
            rows={10000}
            cols={24}
            initialValue={sampleRows}
            storage="sparse"
            rendererStrategy="div-grid"
            defaultColumnWidth={110}
            defaultRowHeight={30}
            viewportHeight={560}
            overscan={10}
          />
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DevApp />
  </StrictMode>
);
