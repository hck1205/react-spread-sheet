import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function DevApp() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">react-spread-sheet</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Hello World</h1>
        <p className="mt-3 text-slate-600">스프레드시트 라이브러리 개발을 위한 로컬 개발 화면입니다.</p>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DevApp />
  </StrictMode>
);
