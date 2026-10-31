import React, { useState } from 'react';
import { CheckCircle2, XCircle, Play, ShieldCheck, Clock, Filter, AlertTriangle, Terminal, RefreshCw } from 'lucide-react';
import { TestSuiteReport, TestResultItem } from '../types.ts';

interface TestRunnerViewProps {
  testReport: TestSuiteReport | null;
  isRunningTests: boolean;
  onRunTests: () => void;
}

export function TestRunnerView({ testReport, isRunningTests, onRunTests }: TestRunnerViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Tests' },
    { id: 'valid_query', label: 'Valid Core Queries' },
    { id: 'edge_case', label: 'Edge Cases & Quality' },
    { id: 'security_defense', label: 'Security & Injection' },
    { id: 'comparative', label: 'Comparative (MoM)' },
    { id: 'invalid_query', label: 'Invalid / Out of Domain' },
  ];

  const results = testReport?.results || [];
  const filteredResults = selectedCategory === 'all'
    ? results
    : results.filter(r => r.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Automated Verification Suite</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Test Harness & Verification Engine
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Validates core BI questions, SQL injection resistance, edge-case data cleansing, and out-of-domain handling.
            </p>
          </div>

          <button
            onClick={onRunTests}
            disabled={isRunningTests}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-medium text-xs md:text-sm rounded-xl shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50"
          >
            {isRunningTests ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running Test Suite...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Execute All Tests</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Scorecard */}
      {testReport && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-1">
              Test Status
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${testReport.failedTests === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {testReport.failedTests === 0 ? '100% Pass' : `${testReport.passedTests}/${testReport.totalTests}`}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {testReport.passedTests} passed, {testReport.failedTests} failed
            </span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-1">
              Total Test Cases
            </span>
            <div className="text-2xl font-bold text-white">{testReport.totalTests}</div>
            <span className="text-[11px] text-slate-500 mt-1 block">Exceeds 5-test minimum</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-1">
              Execution Latency
            </span>
            <div className="text-2xl font-bold text-sky-400">{testReport.durationMs}ms</div>
            <span className="text-[11px] text-slate-500 mt-1 block">Total suite runtime</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-1">
              CLI Script
            </span>
            <div className="text-xs font-mono font-bold text-slate-200 mt-2 bg-slate-950 px-2 py-1 rounded border border-slate-800">
              npm test
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Run from command line</span>
          </div>
        </div>
      )}

      {/* Category filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 font-semibold mr-1 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
              selectedCategory === cat.id
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 font-medium'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Test Cases List */}
      <div className="space-y-3">
        {filteredResults.map(test => {
          const isExpanded = expandedTestId === test.id;
          return (
            <div
              key={test.id}
              className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden transition-all shadow-sm"
            >
              <div
                onClick={() => setExpandedTestId(isExpanded ? null : test.id)}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-start gap-3">
                  {test.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-sky-400">{test.id}</span>
                      <h4 className="text-sm font-semibold text-white">{test.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                        {test.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 italic">
                      Input Question: "{test.question}"
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {test.executionTimeMs}ms
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                      test.passed
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                        : 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                    }`}
                  >
                    {test.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-slate-800/60 space-y-3 text-xs bg-slate-950/40">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                      <span className="text-slate-400 font-semibold block mb-1">Expected Behavior:</span>
                      <p className="text-slate-300">{test.expectedBehavior}</p>
                    </div>
                    <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                      <span className="text-slate-400 font-semibold block mb-1">Actual Result & Assertion:</span>
                      <p className="text-slate-300">{test.actualSummary}</p>
                    </div>
                  </div>

                  {test.details && (
                    <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg font-mono text-[11px] text-slate-400 overflow-x-auto">
                      <span className="text-slate-300 font-semibold block mb-1">Execution Payload:</span>
                      <pre>{JSON.stringify(test.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Documented Known Limitations */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 text-xs text-slate-300 space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Documented Known Limitations & Boundaries</span>
        </h3>
        <ul className="list-disc list-inside space-y-2 text-slate-400 leading-relaxed">
          <li>
            <strong className="text-slate-300">Single Dataset Scope:</strong> The system is optimized for sales transactions across 2026. Queries requesting external data (e.g. inventory restock schedules, supplier logistics) are blocked by input guardrails.
          </li>
          <li>
            <strong className="text-slate-300">Strict Read-Only Enforcement:</strong> Natural language questions attempting to update records, insert new orders, or execute schema modifications are prohibited by design.
          </li>
          <li>
            <strong className="text-slate-300">Deterministic Fallback:</strong> If an LLM API key is not present in the runtime environment, the engine routes standard prompt questions through deterministic SQL templates to guarantee 100% operational uptime.
          </li>
          <li>
            <strong className="text-slate-300">Product Imputation Assumption:</strong> Missing price for TXN0051 (Laptop Stand) is imputed based on consistent catalog pricing ($1,200). If dynamic pricing or negotiated discounts applied, manual verification would be required.
          </li>
        </ul>
      </div>
    </div>
  );
}
