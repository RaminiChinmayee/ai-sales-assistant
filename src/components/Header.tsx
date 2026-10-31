import React from 'react';
import { Sparkles, BarChart3, Database, ShieldCheck, FileCode, CheckCircle2 } from 'lucide-react';

export type TabType = 'assistant' | 'dashboard' | 'quality' | 'tests' | 'architecture';

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  recordCount: number;
}

export function Header({ activeTab, onTabChange, recordCount }: HeaderProps) {
  const tabs = [
    { id: 'assistant' as TabType, label: 'AI BI Assistant', icon: Sparkles },
    { id: 'dashboard' as TabType, label: 'Executive Dashboard', icon: BarChart3 },
    { id: 'quality' as TabType, label: 'Data Quality & Ledger', icon: Database },
    { id: 'tests' as TabType, label: 'Automated Test Suite', icon: ShieldCheck },
    { id: 'architecture' as TabType, label: 'Architecture & Report', icon: FileCode },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3.5 gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  InsightPulse
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800/50 font-mono">
                  AI BI Assistant
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Natural Language Sales Intelligence with Deterministic SQL Execution
              </p>
            </div>
          </div>

          {/* System Badges */}
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/70 border border-indigo-700/60 text-indigo-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>⚡ Groq LPU Active</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>SQLite WASM Ready</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
              <span>{recordCount > 0 ? `${recordCount} Records Ingested` : '50 Records'}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
