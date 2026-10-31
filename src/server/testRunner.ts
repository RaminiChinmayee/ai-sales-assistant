import { initDatabase, getDatabase, getDataQualityReport } from './db.js';
import { processQuestion, validateSqlQuery } from './queryEngine.js';

export interface TestCaseResult {
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

export interface FullTestReport {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  durationMs: number;
  results: TestCaseResult[];
}

export async function runAllTests(): Promise<FullTestReport> {
  const startOverall = performance.now();
  await initDatabase();
  const db = getDatabase();
  const results: TestCaseResult[] = [];

  // TEST 1: Valid Core Question - Total Revenue
  {
    const start = performance.now();
    const q = 'What is the total revenue?';
    const res = await processQuestion(q);
    const passed = res.is_valid && res.rows.length > 0 && Number(res.rows[0][0]) > 0;
    results.push({
      id: 'TC-01',
      name: 'Total Revenue Calculation',
      category: 'valid_query',
      question: q,
      passed,
      expectedBehavior: 'Returns a single aggregate row with net revenue > $0, discounts deducted, returned orders excluded.',
      actualSummary: passed ? `Net revenue: $${Number(res.rows[0][0]).toLocaleString()} across ${res.rows[0][4]} transactions.` : `Failed: ${res.error}`,
      executionTimeMs: Math.round(performance.now() - start),
      details: { sql: res.sql, columns: res.columns, rowData: res.rows[0] },
    });
  }

  // TEST 2: Valid Core Question - Top Revenue Product
  {
    const start = performance.now();
    const q = 'Which product generated the highest revenue?';
    const res = await processQuestion(q);
    const topProduct = res.rows[0]?.[0];
    const topRevenue = res.rows[0]?.[2];
    const passed = res.is_valid && res.rows.length >= 5 && Boolean(topProduct);
    results.push({
      id: 'TC-02',
      name: 'Product Revenue Leaderboard',
      category: 'valid_query',
      question: q,
      passed,
      expectedBehavior: 'Returns sorted list of products by total revenue descending.',
      actualSummary: passed ? `Top product is '${topProduct}' with $${Number(topRevenue).toLocaleString()} revenue.` : `Failed: ${res.error}`,
      executionTimeMs: Math.round(performance.now() - start),
      details: { topProduct, topRevenue, totalProductsCount: res.rows.length },
    });
  }

  // TEST 3: Valid Core Question - Monthly Revenue Trend
  {
    const start = performance.now();
    const q = 'What is the monthly revenue trend?';
    const res = await processQuestion(q);
    const months = res.rows.map(r => r[0]);
    const passed = res.is_valid && months.length === 6 && months[0] === '2026-01' && months[5] === '2026-06';
    results.push({
      id: 'TC-03',
      name: 'Chronological Monthly Revenue Trend',
      category: 'valid_query',
      question: q,
      passed,
      expectedBehavior: 'Returns all 6 calendar months (2026-01 to 2026-06) grouped and ordered chronologically.',
      actualSummary: passed ? `Covered months: ${months.join(', ')} with complete monthly aggregates.` : `Failed: ${res.error}`,
      executionTimeMs: Math.round(performance.now() - start),
      details: { months, totalMonthlyRows: months.length },
    });
  }

  // TEST 4: Valid Core Question - Regional Sales Distribution
  {
    const start = performance.now();
    const q = 'Which region generated the highest sales?';
    const res = await processQuestion(q);
    const topRegion = res.rows[0]?.[0];
    const passed = res.is_valid && res.rows.length === 4 && Boolean(topRegion);
    results.push({
      id: 'TC-04',
      name: 'Regional Sales Aggregation',
      category: 'valid_query',
      question: q,
      passed,
      expectedBehavior: 'Aggregates sales across all four regions (North, South, East, West) and sorts by highest.',
      actualSummary: passed ? `Top region is '${topRegion}' with $${Number(res.rows[0][1]).toLocaleString()} in sales.` : `Failed: ${res.error}`,
      executionTimeMs: Math.round(performance.now() - start),
      details: { topRegion, allRegions: res.rows.map(r => r[0]) },
    });
  }

  // TEST 5: Comparative / Edge - Month-over-Month Variance
  {
    const start = performance.now();
    const q = 'How did revenue change between two months?';
    const res = await processQuestion(q);
    const diffsCalculated = res.rows.some(r => r[4] !== null && typeof r[4] === 'number');
    const passed = res.is_valid && diffsCalculated;
    results.push({
      id: 'TC-05',
      name: 'Month-over-Month Revenue Variance',
      category: 'comparative',
      question: q,
      passed,
      expectedBehavior: 'Executes CTE calculating revenue delta and % growth between successive periods.',
      actualSummary: passed ? `Successfully computed delta and growth rates across ${res.rows.length} periods.` : `Failed: ${res.error}`,
      executionTimeMs: Math.round(performance.now() - start),
      details: { periodsExamined: res.rows.map(r => `${r[0]} vs ${r[2] || 'Baseline'}`) },
    });
  }

  // TEST 6: Edge Case - Missing Unit Price Imputation & Returned Orders
  {
    const start = performance.now();
    const quality = getDataQualityReport();
    // Query the specific anomaly records in DB
    const txn51 = db.exec(`SELECT product, unit_price, is_flagged, flag_reason FROM sales_transactions WHERE transaction_id = 'TXN0051';`);
    const txn33 = db.exec(`SELECT product, net_revenue, status FROM sales_transactions WHERE transaction_id = 'TXN0033';`);

    const txn51Price = txn51[0]?.values[0]?.[1];
    const txn33NetRev = txn33[0]?.values[0]?.[1];

    // TXN0051 had empty unit price, should be imputed as 1200 (standard Laptop Stand price)
    // TXN0033 is Returned, should have net_revenue = 0
    const passed = txn51Price === 1200 && txn33NetRev === 0 && quality.anomalies.length >= 3;
    results.push({
      id: 'TC-06',
      name: 'Data Quality Handling & Anomaly Quarantine',
      category: 'edge_case',
      question: 'Verify handling of missing unit price (TXN0051) and returned status (TXN0033)',
      passed,
      expectedBehavior: 'TXN0051 unit price imputed to catalog value ($1,200); TXN0033 marked Returned with $0 net revenue.',
      actualSummary: passed 
        ? `Passed: TXN0051 imputed at $1,200. TXN0033 returned status nets $0.00. 3 anomalies audited in quality report.`
        : `Anomaly verification failed: TXN0051 price is ${txn51Price}, TXN0033 net is ${txn33NetRev}`,
      executionTimeMs: Math.round(performance.now() - start),
      details: { txn51Price, txn33NetRev, totalAnomaliesAudited: quality.anomalies.length },
    });
  }

  // TEST 7: Security Defense - Destructive SQL Injection Rejection
  {
    const start = performance.now();
    const maliciousSql = "SELECT * FROM sales_transactions; DROP TABLE sales_transactions; --";
    const validation = validateSqlQuery(maliciousSql);
    const passed = Boolean(!validation.isValid && validation.error?.includes('Security Violation'));
    results.push({
      id: 'TC-07',
      name: 'SQL Injection & Destructive Query Defense',
      category: 'security_defense',
      question: 'Attempt stacked query injection: SELECT ...; DROP TABLE sales_transactions; --',
      passed,
      expectedBehavior: 'Security engine intercepts multiple statements and DROP command before execution.',
      actualSummary: passed ? `Blocked successfully: ${validation.error}` : 'Vulnerability: Query was not blocked!',
      executionTimeMs: Math.round(performance.now() - start),
      details: { blockedError: validation.error },
    });
  }

  // TEST 8: Invalid Input - Out-of-Domain Non-Sales Query
  {
    const start = performance.now();
    const invalidQ = 'What is the weather forecast for tomorrow?';
    const res = await processQuestion(invalidQ);
    const passed = !res.is_valid && res.answer.includes('outside the scope');
    results.push({
      id: 'TC-08',
      name: 'Out-of-Domain Guardrail Rejection',
      category: 'invalid_query',
      question: invalidQ,
      passed,
      expectedBehavior: 'Identifies ungrounded prompt and rejects safely without generating fake SQL or hallucinated data.',
      actualSummary: passed ? 'Safely rejected with clear business domain guidance.' : 'Failed: Handled improperly.',
      executionTimeMs: Math.round(performance.now() - start),
      details: { error: res.error, answer: res.answer },
    });
  }

  const passedTests = results.filter(r => r.passed).length;
  const failedTests = results.length - passedTests;
  const totalDuration = Math.round(performance.now() - startOverall);

  return {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passedTests,
    failedTests,
    durationMs: totalDuration,
    results,
  };
}
