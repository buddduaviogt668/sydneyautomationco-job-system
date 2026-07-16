import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, Search, TrendingUp, CheckCircle, XCircle, Clock, ChevronRight, DollarSign } from 'lucide-react';
import { useStore } from '../store/useStore';
import { fmt$, fmtDate, truncate, today, statusLabel } from '../utils/format';
import { Badge } from '../components/ui/Badge';
import { Modal, Input, Select, Textarea, Btn } from '../components/ui/Modal';
import Layout, { PageHeader } from '../components/layout/Layout';

const PIPE_STAGES = [
  { key: 'lead', label: 'Leads', color: 'bg-amber-400' },
  { key: 'quoted', label: 'Quoted', color: 'bg-indigo-500' },
  { key: 'approved', label: 'Approved', color: 'bg-violet-500' },
  { key: 'paid', label: 'Won', color: 'bg-emerald-500' },
  { key: 'lost', label: 'Lost', color: 'bg-slate-400' },
];

export default function Quotes() {
  const { jobs, clients, addJob, updateJob } = useStore();
  const [view, setView] = useState('pipeline');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ type: 'SAQ', status: 'quoted', scope: '', clientId: '', quoteAmount: '', notes: '' });

  const quotes = useMemo(() => {
    let list = jobs.filter(j => j.type === 'SAQ' || j.status === 'quoted');
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(j => {
        const c = clients.find(x => x.id === j.clientId);
        return (j.jobNumber || '').toLowerCase().includes(q) || (j.scope || '').toLowerCase().includes(q) || (c?.company || '').toLowerCase().includes(q);
      });
    }
    return list;
  }, [jobs, clients, search]);

  const byStage = useMemo(() => {
    const map = {};
    PIPE_STAGES.forEach(s => { map[s.key] = quotes.filter(j => j.status === s.key); });
    return map;
  }, [quotes]);

  const pipelineTotal = useMemo(() => quotes.filter(j => !['paid','lost'].includes(j.status)).reduce((s,j) => s + (Number(j.quoteAmount)||0), 0), [quotes]);
  const wonTotal = useMemo(() => quotes.filter(j => j.status === 'paid').reduce((s,j) => s + (Number(j.quoteAmount)||0), 0), [quotes]);
  const winRate = useMemo(() => {
    const closed = quotes.filter(j => ['paid','lost'].includes(j.status));
    const won = closed.filter(j => j.status === 'paid');
    return closed.length > 0 ? Math.round((won.length / closed.length) * 100) : 0;
  }, [quotes]);

  const getClient = (id) => clients.find(c => c.id === id);

  const handleCreate = () => {
    if (!form.scope.trim() || !form.quoteAmount) return toast.error('Scope and amount required');
    addJob({
      ...form,
      id: `q_${Date.now()}`,
      jobNumber: `SAQ_${100000 + Math.floor(Math.random() * 9999)}`,
      createdAt: today(),
      invoiceLines: [],
      activityLog: [{ ts: today(), msg: '📋 Quote created' }],
    });
    toast.success('Quote created!');
    setModalOpen(false);
    setForm({ type: 'SAQ', status: 'quoted', scope: '', clientId: '', quoteAmount: '', notes: '' });
  };

  const moveStage = (jobId, newStatus) => {
    updateJob(jobId, { status: newStatus, activityLog: [...(jobs.find(j=>j.id===jobId)?.activityLog||[]), { ts: today(), msg: `→ Status: ${statusLabel(newStatus)}` }] });
    toast.success(`Moved to ${statusLabel(newStatus)}`);
  };

  return (
    <Layout>
      <PageHeader
        title="Quotes & Pipeline"
        subtitle={`${quotes.filter(j=>!['paid','lost'].includes(j.status)).length} active · ${fmt$(pipelineTotal)} pipeline`}
        actions={
          <>
            <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
              <button onClick={() => setView('pipeline')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${view==='pipeline' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>Pipeline</button>
              <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${view==='list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>List</button>
            </div>
            <Btn onClick={() => setModalOpen(true)}><Plus size={15}/> New Quote</Btn>
          </>
        }
      >
        <div className="flex items-center gap-6 mt-4">
          <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search quotes…" className="pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-400 w-56"/></div>
          <div className="flex gap-6 text-sm">
            <div><span className="text-slate-400">Pipeline:</span> <span className="font-bold text-slate-800">{fmt$(pipelineTotal)}</span></div>
            <div><span className="text-slate-400">Won:</span> <span className="font-bold text-emerald-600">{fmt$(wonTotal)}</span></div>
            <div><span className="text-slate-400">Win Rate:</span> <span className="font-bold text-indigo-600">{winRate}%</span></div>
          </div>
        </div>
      </PageHeader>

      <div className="p-6">
        {view === 'pipeline' ? (
          /* Kanban View */
          <div className="grid grid-cols-5 gap-4 h-full">
            {PIPE_STAGES.map(stage => (
              <div key={stage.key} className="bg-slate-100/70 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${stage.color}`}/>
                  <span className="text-xs font-black text-slate-600 uppercase tracking-wider">{stage.label}</span>
                  <span className="ml-auto text-xs font-bold text-slate-400">{byStage[stage.key]?.length || 0}</span>
                </div>
                <div className="px-3 pb-3 space-y-2 min-h-[200px]">
                  <AnimatePresence>
                    {(byStage[stage.key] || []).map(j => {
                      const c = getClient(j.clientId);
                      return (
                        <motion.div key={j.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                          className="bg-white rounded-xl p-3 shadow-sm border border-slate-200/60 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group">
                          <div className="text-[10px] font-mono font-bold text-indigo-400 mb-1">{j.jobNumber}</div>
                          <div className="text-xs font-bold text-slate-800 mb-0.5 truncate">{c?.company || c?.contact || '—'}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-2 mb-2">{truncate(j.scope, 60)}</div>
                          {j.quoteAmount && <div className="text-sm font-black text-slate-800 mb-2">{fmt$(j.quoteAmount)}</div>}
                          {/* Stage move buttons */}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-wrap">
                            {PIPE_STAGES.filter(s => s.key !== stage.key).slice(0,2).map(s => (
                              <button key={s.key} onClick={() => moveStage(j.id, s.key)} className="text-[10px] font-bold px-2 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 rounded-md transition-colors">
                                → {s.label}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2">
            {quotes.map(j => {
              const c = getClient(j.clientId);
              return (
                <div key={j.id} className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-center gap-4 hover:border-slate-300 transition-colors">
                  <div className="flex-1 min-w-0 grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs font-mono font-bold text-indigo-500">{j.jobNumber}</div>
                      <div className="text-sm font-semibold text-slate-800 truncate">{c?.company || c?.contact || '—'}</div>
                    </div>
                    <div className="col-span-1"><div className="text-xs text-slate-500 line-clamp-2">{truncate(j.scope, 80)}</div></div>
                    <div className="flex items-center gap-4 justify-end">
                      <span className="text-sm font-bold text-slate-800">{j.quoteAmount ? fmt$(j.quoteAmount) : '—'}</span>
                      <Badge status={j.status} size="xs"/>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => moveStage(j.id, 'paid')} title="Mark Won" className="p-2 hover:bg-emerald-50 text-slate-300 hover:text-emerald-600 rounded-lg transition-colors"><CheckCircle size={16}/></button>
                    <button onClick={() => moveStage(j.id, 'lost')} title="Mark Lost" className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-colors"><XCircle size={16}/></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Quote">
        <div className="space-y-4">
          <Select label="Client" value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})}>
            <option value="">— Select Client —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.company || c.contact}</option>)}
          </Select>
          <Input label="Quote Amount ($)" type="number" value={form.quoteAmount} onChange={e => setForm({...form, quoteAmount: e.target.value})} />
          <Textarea label="Scope of Work" value={form.scope} onChange={e => setForm({...form, scope: e.target.value})} rows={5}/>
          <Textarea label="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2}/>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <Btn variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Btn>
          <Btn onClick={handleCreate}>Create Quote</Btn>
        </div>
      </Modal>
    </Layout>
  );
}
