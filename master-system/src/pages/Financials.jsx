import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, DollarSign, PieChart, Download } from 'lucide-react';
import { useStore } from '../store/useStore';
import { calcFinancials, monthlyRevenue, topClients } from '../utils/calculations';
import { fmt$, fmtShort$, fyStart } from '../utils/format';
import { StatCard } from '../components/ui/StatCard';
import { Btn } from '../components/ui/Modal';
import Layout, { PageHeader } from '../components/layout/Layout';

const CHART_TOOLTIP_STYLE = { background: '#0f172a', border: 'none', borderRadius: 10, color: '#f8fafc', fontSize: 12 };

export default function Financials() {
  const { jobs, clients, supInvoices, expenses, config } = useStore();
  const stats = useMemo(() => calcFinancials(jobs, supInvoices, expenses, config), [jobs, supInvoices, expenses, config]);
  const chartData = useMemo(() => monthlyRevenue(jobs), [jobs]);
  const top = useMemo(() => topClients(jobs, clients), [jobs, clients]);

  // Monthly costs for chart overlay
  const chartWithCosts = useMemo(() => {
    return chartData.map(m => {
      const cost = supInvoices
        .filter(i => { const d = new Date((i.date||'')+'T00:00:00'); return d.getMonth() === m.month && d.getFullYear() === m.year; })
        .reduce((s, i) => s + (Number(i.amount)||0), 0);
      return { ...m, cost, profit: Math.max(0, m.rev - cost) };
    });
  }, [chartData, supInvoices]);

  const exportXeroCSV = () => {
    const paid = jobs.filter(j => j.status === 'paid' && !(j.jobNumber||'').startsWith('SAQ'));
    const taxType = config.gstRegistered ? 'GST on Income' : 'GST Free Income';
    const rows = [
      ['*ContactName','*InvoiceNumber','*InvoiceDate','*DueDate','*Description','*Quantity','*UnitAmount','*AccountCode','*TaxType'],
      ...paid.map(j => {
        const c = clients.find(x => x.id === j.clientId)||{};
        return [c.company||c.contact||'Unknown', j.invoiceNumber||j.jobNumber, j.createdAt||'', j.invoiceDue||j.createdAt||'', (j.scope||'Services').split('\n')[0], '1', j.invoiceAmount||j.quoteAmount||'0', '200', taxType];
      })
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
    a.download = `xero_export_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  };

  const exportMYOBCSV = () => {
    const paid = jobs.filter(j => j.status === 'paid' && !(j.jobNumber||'').startsWith('SAQ'));
    const rows = [
      ['Co./Last Name','Invoice #','Date','Amount','Terms'],
      ...paid.map(j => {
        const c = clients.find(x=>x.id===j.clientId)||{};
        return [c.company||c.contact||'', j.invoiceNumber||j.jobNumber, j.createdAt||'', j.invoiceAmount||j.quoteAmount||'0', `${config.defaultPayTermsDays||7} Days`];
      })
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a'); a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
    a.download=`myob_export_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  };

  return (
    <Layout>
      <PageHeader
        title="Financials"
        subtitle={`FY${fyStart().slice(0,4)}/${String(Number(fyStart().slice(0,4))+1).slice(2)} · Data as at ${new Date().toLocaleDateString('en-AU')}`}
        actions={
          <>
            <Btn variant="secondary" size="sm" onClick={exportXeroCSV}><Download size={13}/> Xero CSV</Btn>
            <Btn variant="secondary" size="sm" onClick={exportMYOBCSV}><Download size={13}/> MYOB CSV</Btn>
          </>
        }
      />

      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="YTD Revenue" value={fmtShort$(stats.ytdRevenue)} sub={`${stats.paidCount} jobs`} accent="indigo" icon={<TrendingUp size={16}/>}/>
          <StatCard label="Supplier Costs YTD" value={fmtShort$(stats.ytdSupCosts)} sub="By invoice date" accent="red" icon={<DollarSign size={16}/>}/>
          <StatCard label="Avg Job Value" value={fmtShort$(stats.avgJobValue)} sub="Paid YTD" accent="emerald" icon={<DollarSign size={16}/>}/>
          <StatCard label="Win Rate" value={`${stats.winRate}%`} sub="Quotes converted" accent="sky" icon={<PieChart size={16}/>}/>
        </div>

        {/* GST Status */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900">{config.gstRegistered ? 'GST Registered' : 'GST Registration Threshold'}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{config.gstRegistered ? `Charging ${config.gstRate || 10}% GST on all invoices` : 'Monitor yearly revenue against $75,000 ATO threshold'}</p>
            </div>
            {!config.gstRegistered && (
              <div className={`text-2xl font-black ${stats.gstPct > 80 ? 'text-red-600' : stats.gstPct > 60 ? 'text-amber-500' : 'text-emerald-600'}`}>{stats.gstPct}%</div>
            )}
          </div>
          {config.gstRegistered ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                <span className="font-semibold">Business is registered for GST</span>
              </div>
              <p className="text-xs text-emerald-600 mt-1">All invoices and quotes include ${config.gstRate || 10}% GST. Export uses "GST on Income" tax type.</p>
            </div>
          ) : (
            <>
              <div className="relative w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                <motion.div initial={{ width:0 }} animate={{ width:`${stats.gstPct}%` }} transition={{ duration:1.2, ease:'easeOut' }}
                  className={`h-4 rounded-full ${stats.gstPct > 80 ? 'bg-red-500' : stats.gstPct > 60 ? 'bg-amber-400' : 'bg-emerald-500'}`}/>
                {[25,50,75].map(p => <div key={p} style={{ left:`${p}%` }} className="absolute top-0 bottom-0 w-px bg-white/60"/>)}
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1.5">
                <span>{fmt$(stats.ytdRevenue)} earned</span>
                <span>{fmt$(stats.gstThreshold - stats.ytdRevenue)} remaining</span>
                <span>Threshold: {fmt$(stats.gstThreshold)}</span>
              </div>
            </>
          )}
        </div>

        {/* Revenue vs Cost Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="font-bold text-slate-900 mb-1">Revenue & Costs — Last 12 Months</h3>
          <p className="text-xs text-slate-400 mb-6">Revenue (blue) vs supplier costs (red)</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartWithCosts} margin={{ top:4, right:4, left:-15, bottom:0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="label" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
              <Tooltip formatter={(v, name) => [fmt$(v), name==='rev' ? 'Revenue' : name==='cost' ? 'Costs' : 'Profit']} contentStyle={CHART_TOOLTIP_STYLE}/>
              <Bar dataKey="rev" fill="#6366f1" radius={[4,4,0,0]} name="rev"/>
              <Bar dataKey="cost" fill="#ef4444" radius={[4,4,0,0]} name="cost" opacity={0.7}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income Trajectory */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h3 className="font-bold text-slate-900 mb-4">Income Trajectory</h3>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData} margin={{ top:4, right:4, left:-20, bottom:0 }}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize:10, fill:'#94a3b8' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:10, fill:'#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
                <Tooltip formatter={v=>[fmt$(v),'Revenue']} contentStyle={CHART_TOOLTIP_STYLE}/>
                <Area type="monotone" dataKey="rev" stroke="#10b981" strokeWidth={2.5} fill="url(#g)" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Top Clients */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h3 className="font-bold text-slate-900 mb-4">Top Clients by Revenue</h3>
            <div className="space-y-3">
              {top.slice(0,6).map((c, i) => {
                const maxRev = top[0]?.revenue || 1;
                return (
                  <div key={c.cid} className="flex items-center gap-3">
                    <div className="w-5 text-xs font-bold text-slate-400 shrink-0">{i+1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-700 truncate">{c.name}</span>
                        <span className="text-xs font-bold text-slate-800 shrink-0 ml-2">{fmt$(c.revenue)}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <motion.div initial={{ width:0 }} animate={{ width:`${(c.revenue/maxRev)*100}%` }} transition={{ duration:0.8, delay: i*0.1 }}
                          className="h-1.5 bg-indigo-500 rounded-full"/>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 shrink-0 w-12 text-right">{c.jobs} jobs</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
