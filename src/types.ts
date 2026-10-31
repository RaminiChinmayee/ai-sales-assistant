export interface QueryResponse {
  question: string;
  answer: string;
  sql: string;
  columns: string[];
  rows: any[][];
  chart_type: 'kpi' | 'bar' | 'line' | 'donut' | 'table';
  chart_data?: any[];
  execution_time_ms: number;
  row_count: number;
  confidence: number;
  explanation: string;
  warnings?: string[];
  data_notes?: string;
  is_valid: boolean;
  error?: string;
  ai_provider?: string;
  suggestions?: string[];
}

export interface SummaryData {
  kpis: {
    total_net_revenue: number;
    total_gross_revenue: number;
    total_discount: number;
    total_quantity: number;
    total_transactions: number;
    avg_order_value: number;
  };
  monthly: Array<{ month: string; revenue: number; units: number; orders: number }>;
  products: Array<{ product: string; category: string; revenue: number; quantity: number }>;
  regions: Array<{ region: string; revenue: number; quantity: number }>;
  channels: Array<{ channel: string; revenue: number; orders: number }>;
  quality_report: {
    total_raw_rows: number;
    valid_rows: number;
    quarantined_rows: number;
    anomalies: Array<{
      transaction_id: string;
      issue: string;
      action_taken: string;
      raw_row: any;
    }>;
    product_catalog: Record<string, { category: string; standard_price: number }>;
  };
}

export interface TestResultItem {
  id: string;
  name: string;
  category: 'valid_query' | 'edge_case' | 'invalid_query' | 'security_defense' | 'comparative';
  question: string;
  passed: boolean;
  expectedBehavior: string;
  actualSummary: string;
  executionTimeMs: number;
  details?: any;
}

export interface TestSuiteReport {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  durationMs: number;
  results: TestResultItem[];
}

export interface TransactionRecord {
  transaction_id: string;
  order_date: string;
  month_year: string;
  product: string;
  category: string;
  region: string;
  sales_channel: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  status: string;
  gross_revenue: number;
  net_revenue: number;
  is_flagged: number;
  flag_reason?: string;
}
