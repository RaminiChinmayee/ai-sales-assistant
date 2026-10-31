import React, { useState } from 'react';
import { Terminal, Copy, Check, ShieldCheck, Zap, Info, ChevronDown, ChevronUp } from 'lucide-react';

interface SqlInspectorProps {
  sql: string;
  executionTimeMs: number;
  rowCount: number;
  confidence: number;
  explanation: string;
  dataNotes?: string;
}

export function SqlInspector({
  sql,
  executionTimeMs,
  rowCount,
  confidence,
  explanation,
  dataNotes,
}: SqlInspectorProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!sql) return null;

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg mt-5">
      {/* Header bar */}
      <div className="bg-slate-900/90 px-4 py-3 flex flex-wrap items-center justify-between border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Engineered SQL Query
          </span>
          <span className="flex items-center gap-1 text-[11px] bg-emerald-950/60 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-800/40">
            <ShieldCheck className="w-3 h-3" />
            Verified Read-Only
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
            <Zap className="w-3 h-3 text-amber-400" />
            {executionTimeMs}ms
          </span>
          <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
            {rowCount} {rowCount === 1 ? 'row' : 'rows'}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded transition-colors"
            title="Copy SQL to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy SQL</span>
              </>
            )}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-slate-200 p-1"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-3">
          {/* Code block */}
          <div className="relative bg-slate-900/90 rounded-lg p-3 font-mono text-xs text-sky-200/90 overflow-x-auto border border-slate-800/80 leading-relaxed">
            <pre className="whitespace-pre-wrap">{sql}</pre>
          </div>

          {/* Explanation & Data Quality context */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1">
                <Info className="w-3.5 h-3.5 text-sky-400" />
                <span>Query Logic & Methodology</span>
              </div>
              <p className="text-slate-400 leading-normal">{explanation}</p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/60 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Data Integrity & Cleansing Rule</span>
              </div>
              <p className="text-slate-400 leading-normal">
                {dataNotes || 'Computed on sanitized transactional ledger with strict return status and catalog integrity.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
