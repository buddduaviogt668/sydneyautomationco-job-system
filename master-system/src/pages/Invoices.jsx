import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { AlertTriangle, Send, CheckCircle, Mail, Clock, DollarSign, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { jobOutstanding, overdueEscalation } from '../utils/calculations';
import { fmt$, fmtDate, daysOverdue } from '../utils/format';
import { Badge } from '../components/ui/Badge';
import { Btn } from '../components/ui/Modal';
import Layout, { PageHeader } from '../components/layout/Layout';

const TIER_CONFIG = {
  1: { label: 'Gentle Reminder', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', days: '3–13 days' },
  2: { label: 'Formal Notice', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', days: '14–29 days' },
  3: { label: 'Final Demand', color: 'text-red-600', bg: 'bg-red-50 border-red-200', days: '30+ days' },
};

export default function Invoices() {
  const { jobs, clients, config, updateJob } = useStore();
  const [filter, setFilter] = useState('overdue');

  const invoiced = useMemo(() =>
    jobs.filter(j => ['invoiced','overdue'].includes(j.status) && !(j.jobNumber||'').startsWith('SAQ')),
    [jobs]);

  const overdueList = useMemo(() => overdueEscalation(jobs), [jobs]);
  const totalOutstanding = useMemo(() => invoiced.reduce((s,j) => s+jobOutstanding(j), 0), [invoiced]);

  const displayed = useMemo(() => {
    if (filter === 'overdue') return overdueList;
    return invoiced.map(j => ({ ...j, daysOverdue: daysOverdue(j.invoiceDue), tier: 1 }));
  }, [filter, overdueList, invoiced]);

  const getClient = id => clients.find(c => c.id === id) || {};

  const markPaid = (jobId) => {
    updateJob(jobId, {
      status: 'paid',
      paidDate: new Date().toISOString().slice(0,10),
      activityLog: [...(jobs.find(j=>j.id===jobId)?.activityLog||[]), { ts: new Date().toLocaleString('en-AU'), msg: `✓ Marked paid` }]
    });
    toast.success('Marked as paid!');
  };

  const sendChase = (j, tier) => {
    const c = getClient(j.clientId);
    const firstName = (c.contact || c.company || 'there').split(' ')[0];
    const amount = fmt$(jobOutstanding(j));
    const due = fmtDate(j.invoiceDue);
    const days = j.daysOverdue;
    const bizName = config.bizName || 'Sydney Automation Co.';
    const bizPhone = config.bizPhone || '';
    const bizEmail = config.bizEmail || '';

    const bodies = {
      1: `Hi ${firstName},\n\nI hope you're well. I wanted to follow up on invoice ${j.invoiceNumber || j.jobNumber} for ${amount}, which was due on ${due}.\n\nCould you please arrange payment at your earliest convenience?\n\nKind regards,\n${bizName}\n${bizPhone} | ${bizEmail}`,
      2: `Hi ${firstName},\n\nThis is a formal notice that invoice ${j.invoiceNumber || j.jobNumber} for ${amount} remains unpaid — now ${days} days overdue.\n\nPlease arrange payment immediately or contact us to discuss. A late payment fee of 2% per month may apply.\n\nKind regards,\n${bizName}\n${bizPhone} | ${bizEmail}`,
      3: `Dear ${c.company || firstName},\n\nDespite previous requests, invoice ${j.invoiceNumber || j.jobNumber} for ${amount} remains unpaid — now ${days} days overdue.\n\nThis is a final demand for payment. If we do not receive payment within 7 days, we will refer this debt to a collection agency and/or pursue legal action.\n\nKind regards,\n${bizName}\n${bizPhone} | ${bizEmail}`,
    };

    const subject = tier === 3 ? `FINAL DEMAND — ${j.invoiceNumber||j.jobNumber}` : tier === 2 ? `Formal Notice — ${j.invoiceNumber||j.jobNumber} Overdue` : `Gentle Reminder — ${j.invoiceNumber||j.jobNumber}`;
    const email = c.email || '';
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodies[tier] || bodies[1])}`);
    updateJob(j.id, { status: 'overdue', activityLog: [...(j.activityLog||[]), { ts: new Date().toLocaleString('en-AU'), msg: `📧 Chase sent — ${TIER_CONFIG[tier].label}` }] });
    toast.success('Chase email opened');
  };

  return (
    <Layout>
      <PageHeader
        title="Invoices"
        subtitle={`${invoiced.length} outstanding · ${fmt$(totalOutstanding)} owed`}
        actions={
          <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
            <button onClick={() => setFilter('overdue')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filter==='overdue' ? 'bg-white text-slate-800 shadow-sm':'text-slate-500'}`}>
              Overdue {overdueList.length > 0 && <span className="ml-1 text-red-500">{overdueList.length}</span>}
            </button>
            <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filter==='all' ? 'bg-white text-slate-800 shadow-sm':'text-slate-500'}`}>All Invoiced</button>
          </div>
        }
      >
        {/* Summary cards */}
        <div className="flex gap-4 mt-4">
          {[
            { label: 'Total Outstanding', value: fmt$(totalOutstanding), color: 'text-slate-900' },
            { label: 'Overdue', value: fmt$(overdueList.reduce((s,j)=>s+jobOutstanding(j),0)), color: 'text-red-600' },
            { label: `Tier 3 (${TIER_CONFIG[3].days})`, value: overdueList.filter(j=>j.tier===3).length + ' invoices', color: 'text-red-700' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-xl px-4 py-3">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{s.label}</div>
              <div className={`text-lg font-black mt-0.5 ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
      </PageHeader>

      <div className="p-6 space-y-3">
        {displayed.length === 0 ? (
          <div className="text-center py-20">
            <CheckCircle className="mx-auto mb-3 text-emerald-400" size={40}/>
            <div className="text-slate-500 font-semibold">No overdue invoices — great work!</div>
          </div>
        ) : displayed.map((j, i) => {
          const c = getClient(j.clientId);
          const tier = j.tier || 1;
          const tc = TIER_CONFIG[tier];
          const amt = jobOutstanding(j);
          return (
            <motion.div key={j.id} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*0.03 }}
              className={`bg-white border rounded-2xl overflow-hidden`}>
              {/* Tier indicator strip */}
              <div className={`px-5 py-2 ${tc.bg} border-b flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={13} className={tc.color}/>
                  <span className={`text-xs font-black uppercase tracking-wider ${tc.color}`}>{tc.label}</span>
                  <span className="text-xs text-slate-500">— {j.daysOverdue} days overdue</span>
                </div>
                <span className="text-xs text-slate-400">{tc.days}</span>
              </div>

              <div className="flex items-center gap-5 px-5 py-4">
                <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <div className="text-xs font-mono font-bold text-indigo-500">{j.invoiceNumber || j.jobNumber}</div>
                    <div className="text-sm font-bold text-slate-800">{c.company || c.contact || '—'}</div>
                    {c.email && <div className="text-xs text-slate-400">{c.email}</div>}
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-xs text-slate-500 line-clamp-2">{j.scope?.split('\n')[0]}</div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Clock size={10}/> Due {fmtDate(j.invoiceDue)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-center">
                    <div className={`text-xl font-black ${tier === 3 ? 'text-red-600' : tier === 2 ? 'text-orange-600' : 'text-amber-600'}`}>{fmt$(amt)}</div>
                    <Badge status={j.status} size="xs"/>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-4 flex gap-2 flex-wrap">
                <Btn variant="success" size="sm" onClick={() => markPaid(j.id)}><CheckCircle size={13}/> Mark Paid</Btn>
                {Object.keys(TIER_CONFIG).map(t => (
                  <Btn key={t} variant={Number(t) === tier ? 'primary' : 'secondary'} size="sm" onClick={() => sendChase(j, Number(t))}>
                    <Mail size={13}/> {TIER_CONFIG[t].label}
                  </Btn>
                ))}
              </div>

              {/* Activity log */}
              {j.activityLog?.length > 0 && (
                <div className="px-5 pb-3 border-t border-slate-100 pt-3">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Activity</div>
                  <div className="space-y-1">
                    {[...j.activityLog].reverse().slice(0,3).map((a, ai) => (
                      <div key={ai} className="text-xs text-slate-500 flex items-start gap-2">
                        <span className="text-slate-300 shrink-0">{a.ts}</span>
                        <span>{a.msg}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </Layout>
  );
}
