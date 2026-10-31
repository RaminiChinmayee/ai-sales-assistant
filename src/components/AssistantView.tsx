import React, { useState } from 'react';
import { Send, Sparkles, Loader2, HelpCircle, CheckCircle2, AlertTriangle, TrendingUp, BarChart2, PieChart, ShieldAlert } from 'lucide-react';
import { QueryResponse } from '../types.ts';
import { BarChart, LineChart, DonutChart, KpiCard } from './Charts.tsx';
import { SqlInspector } from './SqlInspector.tsx';
import { DataTable } from './DataTable.tsx';

interface AssistantViewProps {
  onAsk: (question: string, provider?: 'groq' | 'gemini' | 'auto') => Promise<void>;
  currentResult: QueryResponse | null;
  isLoading: boolean;
  selectedProvider: 'groq' | 'gemini' | 'auto';
  onSelectProvider: (provider: 'groq' | 'gemini' | 'auto') => void;
}

const EXAMPLE_QUESTIONS = [
  {
    id: 1,
    title: 'What is the total revenue?',
    category: 'Core Q1',
    description: 'Calculates net completed revenue minus discounts.',
    badge: 'Core Requirement',
  },
  {
    id: 2,
    title: 'Which product generated the highest revenue?',
    category: 'Core Q2',
    description: 'Ranks products by total net earnings.',
    badge: 'Core Requirement',
  },
  {
    id: 3,
    title: 'What is the monthly revenue trend?',
    category: 'Core Q3',
    description: 'Chronological timeline of monthly revenue across 2026.',
    badge: 'Core Requirement',
  },
  {
    id: 4,
    title: 'Which region generated the highest sales?',
    category: 'Core Q4',
    description: 'Compares North, South, East, and West performance.',
    badge: 'Core Requirement',
  },
  {
    id: 5,
    title: 'How did revenue change between two months?',
    category: 'Core Q5',
    description: 'Month-over-month revenue variance and percentage growth.',
    badge: 'Core Requirement',
  },
  {
    id: 6,
    title: 'What is the revenue breakdown by sales channel?',
    category: 'Omnichannel',
    description: 'Compares Online ecommerce vs Physical Retail.',
    badge: 'Bonus Insight',
  },
  {
    id: 7,
    title: 'What are different types of products?',
    category: 'Catalog',
    description: 'Enumerates all 7 products, categories, prices, and revenue.',
    badge: 'Product Scope',
  },
  {
    id: 8,
    title: 'Show all returned or flagged orders with data quality notes',
    category: 'Data Quality',
    description: 'Audits TXN0033 (return), TXN0034 (zero qty), TXN0051 (imputed price).',
    badge: 'Edge Case Audit',
  },
];

