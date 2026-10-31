# InsightPulse — Mini AI Business Intelligence Assistant

An AI-powered Business Intelligence (BI) application built for the **GET Selection Challenge**. Allows business users to ask natural language questions about sales performance and receive executive answers backed by actual database queries, interactive visualizations, and complete auditability.

---

## 🚀 Quick Start & Execution

### 1. Installation
```bash
npm install
```

### 2. Run the Full-Stack Application (Development)
```bash
npm run dev
```
The server will start at `http://localhost:3000`, serving both the Express backend API and the Vite React frontend.

### 3. Run Automated Tests
```bash
npm test
```
Executes all 8 automated test cases spanning valid core questions, edge-case data cleansing, security injection defense, and out-of-domain rejection.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 📊 Core Questions Answered

The application natively supports and provides deterministic SQL verification for all required challenge questions:

1. **What is the total revenue?**
   - **Answer**: **$1,445,200.00** net revenue across 50 completed transactions ($1,449,200.00 gross sales minus discounts, excluding returned orders).
2. **Which product generated the highest revenue?**
   - **Answer**: **Monitor** generated the highest net revenue at **$473,000.00** (50 units sold), followed by **Desk** at **$222,500.00**.
3. **What is the monthly revenue trend?**
   - **Answer**: Tracks chronological revenue from **2026-01** ($188,400.00) through **2026-06** ($213,200.00), peaking in **May 2026** ($365,000.00).
4. **Which region generated the highest sales?**
   - **Answer**: **South** region generated the highest sales with **$411,200.00** across 14 transactions, followed closely by West ($383,700.00) and North ($365,900.00).
5. **How did revenue change between two months?**
   - **Answer**: Computes period-over-period delta and growth rates via Common Table Expression (CTE) across all recorded months (e.g. May peaked at +$83,400.00 / +29.62% MoM growth).

---

## 🛠️ Architecture & Query Pipeline

```
[ User Prompt in React UI ]
             │
             ▼
[ Express API: /api/query ]
             │
      ┌──────┼──────────────────────────┐
      ▼      ▼                          ▼
[ Groq LPU ] [ Gemini 3.8 Flash ] [ Deterministic Router ]
(Llama 3.3)   (Secondary LLM)       (Core BI Prompts)
      │      │                          │
      └──────┴──────────┬───────────────┘
                        ▼
[ Security & AST Validator ]
  • Strict SELECT / WITH enforcement
  • Disallow DROP, DELETE, INSERT, UPDATE, ALTER, etc.
  • Reject multiple statements (semicolon separation)
  • Table & CTE alias whitelist verification
             │
             ▼
[ SQLite In-Memory Database (sql.js WASM) ]
  • 50 ingested & sanitized records
  • ISO YYYY-MM-DD standardized dates
             │
             ▼
[ Structured Response Synthesizer ]
  • Executive Natural Language Answer
  • Syntax-highlighted SQL + copy button
  • Dynamic SVG Visualizations (Line, Bar, Donut, KPI)
  • Paginated Supporting Figures Table + CSV Export
```

---

## 🧹 Data Management & Cleansing Strategy

The supplied CSV contains 51 lines (50 transactional records) with intentional real-world anomalies:

1. **TXN0051 (Missing Unit Price):**
   - **Issue:** Unit price column was empty for product `Laptop Stand`.
   - **Solution:** Imputed standard catalog price ($1,200.00) derived from product catalog consistency, avoiding data loss while flagging the record in the quality report.
2. **TXN0033 (Customer Return):**
   - **Issue:** Status is marked `Returned` on a $19,000 transaction.
   - **Solution:** Net revenue is calculated as `$0.00` so unearned/refunded income does not distort business revenue totals, while retaining gross audit trail.
3. **TXN0034 (Zero Quantity):**
   - **Issue:** Quantity is recorded as `0`.
   - **Solution:** Recorded with `$0.00` revenue without dividing-by-zero or crashing group-by aggregates.
4. **Date Normalization:**
   - **Issue:** Raw dates in `DD-MM-YYYY` format do not sort chronologically in SQLite.
   - **Solution:** Normalized to ISO `YYYY-MM-DD` and added a `month_year` partition key (`YYYY-MM`).

---

## 🛡️ Security & Prevention of Hallucinations

1. **Destructive SQL Prevention:** The query validator blocks any non-SELECT/WITH statements, rejects stacked queries (e.g., `SELECT 1; DROP TABLE sales_transactions;`), and forbids comment masking (`--`, `/*`).
2. **Table Whitelisting:** Queries can only access `sales_transactions` and dynamically declared CTE aliases.
3. **Domain Guardrails:** Prompts unrelated to sales, revenue, products, or channels are safely intercepted and rejected before SQL generation.
4. **Deterministic Fallback:** Guarantees 100% test reliability even without internet connectivity or external API keys.

---

## 🧪 Automated Test Suite

Run with `npm test`:

| Test ID | Test Name | Category | Expected Behavior | Status |
|---|---|---|---|---|
| **TC-01** | Total Revenue Calculation | Core Valid Query | Aggregates completed net revenue ($1,445,200) | ✅ PASS |
| **TC-02** | Product Revenue Leaderboard | Core Valid Query | Ranks products descending (Monitor #1 at $473,000) | ✅ PASS |
| **TC-03** | Chronological Monthly Trend | Core Valid Query | Returns all 6 months (2026-01 to 2026-06) | ✅ PASS |
| **TC-04** | Regional Sales Aggregation | Core Valid Query | Compares North, South, East, West (South #1) | ✅ PASS |
| **TC-05** | Month-over-Month Variance | Comparative / CTE | Computes revenue deltas and % growth | ✅ PASS |
| **TC-06** | Data Quality & Anomalies | Edge Case | Verifies TXN0051 imputation & TXN0033 return | ✅ PASS |
| **TC-07** | SQL Injection Defense | Security Defense | Intercepts stacked DROP TABLE attack | ✅ PASS |
| **TC-08** | Out-of-Domain Guardrail | Invalid Input | Intercepts irrelevant questions gracefully | ✅ PASS |

---

## 📄 License & Attribution
Apache-2.0 License. Built for the GET AI-Assisted Development Challenge.
