import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDatabase, getDatabase, getDataQualityReport } from './src/server/db.ts';
import { processQuestion } from './src/server/queryEngine.ts';
import { runAllTests } from './src/server/testRunner.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize database with CSV data
let isDbReady = false;
let dbInitPromise = initDatabase()
  .then(() => {
    isDbReady = true;
    console.log('✅ SQLite in-memory database initialized and CSV data ingested.');
  })
  .catch((err) => {
    console.error('❌ Failed to initialize database:', err);
  });

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database_ready: isDbReady,
    timestamp: new Date().toISOString(),
  });
});

// AI Engine configuration status
app.get('/api/config', (req, res) => {
  res.json({
    groq_available: Boolean(process.env.GROQ_API_KEY),
    gemini_available: Boolean(process.env.GEMINI_API_KEY),
    default_provider: process.env.GROQ_API_KEY ? 'groq' : (process.env.GEMINI_API_KEY ? 'gemini' : 'groq'),
  });
});

// Process natural language question
app.post('/api/query', async (req, res) => {
  try {
    await dbInitPromise;
    const { question, provider } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required.' });
    }

    const result = await processQuestion(question, provider);
    return res.json(result);
  } catch (error: any) {
    console.error('Error processing query:', error);
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
});

// Executive Data Summary & Metrics
app.get('/api/data/summary', async (req, res) => {
  try {
    await dbInitPromise;
    const db = getDatabase();
    const qualityReport = getDataQualityReport();

    // Overall KPI query
    const kpiRes = db.exec(`
      SELECT 
        ROUND(SUM(net_revenue), 2) AS total_net_revenue,
        ROUND(SUM(gross_revenue), 2) AS total_gross_revenue,
        ROUND(SUM(discount_amount), 2) AS total_discount,
        SUM(quantity) AS total_quantity,
        COUNT(*) AS total_transactions,
        ROUND(AVG(net_revenue), 2) AS avg_order_value
      FROM sales_transactions
      WHERE status = 'Completed';
    `);

    // Monthly breakdown
    const monthlyRes = db.exec(`
      SELECT 
        month_year,
        ROUND(SUM(net_revenue), 2) AS net_revenue,
        SUM(quantity) AS units,
        COUNT(*) AS orders
      FROM sales_transactions
      WHERE status = 'Completed'
      GROUP BY month_year
      ORDER BY month_year ASC;
    `);

    // Product breakdown
    const productRes = db.exec(`
      SELECT 
        product,
        category,
        ROUND(SUM(net_revenue), 2) AS total_revenue,
        SUM(quantity) AS total_quantity
      FROM sales_transactions
      WHERE status = 'Completed'
      GROUP BY product, category
      ORDER BY total_revenue DESC;
    `);

    // Region breakdown
    const regionRes = db.exec(`
      SELECT 
        region,
        ROUND(SUM(net_revenue), 2) AS total_revenue,
        SUM(quantity) AS total_quantity
      FROM sales_transactions
      WHERE status = 'Completed'
      GROUP BY region
      ORDER BY total_revenue DESC;
    `);

    // Channel breakdown
    const channelRes = db.exec(`
      SELECT 
        sales_channel,
        ROUND(SUM(net_revenue), 2) AS total_revenue,
        COUNT(*) AS orders
      FROM sales_transactions
      WHERE status = 'Completed'
      GROUP BY sales_channel
      ORDER BY total_revenue DESC;
    `);

    const kpiData = kpiRes[0] ? {
      total_net_revenue: kpiRes[0].values[0][0],
      total_gross_revenue: kpiRes[0].values[0][1],
      total_discount: kpiRes[0].values[0][2],
      total_quantity: kpiRes[0].values[0][3],
      total_transactions: kpiRes[0].values[0][4],
      avg_order_value: kpiRes[0].values[0][5],
    } : {};

    return res.json({
      kpis: kpiData,
      monthly: monthlyRes[0]?.values.map(v => ({ month: v[0], revenue: v[1], units: v[2], orders: v[3] })) || [],
      products: productRes[0]?.values.map(v => ({ product: v[0], category: v[1], revenue: v[2], quantity: v[3] })) || [],
      regions: regionRes[0]?.values.map(v => ({ region: v[0], revenue: v[1], quantity: v[2] })) || [],
      channels: channelRes[0]?.values.map(v => ({ channel: v[0], revenue: v[1], orders: v[2] })) || [],
      quality_report: qualityReport,
    });
  } catch (err: any) {
    console.error('Error fetching summary:', err);
    return res.status(500).json({ error: err.message });
  }
});

// All records with filtering and anomalies
app.get('/api/data/records', async (req, res) => {
  try {
    await dbInitPromise;
    const db = getDatabase();
    const rows = db.exec(`
      SELECT 
        transaction_id,
        order_date,
        month_year,
        product,
        category,
        region,
        sales_channel,
        quantity,
        unit_price,
        discount_amount,
        status,
        gross_revenue,
        net_revenue,
        is_flagged,
        flag_reason
      FROM sales_transactions
      ORDER BY order_date ASC;
    `);

    if (!rows || rows.length === 0) {
      return res.json({ columns: [], records: [] });
    }

    const { columns, values } = rows[0];
    const records = values.map(val => {
      const obj: any = {};
      columns.forEach((col, idx) => {
        obj[col] = val[idx];
      });
      return obj;
    });

    return res.json({ columns, records, count: records.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Run automated tests endpoint
app.get('/api/tests/run', async (req, res) => {
  try {
    await dbInitPromise;
    const testReport = await runAllTests();
    return res.json(testReport);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Setup Vite middleware or static serving
async function startServer() {
  await dbInitPromise;

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`InsightPulse Server active at http://0.0.0.0:${PORT}`);
  });
}

startServer();
