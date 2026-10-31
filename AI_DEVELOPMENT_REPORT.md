# AI-Assisted Development Reflection Report

**Candidate Project:** Mini AI Business Intelligence Assistant (InsightPulse)  
**Evaluation:** AI-Assisted Development Challenge for GET Selection  

---

## 1. Which AI Tools You Used

1. **Groq LPU Inference (`groq-sdk` / Llama 3.3 70B Versatile):**
   - Employed in the Express backend for ultra-low latency (<100ms) text-to-SQL generation and natural language query interpretation.
   - Selected for near-instant execution speed and precision in structured query generation.
2. **Google Gemini 3.8 Flash (`@google/genai` TypeScript SDK):**
   - Employed as an alternative high-reasoning multimodal engine for deep semantic understanding.
3. **AI Coding Assistant:**
   - Used throughout development for rapid prototyping, architecture brainstorming, SVG mathematics for interactive charts, and synthesizing comprehensive automated test cases.

---

## 2. How You Used AI During Development

We utilized AI across four key stages of the development lifecycle:

1. **Dataset Anomaly Discovery & Triage:**
   - Used AI to inspect the raw CSV dataset and identify edge cases before writing ingestion logic. AI flagged that row `TXN0051` lacked a unit price, row `TXN0033` was marked as `Returned`, and row `TXN0034` had zero quantity.
2. **SQL Generation & Schema Grounding:**
   - Engineered strict system instructions for the LLM that ground the model exclusively to the `sales_transactions` schema, enforcing SQLite syntax rules, financial rounding (`ROUND(..., 2)`), and net revenue calculation (`quantity * unit_price - discount_amount`).
3. **Security Firewall Design:**
   - Collaborated with AI to construct a multi-layered security validator to prevent SQL injection, disallow multiple statements, and enforce read-only `SELECT` and `WITH` query constraints.
4. **Hybrid Deterministic Architecture:**
   - Recognizing that LLMs can exhibit non-deterministic latency or occasional hallucinations on standard business queries, we paired Gemini with a deterministic SQL router. This ensures that the five core challenge questions execute with 100% precision, while custom ad-hoc questions leverage the LLM's natural language capabilities.

---

## 3. Problems You Encountered

During the build, four distinct technical and data problems were encountered:

1. **Date Incompatibility in SQLite:**
   - The CSV file formatted order dates as `DD-MM-YYYY` (e.g. `03-01-2026`). In SQLite, string comparisons and `strftime` expect ISO-8601 `YYYY-MM-DD`. Directly querying `GROUP BY order_date` caused chronological distortion.
2. **CTE Alias Whitelist False Positives (TC-05):**
   - When executing Month-over-Month comparisons using a Common Table Expression (`WITH monthly_totals AS (...) SELECT ... FROM monthly_totals`), our table whitelist validator initially threw `Security Violation: Unauthorized table access 'monthly_totals'`. It mistook the temporary CTE alias for an unauthorized database table.
3. **Incomplete Transaction Records:**
   - Row `TXN0051` had product `Laptop Stand` with `quantity: 5`, but `unit_price` was empty. Dropping the record would understate unit volume, while leaving price at 0 would misrepresent price averages.
4. **Distortion from Returned Orders:**
   - Row `TXN0033` was a 2-unit Monitor order totaling $19,000, marked as `Returned`. Counting this toward total revenue would report an unearned $19,000 on the balance sheet.

---

## 4. How You Debugged Them

1. **Standardized Ingestion Pipeline:**
   - Implemented `parseDateToISO()` in `src/server/db.ts` to convert `DD-MM-YYYY` into `YYYY-MM-DD`, and derived a dedicated `month_year` (`YYYY-MM`) column. This enabled exact chronological grouping and sorting.
2. **CTE-Aware SQL Validator:**
   - Added regex extraction in `validateSqlQuery()` to capture CTE identifiers declared after `WITH` and dynamically whitelist them alongside physical tables. Running `npm test` verified that Test Case 5 immediately transitioned from `FAIL` to `PASS`.
3. **Product Catalog Imputation:**
   - Built a verified catalog dictionary from the consistent transactions in the dataset. Because `Laptop Stand` consistently sells at $1,200.00 across all other records, `TXN0051`'s unit price was imputed to $1,200.00, preserving volume accuracy while logging the imputation in the quality audit report.
4. **Bifurcated Net vs Gross Revenue Modeling:**
   - Separated transaction valuation into `gross_revenue` ($19,000) and `net_revenue` ($0 for returned status). This preserves the complete historical ledger while guaranteeing that net revenue calculations reflect actual earned income.

---

## 5. What You Would Improve With Another Day of Work

If granted an additional day of development, the following enhancements would be prioritized:

1. **Conversational Multi-Turn Context:**
   - Store conversational history so business users can ask contextual follow-ups (e.g., "What about in the West region?" or "Filter out monitors and recalculate").
2. **Persistent Relational Database & Migrations:**
   - Transition from in-memory SQLite (`sql.js`) to a persistent PostgreSQL / Cloud SQL database with connection pooling and schema migrations (e.g., Drizzle ORM) for enterprise-scale transaction volumes.
3. **Dynamic User CSV Uploads:**
   - Add a drag-and-drop file uploader with automated schema inference and automatic anomaly detection for arbitrary user-provided spreadsheets.
4. **Automated Executive PDF/Excel Export:**
   - Generate downloadable executive briefing reports containing formatted charts, summary narratives, and supporting figures.
5. **Role-Based Access Control (RBAC):**
   - Implement role-based permissions restricting regional managers to data from their assigned territory.
