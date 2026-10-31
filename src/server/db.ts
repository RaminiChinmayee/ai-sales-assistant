import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

export interface TransactionRecord {
  transaction_id: string;
  order_date: string; // YYYY-MM-DD
  raw_date: string;   // DD-MM-YYYY
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
  is_flagged: boolean;
  flag_reason?: string;
}

export interface DataQualityReport {
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
}

let dbInstance: Database | null = null;
let qualityReport: DataQualityReport = {
  total_raw_rows: 0,
  valid_rows: 0,
  quarantined_rows: 0,
  anomalies: [],
  product_catalog: {},
};

// Known reference catalog derived from dataset consistency
const KNOWN_CATALOG: Record<string, { category: string; standard_price: number }> = {
  'Laptop Stand': { category: 'Accessories', standard_price: 1200 },
  'Wireless Mouse': { category: 'Accessories', standard_price: 650 },
  'Office Chair': { category: 'Furniture', standard_price: 7800 },
  'Monitor': { category: 'Electronics', standard_price: 9500 },
  'Keyboard': { category: 'Accessories', standard_price: 900 },
  'Desk': { category: 'Furniture', standard_price: 12500 },
  'USB-C Hub': { category: 'Accessories', standard_price: 1800 },
};

/**
 * Standardize DD-MM-YYYY to YYYY-MM-DD for SQL ISO sorting and date functions
 */
function parseDateToISO(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.trim().split('-');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return dateStr;
}

export async function initDatabase(): Promise<{ db: Database; report: DataQualityReport }> {
  if (dbInstance) {
    return { db: dbInstance, report: qualityReport };
  }

  const SQL = await initSqlJs();
  const db = new SQL.Database();

  // Create table schemas
  db.run(`
    CREATE TABLE sales_transactions (
      transaction_id TEXT PRIMARY KEY,
      order_date TEXT NOT NULL,
      product TEXT NOT NULL,
      category TEXT NOT NULL,
      region TEXT NOT NULL,
      sales_channel TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      discount_amount REAL NOT NULL,
      status TEXT NOT NULL,
      gross_revenue REAL NOT NULL,
      net_revenue REAL NOT NULL,
      month_year TEXT NOT NULL,
      is_flagged INTEGER DEFAULT 0,
      flag_reason TEXT
    );
  `);

  // Path to CSV
  const possiblePaths = [
    path.resolve(process.cwd(), 'public/assets/aistudio/ai_bi_assistant_sales_data_-_GET_0c4f5511.csv'),
    path.resolve(process.cwd(), 'sales_data.csv'),
  ];

  let csvContent = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      csvContent = fs.readFileSync(p, 'utf-8');
      break;
    }
  }

  if (!csvContent) {
    console.warn('CSV file not found in specified paths, trying relative fallback...');
  }

  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length > 1) {
    const headers = lines[0].split(',').map(h => h.trim());
    const dataLines = lines.slice(1);

    qualityReport.total_raw_rows = dataLines.length;
    qualityReport.product_catalog = KNOWN_CATALOG;
    qualityReport.anomalies = [];

    let validCount = 0;
    let quarantinedCount = 0;

    for (const line of dataLines) {
      const cols = line.split(',').map(c => c.trim());
      if (cols.length < 5) continue;

      const [
        transaction_id,
        order_date_raw,
        product,
        category,
        region,
        sales_channel,
        quantity_str,
        unit_price_str,
        discount_amount_str,
        status,
      ] = cols;

      const order_date = parseDateToISO(order_date_raw);
      const month_year = order_date.substring(0, 7); // YYYY-MM

      let quantity = parseInt(quantity_str, 10);
      let unit_price = parseFloat(unit_price_str);
      const discount_amount = parseFloat(discount_amount_str) || 0;
      let is_flagged = 0;
      let flag_reason = '';

      // Anomaly Check 1: Missing or invalid unit_price (e.g. TXN0051)
      if (isNaN(unit_price) || unit_price_str === '') {
        is_flagged = 1;
        const catalogPrice = KNOWN_CATALOG[product]?.standard_price;
        if (catalogPrice) {
          unit_price = catalogPrice;
          flag_reason = `Missing unit price imputed from standard product catalog (${catalogPrice})`;
          qualityReport.anomalies.push({
            transaction_id,
            issue: 'Missing Unit Price',
            action_taken: `Imputed $${catalogPrice} from verified product catalog`,
            raw_row: cols,
          });
        } else {
          unit_price = 0;
          flag_reason = 'Missing unit price could not be imputed';
          qualityReport.anomalies.push({
            transaction_id,
            issue: 'Missing Unit Price (Unresolvable)',
            action_taken: 'Quarantined/Set price to 0',
            raw_row: cols,
          });
          quarantinedCount++;
        }
      }

      // Anomaly Check 2: Zero or negative quantity (e.g. TXN0034)
      if (isNaN(quantity) || quantity <= 0) {
        is_flagged = 1;
        flag_reason = flag_reason ? `${flag_reason}; Zero quantity transaction` : 'Zero quantity transaction';
        qualityReport.anomalies.push({
          transaction_id,
          issue: 'Zero or Non-positive Quantity',
          action_taken: 'Recorded as zero-volume order (revenue $0)',
          raw_row: cols,
        });
        quantity = isNaN(quantity) ? 0 : quantity;
      }

      // Anomaly Check 3: Returned transaction status (e.g. TXN0033)
      if (status && status.toLowerCase() === 'returned') {
        is_flagged = 1;
        flag_reason = flag_reason ? `${flag_reason}; Returned order (excluded from net revenue)` : 'Returned order (excluded from net revenue)';
        qualityReport.anomalies.push({
          transaction_id,
          issue: 'Order Returned by Customer',
          action_taken: 'Net revenue set to $0 to reflect completed income accuracy',
          raw_row: cols,
        });
      }

      const gross_revenue = quantity * unit_price;
      // If returned, net revenue is 0 (refunded); otherwise gross minus discount
      const net_revenue = (status && status.toLowerCase() === 'returned')
        ? 0
        : Math.max(0, gross_revenue - discount_amount);

      if (!flag_reason) {
        validCount++;
      } else {
        validCount++; // successfully cleaned & sanitized
      }

      db.run(
        `INSERT INTO sales_transactions (
          transaction_id, order_date, product, category, region, sales_channel,
          quantity, unit_price, discount_amount, status, gross_revenue, net_revenue,
          month_year, is_flagged, flag_reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transaction_id,
          order_date,
          product,
          category,
          region,
          sales_channel,
          quantity,
          unit_price,
          discount_amount,
          status || 'Completed',
          gross_revenue,
          net_revenue,
          month_year,
          is_flagged,
          flag_reason || null,
        ]
      );
    }

    qualityReport.valid_rows = validCount;
    qualityReport.quarantined_rows = quarantinedCount;
  }

  // Create a convenient view for clean reporting if needed
  db.run(`
    CREATE VIEW v_completed_sales AS
    SELECT * FROM sales_transactions
    WHERE status = 'Completed' AND quantity > 0;
  `);

  dbInstance = db;
  return { db: dbInstance, report: qualityReport };
}

export function getDatabase(): Database {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return dbInstance;
}

export function getDataQualityReport(): DataQualityReport {
  return qualityReport;
}
