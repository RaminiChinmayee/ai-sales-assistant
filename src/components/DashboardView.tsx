import React from 'react';
import { DollarSign, ShoppingBag, PackageCheck, Layers, Percent, TrendingUp, Compass, Globe } from 'lucide-react';
import { SummaryData } from '../types.ts';
import { KpiCard, BarChart, LineChart, DonutChart } from './Charts.tsx';

interface DashboardViewProps {
  summary: SummaryData | null;
  onSelectMetricQuestion: (question: string) => void;
}

export function DashboardView({ summary, onSelectMetricQuestion }: DashboardViewProps) {
  if (!summary) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        Loading executive dashboard data...
      </div>
    );
  }

  const { kpis, monthly, products, regions, channels } = summary;

  // Format monthly data for LineChart
  const monthlyLineData = monthly.map(m => ({
    label: m.month,
    value: m.revenue,
    secondary: m.units,
  }));

  // Format product data for BarChart
  const productBarData = products.map(p => ({
    label: p.product,
    value: p.revenue,
    secondary: `${p.quantity} units`,
  }));

  // Format region data for BarChart
  const regionBarData = regions.map(r => ({
    label: r.region,
    value: r.revenue,
    secondary: `${r.quantity} units`,
  }));

  // Format channel data for DonutChart
  const channelDonutData = channels.map(c => ({
    label: c.channel,
    value: c.revenue,
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Compass className="w-4 h-4" />
              <span>Executive Overview • H1 2026</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Enterprise Sales & Revenue Intelligence
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Real-time aggregates calculated directly over the verified transactional database.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectMetricQuestion('What is the total revenue?')}
              className="text-xs px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 transition-colors"
            >
              Analyze Total Revenue →
            </button>
            <button
              onClick={() => onSelectMetricQuestion('What is the monthly revenue trend?')}
              className="text-xs px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg shadow-sm transition-colors"
            >
              Examine Monthly Trends →
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Net Revenue"
          value={`$${kpis.total_net_revenue?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Net of discounts & returns"
          trend="+8.4% H1 momentum"
          icon={DollarSign}
        />
        <KpiCard
          title="Gross Sales Volume"
          value={`$${kpis.total_gross_revenue?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={`Discounts: $${kpis.total_discount?.toLocaleString()}`}
          icon={TrendingUp}
        />
        <KpiCard
          title="Total Units Sold"
          value={kpis.total_quantity?.toLocaleString()}
          subtitle={`Across ${kpis.total_transactions} completed orders`}
          icon={PackageCheck}
        />
        <KpiCard
          title="Avg Order Value (AOV)"
          value={`$${kpis.avg_order_value?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Revenue per transaction"
          icon={ShoppingBag}
        />
      </div>

      {/* Main Charts Row: Monthly Trend & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <LineChart
            data={monthlyLineData}
            title="Monthly Revenue Trend (Jan - Jun 2026)"
            height={280}
          />
        </div>
        <div>
          <BarChart
            data={productBarData}
            title="Revenue by Product Catalog"
            height={280}
          />
        </div>
      </div>

      {/* Secondary Charts Row: Regional Performance & Sales Channel Share */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <BarChart
            data={regionBarData}
            title="Sales by Geographical Region"
            height={260}
          />
        </div>
        <div>
          <DonutChart
            data={channelDonutData}
            title="Omnichannel Revenue Share (Online vs Retail)"
          />
        </div>
      </div>
    </div>
  );
}
