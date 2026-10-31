import React, { useState, useMemo } from 'react';
import { Table, Download, Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface DataTableProps {
  columns: string[];
  rows: any[][];
  title?: string;
  defaultPageSize?: number;
}

export function DataTable({ columns, rows, title = 'Supporting Transactional Figures', defaultPageSize = 10 }: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColIdx, setSortColIdx] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = defaultPageSize;

  // Filter rows by search term
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter(row =>
      row.some(val => (val !== null && val !== undefined ? String(val).toLowerCase().includes(term) : false))
    );
  }, [rows, searchTerm]);

  // Sort rows
  const sortedRows = useMemo(() => {
    if (sortColIdx === null) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const valA = a[sortColIdx];
      const valB = b[sortColIdx];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [filteredRows, sortColIdx, sortAsc]);

  const totalPages = Math.ceil(sortedRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  const handleSort = (idx: number) => {
    if (sortColIdx === idx) {
      setSortAsc(!sortAsc);
    } else {
      setSortColIdx(idx);
      setSortAsc(true);
    }
  };

  const handleExportCsv = () => {
    const csvHeader = columns.join(',');
    const csvBody = sortedRows
      .map(row =>
        row
          .map(val => {
            if (val === null || val === undefined) return '""';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(',')
      )
      .join('\n');

    const blob = new Blob([`${csvHeader}\n${csvBody}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sales_bi_figures_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCellValue = (val: any, colName: string) => {
    if (val === null || val === undefined) return <span className="text-slate-500 italic">null</span>;

    const lowerCol = colName.toLowerCase();
    if (typeof val === 'number') {
      if (lowerCol.includes('revenue') || lowerCol.includes('price') || lowerCol.includes('discount') || lowerCol.includes('diff') || lowerCol.includes('sales')) {
        return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      if (lowerCol.includes('growth') || lowerCol.includes('percent')) {
        const isPos = val >= 0;
        return (
          <span className={`font-semibold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPos ? `+${val}%` : `${val}%`}
          </span>
        );
      }
      return val.toLocaleString();
    }

    if (colName.toLowerCase() === 'status') {
      if (val === 'Completed') {
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/70 text-emerald-400 border border-emerald-800/40">{val}</span>;
      }
      if (val === 'Returned') {
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-950/70 text-rose-400 border border-rose-800/40">{val}</span>;
      }
    }

    return String(val);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden mt-5 shadow-sm">
      <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-sky-400" />
          <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
          <span className="text-xs text-slate-400">({sortedRows.length} total)</span>
        </div>

        <div className="flex items-center gap-2.5">
          {rows.length > 5 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Filter table..."
                className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 w-44 transition-colors"
              />
            </div>
          )}

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700/50 transition-colors"
            title="Export supporting data to CSV"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/70 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => handleSort(idx)}
                  className="px-4 py-3 font-semibold cursor-pointer select-none hover:text-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.replace(/_/g, ' ')}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6 text-center text-slate-500">
                  No matching data records found.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-slate-800/40 transition-colors">
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className="px-4 py-2.5 whitespace-nowrap">
                      {formatCellValue(cell, columns[cellIdx])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
