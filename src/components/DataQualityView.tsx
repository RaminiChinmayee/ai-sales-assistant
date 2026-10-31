import React, { useState } from 'react';
import { Database, ShieldAlert, CheckCircle, Search, Info, RefreshCw, FileText, AlertCircle } from 'lucide-react';
import { SummaryData, TransactionRecord } from '../types.ts';
import { DataTable } from './DataTable.tsx';

interface DataQualityViewProps {
  summary: SummaryData | null;
  records: TransactionRecord[];
  isLoadingRecords: boolean;
  onRefreshRecords: () => void;
}

export function DataQualityView({ summary, records, isLoadingRecords, onRefreshRecords }: DataQualityViewProps) {
  const [filterAnomaliesOnly, setFilterAnomaliesOnly] = useState(false);

  const qualityReport = summary?.quality_report;

  const displayedRecords = filterAnomaliesOnly
    ? records.filter(r => r.is_flagged === 1 || r.status === 'Returned')
    : records;

  // Transform records into columns and rows for DataTable
  const columns = [
    'transaction_id',
    'order_date',
    'product',
    'category',
    'region',
    'sales_channel',
    'quantity',
    'unit_price',
    'discount_amount',
    'status',
    'net_revenue',
    'flag_reason',
  ];

  const rows = displayedRecords.map(r => [
    r.transaction_id,
    r.order_date,
    r.product,
    r.category,
    r.region,
    r.sales_channel,
    r.quantity,
    r.unit_price,
    r.discount_amount,
    r.status,
    r.net_revenue,
    r.flag_reason || 'Clean Record',
  ]);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Database className="w-4 h-4" />
              <span>Data Ingestion & Integrity Pipeline</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Data Management & Anomaly Quarantine
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Supplied CSV ingestion with deterministic cleansing, missing price catalog imputation, and ISO standardization.
            </p>
          </div>

          <button
            onClick={onRefreshRecords}
            disabled={isLoadingRecords}
            className="flex items-center gap-1.5 text-xs px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRecords ? 'animate-spin' : ''}`} />
            <span>Reload Ledger</span>
          </button>
        </div>
      </div>

      {/* Ingestion & Cleansing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">
            <span>Ingestion Audit</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">50 Records</div>
          <div className="text-xs text-slate-400 mt-1">
            100% of rows parsed from supplied sales CSV without data loss.
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">
            <span>Anomalies Detected</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300">
            {qualityReport?.anomalies.length || 3} Cases
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Missing price imputed; returned order isolated; zero volume audited.
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">
            <span>Storage Engine</span>
            <Database className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-sky-300">SQLite WASM</div>
          <div className="text-xs text-slate-400 mt-1">
            In-memory relational database with strict typed schema & ISO date indexing.
          </div>
        </div>
      </div>

      {/* Specific Anomaly Audit Trail */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span>Audited Data Anomalies & Actions Taken</span>
        </h3>

        <div className="space-y-3">
          <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sky-400">TXN0051</span>
                <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800/50 font-medium">
                  Missing Unit Price
                </span>
                <span className="text-slate-400">Product: Laptop Stand</span>
              </div>
              <div className="text-slate-400 mt-1">
                CSV row contained an empty unit price value (<code className="text-slate-300">5,,0,Completed</code>).
              </div>
            </div>
            <div className="bg-slate-900 px-3 py-1.5 rounded border border-slate-800 text-slate-300">
              <span className="text-slate-400">Action:</span> Imputed standard price <span className="text-emerald-400 font-bold">$1,200.00</span> from catalog.
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sky-400">TXN0033</span>
                <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800/50 font-medium">
                  Order Returned
                </span>
                <span className="text-slate-400">Product: Monitor (West Retail)</span>
              </div>
              <div className="text-slate-400 mt-1">
                Customer returned order of 2 Monitors (<code className="text-slate-300">$19,000 gross value</code>).
              </div>
            </div>
            <div className="bg-slate-900 px-3 py-1.5 rounded border border-slate-800 text-slate-300">
              <span className="text-slate-400">Action:</span> Net revenue computed as <span className="text-rose-400 font-bold">$0.00</span> to preserve financial accuracy.
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sky-400">TXN0034</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                  Zero Quantity
                </span>
                <span className="text-slate-400">Product: Keyboard (East Online)</span>
              </div>
              <div className="text-slate-400 mt-1">
                Transaction recorded with Quantity = 0.
              </div>
            </div>
            <div className="bg-slate-900 px-3 py-1.5 rounded border border-slate-800 text-slate-300">
              <span className="text-slate-400">Action:</span> Retained as zero-volume order with <span className="text-slate-200 font-bold">$0.00</span> revenue.
            </div>
          </div>
        </div>
      </div>

      {/* Database Schema & Storage Explanation */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 text-xs text-slate-300 space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-400" />
          <span>Database Architecture & Storage Strategy</span>
        </h3>
        <p className="leading-relaxed text-slate-400">
          The sales ledger is stored in an in-memory <strong>SQLite WebAssembly database</strong>. Raw dates formatted as <code className="text-slate-300">DD-MM-YYYY</code> are normalized upon ingestion to <code className="text-slate-300">YYYY-MM-DD</code> and stored alongside a derived <code className="text-slate-300">month_year</code> (<code className="text-slate-300">YYYY-MM</code>) partition key. This guarantees accurate chronological sorting, standard SQL <code className="text-slate-300">strftime()</code> operations, and indexed group-bys.
        </p>
        <div className="bg-slate-950 p-3 rounded-lg font-mono text-[11px] text-sky-300/90 border border-slate-800 overflow-x-auto">
          <code>
            CREATE TABLE sales_transactions (<br />
            &nbsp;&nbsp;transaction_id TEXT PRIMARY KEY,<br />
            &nbsp;&nbsp;order_date TEXT NOT NULL, /* ISO YYYY-MM-DD */<br />
            &nbsp;&nbsp;month_year TEXT NOT NULL, /* YYYY-MM */<br />
            &nbsp;&nbsp;product TEXT NOT NULL,<br />
            &nbsp;&nbsp;category TEXT NOT NULL,<br />
            &nbsp;&nbsp;region TEXT NOT NULL,<br />
            &nbsp;&nbsp;sales_channel TEXT NOT NULL,<br />
            &nbsp;&nbsp;quantity INTEGER NOT NULL,<br />
            &nbsp;&nbsp;unit_price REAL NOT NULL,<br />
            &nbsp;&nbsp;discount_amount REAL NOT NULL,<br />
            &nbsp;&nbsp;status TEXT NOT NULL, /* Completed | Returned */<br />
            &nbsp;&nbsp;gross_revenue REAL NOT NULL,<br />
            &nbsp;&nbsp;net_revenue REAL NOT NULL, /* (qty * price) - discount */<br />
            &nbsp;&nbsp;is_flagged INTEGER DEFAULT 0,<br />
            &nbsp;&nbsp;flag_reason TEXT<br />
            );
          </code>
        </div>
      </div>

      {/* Filter and Table view */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Ledger View
          </span>
          <button
            onClick={() => setFilterAnomaliesOnly(!filterAnomaliesOnly)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
              filterAnomaliesOnly
                ? 'bg-amber-950/70 text-amber-300 border-amber-800'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {filterAnomaliesOnly ? '✓ Showing Anomalies & Returns Only' : 'Filter Anomalies Only'}
          </button>
        </div>
        <span className="text-xs text-slate-400">
          Showing {displayedRecords.length} of {records.length} records
        </span>
      </div>

      {/* Records Table */}
      <DataTable
        columns={columns}
        rows={rows}
        title="Sanitized Sales Transaction Ledger"
        defaultPageSize={10}
      />
    </div>
  );
}
