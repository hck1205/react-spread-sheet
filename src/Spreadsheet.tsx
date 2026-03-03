import styled from '@emotion/styled';
import { atom, useAtom } from 'jotai';
import { useMemo } from 'react';

export type SpreadsheetCell = string;
export type SpreadsheetValue = SpreadsheetCell[][];

export interface SpreadsheetProps {
  rows?: number;
  cols?: number;
  initialValue?: SpreadsheetValue;
  className?: string;
}

const createInitialGrid = (rows: number, cols: number): SpreadsheetValue =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''));

const CellInput = styled.input`
  width: 100%;
  border: 1px solid #e5e7eb;
  padding: 0.5rem;
  font-size: 0.875rem;
  background-color: #ffffff;

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
  }
`;

export function Spreadsheet({ rows = 10, cols = 5, initialValue, className }: SpreadsheetProps) {
  const initialGrid = useMemo(() => {
    if (initialValue && initialValue.length > 0) {
      return initialValue;
    }

    return createInitialGrid(rows, cols);
  }, [cols, initialValue, rows]);

  const gridAtom = useMemo(() => atom<SpreadsheetValue>(initialGrid), [initialGrid]);
  const [grid, setGrid] = useAtom(gridAtom);

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    setGrid((prev) =>
      prev.map((row, r) => row.map((cell, c) => (r === rowIndex && c === colIndex ? value : cell)))
    );
  };

  return (
    <div className={className}>
      <div className="overflow-auto rounded-xl border border-slate-200">
        <table className="min-w-full border-collapse bg-white">
          <tbody>
            {grid.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`}>
                {row.map((cell, colIndex) => (
                  <td key={`cell-${rowIndex}-${colIndex}`} className="min-w-28 border border-slate-200">
                    <CellInput
                      value={cell}
                      onChange={(event) => updateCell(rowIndex, colIndex, event.target.value)}
                      aria-label={`cell-${rowIndex}-${colIndex}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