export function AssistantView({
  onAsk,
  currentResult,
  isLoading,
  selectedProvider,
  onSelectProvider,
}: AssistantViewProps) {
  const [questionInput, setQuestionInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionInput.trim() || isLoading) return;
    onAsk(questionInput.trim(), selectedProvider);
  };

  const handleSelectExample = (q: string) => {
    setQuestionInput(q);
    onAsk(q, selectedProvider);
  };

  // Convert chart_data for rendering
  const renderVisualization = () => {
    if (!currentResult || !currentResult.rows || currentResult.rows.length === 0) return null;

    const { chart_type, columns, rows, chart_data } = currentResult;

    if (chart_type === 'line') {
      const lineData = rows.map(r => ({
        label: String(r[0]),
        value: Number(r[1]) || 0,
        secondary: r[2] ? Number(r[2]) : undefined,
      }));
      return <LineChart data={lineData} title="Revenue Trajectory Over Time" />;
    }

    if (chart_type === 'bar') {
      const barData = rows.map(r => ({
        label: String(r[0]),
        value: Number(r[2] !== undefined && !isNaN(Number(r[2])) && typeof r[2] === 'number' && r[2] > 1000 ? r[2] : r[1]) || 0,
        secondary: r[3] ? `${r[3]} units` : undefined,
      }));
      return <BarChart data={barData} title="Comparative Revenue Breakdown" />;
    }

    if (chart_type === 'donut') {
      const donutData = rows.map(r => ({
        label: String(r[0]),
        value: Number(r[1]) || 0,
      }));
      return <DonutChart data={donutData} title="Distribution Share" />;
    }

    if (chart_type === 'kpi' && rows.length === 1) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 my-2">
          {columns.map((col, idx) => (
            <KpiCard
              key={idx}
              title={col.replace(/_/g, ' ')}
              value={
                typeof rows[0][idx] === 'number'
                  ? col.includes('revenue') || col.includes('discount')
                    ? `$${Number(rows[0][idx]).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : Number(rows[0][idx]).toLocaleString()
                  : rows[0][idx]
              }
            />
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Search Input Banner */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>AI Natural Language BI Assistant</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Ask any question about sales performance, products, or trends
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Natural language queries are interpreted via Groq LPU / Gemini, converted to safe SQLite SQL, and verified deterministically.
            </p>
          </div>

          {/* AI Model Selector */}
          <div className="bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 flex items-center gap-1 self-start md:self-center">
            <button
              onClick={() => onSelectProvider('groq')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedProvider === 'groq'
                  ? 'bg-gradient-to-r from-amber-500/20 to-indigo-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>⚡ Groq LPU</span>
            </button>
            <button
              onClick={() => onSelectProvider('gemini')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedProvider === 'gemini'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>✨ Gemini 3.8</span>
            </button>
            <button
              onClick={() => onSelectProvider('auto')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedProvider === 'auto'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Auto</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={questionInput}
            onChange={e => setQuestionInput(e.target.value)}
            placeholder="e.g., Which product generated the highest revenue?"
            disabled={isLoading}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-5 py-3.5 pr-28 text-sm md:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={isLoading || !questionInput.trim()}
            className="absolute right-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-lg font-medium text-sm flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Querying...</span>
              </>
            ) : (
              <>
                <span>Ask AI</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Suggested Example Prompts */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5">
            <span className="font-semibold uppercase tracking-wider text-slate-300">
              Target Challenge Questions & Quick Prompts
            </span>
            <span className="text-sky-400">Click any chip to run instantly</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUESTIONS.map(example => (
              <button
                key={example.id}
                onClick={() => handleSelectExample(example.title)}
                disabled={isLoading}
                className="group text-left px-3.5 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500/50 text-xs transition-all flex items-center gap-2.5 shadow-sm"
              >
                <span className="w-5 h-5 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-[10px] group-hover:bg-sky-500 group-hover:text-slate-950 transition-colors">
                  {example.id}
                </span>
                <span className="text-slate-200 group-hover:text-white font-medium">
                  {example.title}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 font-mono">
                  {example.category}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Query Result Section */}
      {currentResult && (
        <div className="space-y-6 animate-fadeIn">
          {/* Executive Answer Callout Box */}
          <div
            className={`rounded-2xl p-6 border shadow-xl backdrop-blur-sm transition-all ${
              currentResult.is_valid
                ? 'bg-slate-900/90 border-slate-700/80 shadow-sky-950/20'
                : 'bg-rose-950/30 border-rose-800/60 shadow-rose-950/30'
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                {currentResult.is_valid ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Executive Answer
                  </span>
                  <div className="text-xs text-sky-400 font-mono">
                    Query: "{currentResult.question}"
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {currentResult.ai_provider && (
                  <span className="bg-indigo-950/80 text-indigo-300 px-2.5 py-1 rounded-md border border-indigo-700/50 font-mono flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    {currentResult.ai_provider}
                  </span>
                )}
                <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700 font-mono">
                  Latency: {currentResult.execution_time_ms}ms
                </span>
                <span className="bg-emerald-950/80 text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-800/50 font-mono">
                  Confidence: {Math.round(currentResult.confidence * 100)}%
                </span>
              </div>
            </div>

            <div className="text-base md:text-lg text-slate-100 font-medium leading-relaxed mt-2">
              {currentResult.answer}
            </div>

            {currentResult.error && (
              <div className="mt-3 p-3 bg-rose-950/50 border border-rose-800/50 rounded-lg text-xs text-rose-300 font-mono">
                Error Detail: {currentResult.error}
              </div>
            )}

            {currentResult.suggestions && currentResult.suggestions.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  Suggested Questions to Try:
                </span>
                <div className="flex flex-wrap gap-2">
                  {currentResult.suggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectExample(sug)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 hover:border-sky-500/50 transition-colors flex items-center gap-1.5"
                    >
                      <span>→</span>
                      <span>{sug}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Chart Visualization */}
          {currentResult.is_valid && renderVisualization()}

          {/* SQL Inspector */}
          {currentResult.sql && (
            <SqlInspector
              sql={currentResult.sql}
              executionTimeMs={currentResult.execution_time_ms}
              rowCount={currentResult.row_count}
              confidence={currentResult.confidence}
              explanation={currentResult.explanation}
              dataNotes={currentResult.data_notes}
            />
          )}

          {/* Supporting Figures Data Table */}
          {currentResult.is_valid && currentResult.rows.length > 0 && (
            <DataTable
              columns={currentResult.columns}
              rows={currentResult.rows}
              title={`Supporting Data Figures (${currentResult.rows.length} rows returned)`}
            />
          )}
        </div>
      )}
    </div>
  );
}
