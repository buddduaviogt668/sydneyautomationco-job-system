import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Award, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { jobRevenue, jobProfit } from '../utils/calculations';
import { fmt$, fmtShort$ } from '../utils/format';
import Layout, { PageHeader } from '../components/layout/Layout';

const MARGIN_COLOR = (m) => m >= 50 ? '#10b981' : m >= 35 ? '#6366f1' : m >= 20 ? '#f59e0b' : '#ef4444';
const MARGIN_BG = (m) => m >= 50 ? 'bg-emerald-50 text-emerald-700' : m >= 35 ? 'bg-indigo-50 text-indigo-700' : m >= 20 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700';

export default function Profitability() {
  const { jobs, clients, supInvoices, expenses, config } = useStore();
  const [groupBy, setGroupBy] = useState('job');

  const paidJobs = useMemo(() => jobs.filter(j => j.status === 'paid' && !(j.jobNumber||'').startsWith('SAQ') && j.type !== 'SAQ'), [jobs]);

  const jobData = useMemo(() =>
    paidJobs.map(j => {
      const c = clients.find(x => x.id === j.clientId) || {};
      const p = jobProfit(j, supInvoices, expenses, config);
      return { j, c, ...p };
    }).sort((a,b) => b.profit - a.profit),
    [paidJobs, clients, supInvoices, expenses, config]
  );

  const totals = useMemo(() => ({
    revenue: jobData.reduce((s,d) => s+d.rev, 0),
    cost: jobData.reduce((s,d) => s+d.total, 0),
    profit: jobData.reduce((s,d) => s+d.profit, 0),
    avgMargin: jobData.length > 0 ? jobData.reduce((s,d) => s+d.margin, 0) / jobData.length : 0,
  }), [jobData]);

  // By client grouping
  const byClient = useMemo(() => {
    const map = {};
    jobData.forEach(d => {
      const key = d.c.company || d.c.contact || d.j.clientId;
      if (!map[key]) map[key] = { name: key, jobs: 0, revenue: 0, profit: 0 };
      map[key].jobs++;
      map[key].revenue += d.rev;
      map[key].profit += d.profit;
    });
    return Object.values(map).map(m => ({ ...m, margin: m.revenue > 0 ? (m.profit/m.revenue)*100 : 0 })).sort((a,b) => b.profit - a.profit);
  }, [jobData]);

  const chartData = groupBy === 'job'
    ? jobData.slice(0,15).map(d => ({ name: d.j.jobNumber, rev: d.rev, profit: d.profit, cost: d.total, margin: d.margin }))
    : byClient.slice(0,10).map(c => ({ name: c.name.split(' ').slice(0,2).join(' '), rev: c.revenue, profit: c.profit, margin: c.margin }));

  return (
    <Layout>
      <PageHeader
        title="Profitability Report"
        subtitle={`${paidJobs.length} paid jobs analysed`}
        actions={
          <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
            <button onClick={() => setGroupBy('job')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${groupBy==='job' ? 'bg-white text-slate-800 shadow-sm':'text-slate-500'}`}>By Job</button>
            <button onClick={() => setGroupBy('client')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${groupBy==='client' ? 'bg-white text-slate-800 shadow-sm':'text-slate-500'}`}>By Client</button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: fmtShort$(totals.revenue), color: 'text-slate-900', bg: 'bg-white' },
            { label: 'Total Costs', value: fmtShort$(totals.cost), color: 'text-red-600', bg: 'bg-white' },
            { label: 'Gross Profit', value: fmtShort$(totals.profit), color: totals.profit >= 0 ? 'text-emerald-600' : 'text-red-600', bg: 'bg-white' },
            { label: 'Avg Margin', value: `${totals.avgMargin.toFixed(1)}%`, color: MARGIN_COLOR(totals.avgMargin).replace('#','text-[#')+']', bg: 'bg-white' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border border-slate-200 rounded-2xl p-5`}>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{s.label}</div>
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Profit Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="font-bold text-slate-900 mb-4">Revenue vs Profit — {groupBy === 'job' ? 'Top 15 Jobs' : 'By Client'}</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top:4, right:4, left:-10, bottom:40 }} barGap={2}>
              <XAxis dataKey="name" tick={{ fontSize:9, fill:'#94a3b8' }} axisLine={false} tickLine={false} angle={-40} textAnchor="end"/>
              <YAxis tick={{ fontSize:10, fill:'#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
              <Tooltip formatter={(v, n) => [fmt$(v), n === 'rev' ? 'Revenue' : 'Profit']}
                contentStyle={{ background: '#0f172a', border: 'none', borderRadius: 10, color: '#f8fafc', fontSize: 12 }}/>
              <Bar dataKey="rev" fill="#e0e7ff" radius={[3,3,0,0]} name="rev"/>
              <Bar dataKey="profit" radius={[3,3,0,0]} name="profit">
                {chartData.map((d, i) => <Cell key={i} fill={MARGIN_COLOR(d.margin)}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Job Table */}
        {groupBy === 'job' ? (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 grid grid-cols-6 gap-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">
              <div className="col-span-2">Job / Client</div>
              <div className="text-right">Revenue</div>
              <div className="text-right">Cost</div>
              <div className="text-right">Profit</div>
              <div className="text-right">Margin</div>
            </div>
            <div className="divide-y divide-slate-50">
              {jobData.map((d, i) => (
                <motion.div key={d.j.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: i*0.02 }}
                  className="px-5 py-3.5 grid grid-cols-6 gap-4 items-center hover:bg-slate-50 transition-colors">
                  <div className="col-span-2 min-w-0">
                    <div className="text-xs font-mono font-bold text-indigo-500">{d.j.jobNumber}</div>
                    <div className="text-sm font-semibold text-slate-800 truncate">{d.c.company || d.c.contact || '—'}</div>
                  </div>
                  <div className="text-right text-sm font-semibold text-slate-700">{fmt$(d.rev)}</div>
                  <div className="text-right text-sm text-slate-500">{d.total > 0 ? fmt$(d.total) : '—'}</div>
                  <div className={`text-right text-sm font-bold ${d.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt$(d.profit)}</div>
                  <div className="flex justify-end">
                    <span className={`text-xs font-black px-2 py-1 rounded-lg ${MARGIN_BG(d.margin)}`}>{d.margin.toFixed(0)}%</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 grid grid-cols-5 gap-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">
              <div className="col-span-2">Client</div>
              <div className="text-right">Revenue</div>
              <div className="text-right">Profit</div>
              <div className="text-right">Margin</div>
            </div>
            <div className="divide-y divide-slate-50">
              {byClient.map((c, i) => (
                <div key={i} className="px-5 py-3.5 grid grid-cols-5 gap-4 items-center hover:bg-slate-50 transition-colors">
                  <div className="col-span-2 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[10px] font-black shrink-0">
                      {c.name[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{c.name}</div>
                      <div className="text-xs text-slate-400">{c.jobs} jobs</div>
                    </div>
                  </div>
                  <div className="text-right text-sm font-semibold text-slate-700">{fmt$(c.revenue)}</div>
                  <div className={`text-right text-sm font-bold ${c.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt$(c.profit)}</div>
                  <div className="flex justify-end">
                    <span className={`text-xs font-black px-2 py-1 rounded-lg ${MARGIN_BG(c.margin)}`}>{c.margin.toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: <Award size={18} className="text-emerald-600"/>,
              label: 'Best Job',
              value: jobData[0] ? `${jobData[0].j.jobNumber}` : '—',
              sub: jobData[0] ? `${fmt$(jobData[0].profit)} profit · ${jobData[0].margin.toFixed(0)}% margin` : '',
              bg: 'bg-emerald-50 border-emerald-200',
            },
            {
              icon: <TrendingUp size={18} className="text-indigo-600"/>,
              label: 'Highest Margin',
              value: jobData.length > 0 ? [...jobData].sort((a,b)=>b.margin-a.margin)[0].j.jobNumber : '—',
              sub: jobData.length > 0 ? `${[...jobData].sort((a,b)=>b.margin-a.margin)[0].margin.toFixed(0)}% margin` : '',
              bg: 'bg-indigo-50 border-indigo-200',
            },
            {
              icon: <AlertCircle size={18} className="text-amber-600"/>,
              label: 'Needs Review',
              value: jobData.filter(d=>d.margin < 20).length + ' jobs',
              sub: `Below 20% margin threshold`,
              bg: 'bg-amber-50 border-amber-200',
            },
          ].map(ins => (
            <div key={ins.label} className={`${ins.bg} border rounded-2xl p-5 flex items-start gap-3`}>
              <div className="mt-0.5">{ins.icon}</div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">{ins.label}</div>
                <div className="text-base font-black text-slate-800">{ins.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{ins.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
