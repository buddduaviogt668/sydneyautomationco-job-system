import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Clock, AlertTriangle, ChevronRight, Zap, Users, FileText, CheckCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { calcFinancials, monthlyRevenue, overdueEscalation, jobRevenue } from '../utils/calculations';
import { fmt$, fmtShort$, fmtDate, fmtDateShort, statusColor, statusLabel, truncate } from '../utils/format';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { Btn } from '../components/ui/Modal';
import Layout, { PageHeader } from '../components/layout/Layout';

export default function Dashboard() {
  const { jobs, clients, supInvoices, expenses, config } = useStore();
  const navigate = useNavigate();
  const stats = useMemo(() => calcFinancials(jobs, supInvoices, expenses, config), [jobs, supInvoices, expenses, config]);
  const chartData = useMemo(() => monthlyRevenue(jobs), [jobs]);
  const overdueList = useMemo(() => overdueEscalation(jobs), [jobs]);

  const recent = useMemo(() => [...jobs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6), [jobs]);
  const upcoming = useMemo(() =>
    jobs.filter(j => j.scheduledDate && j.scheduledDate >= new Date().toISOString().slice(0,10) && !['paid','lost'].includes(j.status))
      .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)).slice(0, 5),
    [jobs]);

  const getClient = (id) => clients.find(c => c.id === id);

  return (
    <Layout>
      <PageHeader
        title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, George 👋`}
        subtitle={new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        actions={
          <>
            <Btn variant="secondary" size="sm" onClick={() => navigate('/quotes')}><FileText size={14}/> New Quote</Btn>
            <Btn size="sm" onClick={() => navigate('/quote-builder')}><Zap size={14}/> Quick Invoice</Btn>
          </>
        }
      />

      <div className="p-8 space-y-8">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <StatCard label="This Month" value={fmtShort$(stats.thisMonth)} sub={`${stats.paidThisMonthCount} jobs paid`} accent="emerald" icon={<DollarSign size={16}/>} />
          <StatCard label="YTD Revenue" value={fmtShort$(stats.ytdRevenue)} sub="Financial year to date" accent="indigo" icon={<TrendingUp size={16}/>} />
          <StatCard label="Outstanding" value={fmtShort$(stats.outstanding)} sub="Invoiced, not yet paid" accent="amber" icon={<Clock size={16}/>} onClick={() => navigate('/invoices')} />
          <StatCard label="Pipeline" value={fmtShort$(stats.pipeline)} sub={`${stats.winRate}% win rate`} accent="sky" icon={<TrendingUp size={16}/>} onClick={() => navigate('/quotes')} />
          <StatCard label="Take-Home Est." value={fmtShort$(stats.takeHome)} sub="~21.5% tax estimate" accent="slate" icon={<CheckCircle size={16}/>} />
        </div>

        {/* Second row stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">GST Threshold</div>
            <div className="text-2xl font-black text-slate-900 mb-2">{stats.gstPct}%</div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${stats.gstPct}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-2 rounded-full ${stats.gstPct > 80 ? 'bg-red-500' : stats.gstPct > 60 ? 'bg-amber-400' : 'bg-emerald-500'}`}
              />
            </div>
            <div className="text-xs text-slate-400 mt-1.5">{fmt$(stats.ytdRevenue)} of {fmt$(stats.gstThreshold)}</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Cash Forecast</div>
            <div className="text-2xl font-black text-slate-900 mb-1">{fmtShort$(stats.cashForecast)}</div>
            <div className="text-xs text-slate-400">Outstanding + 40% pipeline</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Coverage</div>
            <div className="text-2xl font-black text-slate-900 mb-1">{stats.pipelineCoverage} <span className="text-sm font-semibold text-slate-400">mo.</span></div>
            <div className="text-xs text-slate-400">Months of comfortable income</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Active Jobs</div>
            <div className="text-2xl font-black text-slate-900 mb-1">{stats.activeJobs}</div>
            <div className="text-xs text-slate-400">{stats.overdueCount > 0 ? <span className="text-red-500 font-bold">⚠ {stats.overdueCount} overdue</span> : 'All up to date ✓'}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Revenue chart */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-slate-900">Revenue — Last 12 Months</h3>
                <p className="text-xs text-slate-400 mt-0.5">Paid invoices only</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-black text-indigo-600">{fmtShort$(stats.ytdRevenue)}</div>
                <div className="text-xs text-slate-400">YTD</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => [fmt$(v), 'Revenue']} contentStyle={{ background: '#0f172a', border: 'none', borderRadius: 10, color: '#f8fafc', fontSize: 12 }} />
                <Area type="monotone" dataKey="rev" stroke="#6366f1" strokeWidth={2.5} fill="url(#rev)" dot={{ fill: '#6366f1', r: 3 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Overdue panel */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} className="text-red-500" />
                <h3 className="font-bold text-slate-900 text-sm">Overdue Invoices</h3>
              </div>
              <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                {overdueList.length}
              </span>
            </div>
            <div className="divide-y divide-slate-50">
              {overdueList.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-sm">
                  <CheckCircle size={24} className="mx-auto mb-2 text-emerald-400" />
                  All invoices paid!
                </div>
              ) : overdueList.slice(0, 5).map(j => {
                const c = getClient(j.clientId);
                return (
                  <div key={j.id} className="px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => navigate('/invoices')}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-800 truncate">{c?.company || c?.contact || '—'}</div>
                        <div className="text-xs text-slate-400">{j.jobNumber}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-red-600">{fmt$(j.invoiceAmount)}</div>
                        <div className={`text-xs font-semibold ${j.tier === 3 ? 'text-red-500' : j.tier === 2 ? 'text-amber-500' : 'text-orange-400'}`}>
                          {j.daysOverdue}d overdue
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {overdueList.length > 0 && (
              <div className="px-5 py-3 border-t border-slate-100">
                <button onClick={() => navigate('/invoices')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                  View all & chase <ChevronRight size={12}/>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Upcoming Jobs */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2"><Clock size={15} className="text-indigo-500"/> Upcoming Schedule</h3>
              <button onClick={() => navigate('/jobs')} className="text-xs text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1">View all <ChevronRight size={12}/></button>
            </div>
            <div className="divide-y divide-slate-50">
              {upcoming.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">No upcoming scheduled jobs</div>
              ) : upcoming.map(j => {
                const c = getClient(j.clientId);
                const sc = statusColor(j.status);
                return (
                  <div key={j.id} className="px-5 py-3 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className="w-12 text-center shrink-0">
                      <div className="text-lg font-black text-slate-800">{new Date(j.scheduledDate+'T00:00:00').getDate()}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">{new Date(j.scheduledDate+'T00:00:00').toLocaleString('en-AU',{month:'short'})}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-800 truncate">{c?.company || c?.contact || '—'}</div>
                      <div className="text-xs text-slate-400 truncate">{truncate(j.scope, 50)}</div>
                    </div>
                    <Badge status={j.status} size="xs" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2"><Zap size={15} className="text-amber-500"/> Recent Activity</h3>
              <button onClick={() => navigate('/jobs')} className="text-xs text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1">View all <ChevronRight size={12}/></button>
            </div>
            <div className="divide-y divide-slate-50">
              {recent.map(j => {
                const c = getClient(j.clientId);
                const rev = jobRevenue(j);
                return (
                  <div key={j.id} className="px-5 py-3 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate('/jobs')}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-mono font-bold text-indigo-500">{j.jobNumber}</span>
                        <Badge status={j.status} size="xs" />
                      </div>
                      <div className="text-sm font-semibold text-slate-800 truncate">{c?.company || c?.contact || '—'}</div>
                      <div className="text-xs text-slate-400 truncate">{truncate(j.scope, 45)}</div>
                    </div>
                    {rev > 0 && <div className="text-sm font-bold text-slate-700 shrink-0">{fmt$(rev)}</div>}
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
