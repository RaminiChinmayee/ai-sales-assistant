import React, { useState, useEffect } from 'react';
import { Header, TabType } from './components/Header.tsx';
import { AssistantView } from './components/AssistantView.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { DataQualityView } from './components/DataQualityView.tsx';
import { TestRunnerView } from './components/TestRunnerView.tsx';
import { ArchitectureReportView } from './components/ArchitectureReportView.tsx';
import { QueryResponse, SummaryData, TestSuiteReport, TransactionRecord } from './types.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('assistant');
  const [currentResult, setCurrentResult] = useState<QueryResponse | null>(null);
  const [isLoadingQuery, setIsLoadingQuery] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'groq' | 'gemini' | 'auto'>('groq');

  // Global summary state
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [records, setRecords] = useState<TransactionRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);

  // Test suite state
  const [testReport, setTestReport] = useState<TestSuiteReport | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Initial data loading
  useEffect(() => {
    fetchConfig();
    fetchSummaryData();
    fetchRecords();
    runTestSuite();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        const prov = data.default_provider || 'groq';
        setSelectedProvider(prov);
        handleAskQuestion('What is the total revenue?', prov);
        return;
      }
    } catch {
      // Fallback
    }
    handleAskQuestion('What is the total revenue?', 'groq');
  };

  const fetchSummaryData = async () => {
    try {
      const res = await fetch('/api/data/summary');
      if (res.ok) {
        const data = await res.json();
        setSummaryData(data);
      }
    } catch (err) {
      console.error('Failed to load summary:', err);
    }
  };

  const fetchRecords = async () => {
    setIsLoadingRecords(true);
    try {
      const res = await fetch('/api/data/records');
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
      }
    } catch (err) {
      console.error('Failed to load records:', err);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  const handleAskQuestion = async (question: string, provider: 'groq' | 'gemini' | 'auto' = selectedProvider) => {
    setIsLoadingQuery(true);
    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, provider }),
      });
      if (res.ok) {
        const data: QueryResponse = await res.json();
        setCurrentResult(data);
      } else {
        const errData = await res.json();
        setCurrentResult({
          question,
          answer: errData.error || 'Server error occurred processing question.',
          sql: '',
          columns: [],
          rows: [],
          chart_type: 'table',
          execution_time_ms: 0,
          row_count: 0,
          confidence: 0,
          explanation: '',
          is_valid: false,
          error: errData.error,
          ai_provider: provider === 'groq' ? 'Groq LPU' : 'Gemini 3.8',
        });
      }
    } catch (err: any) {
      setCurrentResult({
        question,
        answer: 'Network error communicating with query server.',
        sql: '',
        columns: [],
        rows: [],
        chart_type: 'table',
        execution_time_ms: 0,
        row_count: 0,
        confidence: 0,
        explanation: '',
        is_valid: false,
        error: err.message,
        ai_provider: provider === 'groq' ? 'Groq LPU' : 'Gemini 3.8',
      });
    } finally {
      setIsLoadingQuery(false);
    }
  };

  const runTestSuite = async () => {
    setIsRunningTests(true);
    try {
      const res = await fetch('/api/tests/run');
      if (res.ok) {
        const report: TestSuiteReport = await res.json();
        setTestReport(report);
      }
    } catch (err) {
      console.error('Failed to execute test suite:', err);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleSelectMetricQuestion = (question: string) => {
    setActiveTab('assistant');
    handleAskQuestion(question, selectedProvider);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        recordCount={records.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'assistant' && (
          <AssistantView
            onAsk={handleAskQuestion}
            currentResult={currentResult}
            isLoading={isLoadingQuery}
            selectedProvider={selectedProvider}
            onSelectProvider={setSelectedProvider}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            summary={summaryData}
            onSelectMetricQuestion={handleSelectMetricQuestion}
          />
        )}

        {activeTab === 'quality' && (
          <DataQualityView
            summary={summaryData}
            records={records}
            isLoadingRecords={isLoadingRecords}
            onRefreshRecords={fetchRecords}
          />
        )}

        {activeTab === 'tests' && (
          <TestRunnerView
            testReport={testReport}
            isRunningTests={isRunningTests}
            onRunTests={runTestSuite}
          />
        )}

        {activeTab === 'architecture' && <ArchitectureReportView />}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/60 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>InsightPulse Mini AI BI Assistant • GET Selection Challenge</span>
          <span className="font-mono text-[11px] text-slate-400">
            Node.js / Express • SQLite WebAssembly • Gemini 3.8 Flash • React 19
          </span>
        </div>
      </footer>
    </div>
  );
}
