import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, Search, Filter, ChevronDown, Edit3, Trash2, FileText, Clock, DollarSign } from 'lucide-react';
import { useStore } from '../store/useStore';
import { jobRevenue, jobOutstanding } from '../utils/calculations';
import { fmt$, fmtDate, fmtDateShort, statusColor, statusLabel, truncate, today } from '../utils/format';
import { Badge } from '../components/ui/Badge';
import { Modal, Input, Select, Textarea, Btn } from '../components/ui/Modal';
import Layout, { PageHeader } from '../components/layout/Layout';

const STATUS_FILTERS = ['all', 'lead', 'booking', 'scheduled', 'invoiced', 'overdue', 'paid', 'lost'];
const EMPTY_JOB = { type: 'SAI', status: 'lead', scope: '', clientId: '', quoteAmount: '', invoiceAmount: '', depositAmount: '', scheduledDate: '', invoiceDue: '', notes: '' };

export default function Jobs() {
  const { jobs, clients, addJob, updateJob, deleteJob } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [form, setForm] = useState(EMPTY_JOB);
  const [expandedId, setExpandedId] = useState(null);

  const getClient = (id) => clients.find(c => c.id === id);

  const filtered = useMemo(() => {
    let list = jobs.filter(j => j.type !== 'SAQ');
    if (statusFilter !== 'all') list = list.filter(j => j.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(j => {
        const c = getClient(j.clientId);
        return (j.jobNumber || '').toLowerCase().includes(q)
          || (j.scope || '').toLowerCase().includes(q)
          || (c?.company || '').toLowerCase().includes(q)
          || (c?.contact || '').toLowerCase().includes(q);
      });
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [jobs, statusFilter, search, clients]);

  const statusCounts = useMemo(() => {
    const counts = {};
    STATUS_FILTERS.forEach(s => {
      counts[s] = s === 'all' ? jobs.filter(j => j.type !== 'SAQ').length : jobs.filter(j => j.type !== 'SAQ' && j.status === s).length;
    });
    return counts;
  }, [jobs]);

  const openNew = () => { setForm({ ...EMPTY_JOB, createdAt: today() }); setEditingJob(null); setModalOpen(true); };
  const openEdit = (j) => { setForm({ ...j }); setEditingJob(j.id); setModalOpen(true); };

  const handleSave = () => {
    if (!form.scope.trim()) return toast.error('Scope is required');
    if (editingJob) {
      updateJob(editingJob, form);
      toast.success('Job updated');
    } else {
      const newJob = {
        ...form,
        id: `job_${Date.now()}`,
        jobNumber: `SAI_${100000 + Math.floor(Math.random() * 9999)}`,
        createdAt: today(),
        invoiceLines: [],
        activityLog: [],
      };
      addJob(newJob);
      toast.success('Job created');
    }
    setModalOpen(false);
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this job?')) return;
    deleteJob(id);
    toast.success('Job deleted');
  };

  return (
    <Layout>
      <PageHeader
        title="Jobs"
        subtitle={`${filtered.length} of ${statusCounts.all} jobs`}
        actions={<Btn onClick={openNew}><Plus size={15}/> New Job</Btn>}
      >
        {/* Filter Bar */}
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs, clients…"
              className="w-full pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-400" />
          </div>
          <div className="flex gap-1 flex-wrap">
            {STATUS_FILTERS.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${statusFilter === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                {s === 'all' ? 'All' : statusLabel(s)} {statusCounts[s] > 0 && <span className="ml-1 opacity-60">{statusCounts[s]}</span>}
              </button>
            ))}
          </div>
        </div>
      </PageHeader>

      <div className="p-6">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Briefcase className="mx-auto mb-3 opacity-30" size={40}/>
            <div className="font-semibold">No jobs found</div>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filtered.map((j, i) => {
                const c = getClient(j.clientId);
                const rev = jobRevenue(j);
                const isExpanded = expandedId === j.id;
                const sc = statusColor(j.status);
                return (
                  <motion.div key={j.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-colors">
                    <div className="flex items-center gap-4 px-5 py-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : j.id)}>
                      <div className={`w-1.5 h-10 rounded-full ${sc.dot}`} />
                      <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-1">
                        <div>
                          <div className="text-xs font-mono font-bold text-indigo-500">{j.jobNumber}</div>
                          <div className="text-sm font-semibold text-slate-800 truncate">{c?.company || c?.contact || 'No client'}</div>
                        </div>
                        <div className="md:col-span-2">
                          <div className="text-xs text-slate-500 truncate">{truncate(j.scope, 80)}</div>
                          {j.scheduledDate && <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><Clock size={10}/>{fmtDate(j.scheduledDate)}</div>}
                        </div>
                        <div className="flex items-center justify-between md:justify-end gap-3">
                          <Badge status={j.status} size="xs"/>
                          {rev > 0 && <span className="text-sm font-bold text-slate-800">{fmt$(rev)}</span>}
                        </div>
                      </div>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}/>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                          <div className="px-5 pb-4 pt-0 border-t border-slate-100 bg-slate-50">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 text-sm">
                              <div><div className="text-xs text-slate-400 mb-1">Quote Amount</div><div className="font-semibold">{j.quoteAmount ? fmt$(j.quoteAmount) : '—'}</div></div>
                              <div><div className="text-xs text-slate-400 mb-1">Invoice Amount</div><div className="font-semibold">{j.invoiceAmount ? fmt$(j.invoiceAmount) : '—'}</div></div>
                              <div><div className="text-xs text-slate-400 mb-1">Deposit</div><div className="font-semibold">{j.depositAmount ? fmt$(j.depositAmount) : '—'}</div></div>
                              <div><div className="text-xs text-slate-400 mb-1">Due Date</div><div className="font-semibold">{j.invoiceDue ? fmtDate(j.invoiceDue) : '—'}</div></div>
                            </div>
                            {j.scope && <div className="text-xs text-slate-600 bg-white border border-slate-200 rounded-lg p-3 mb-3 leading-relaxed">{j.scope}</div>}
                            {j.notes && <div className="text-xs text-slate-500 italic mb-3">📝 {j.notes}</div>}
                            <div className="flex gap-2">
                              <Btn variant="secondary" size="sm" onClick={() => openEdit(j)}><Edit3 size={13}/> Edit</Btn>
                              <Btn variant="ghost" size="sm" onClick={() => handleDelete(j.id)}><Trash2 size={13} className="text-red-400"/></Btn>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Job Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingJob ? 'Edit Job' : 'New Job'} width="max-w-2xl">
        <div className="grid grid-cols-2 gap-4">
          <Select label="Type" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
            <option value="SAI">SAI — Invoice Job</option>
            <option value="SAQ">SAQ — Quote Only</option>
          </Select>
          <Select label="Status" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
            {['lead','booking','scheduled','invoiced','overdue','paid','lost','quoted','approved'].map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
          </Select>
          <Select label="Client" value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})}>
            <option value="">— Select Client —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.company || c.contact}</option>)}
          </Select>
          <Input label="Scheduled Date" type="date" value={form.scheduledDate || ''} onChange={e => setForm({...form, scheduledDate: e.target.value})} />
          <Input label="Quote Amount ($)" type="number" value={form.quoteAmount || ''} onChange={e => setForm({...form, quoteAmount: e.target.value})} />
          <Input label="Invoice Amount ($)" type="number" value={form.invoiceAmount || ''} onChange={e => setForm({...form, invoiceAmount: e.target.value})} />
          <Input label="Deposit Amount ($)" type="number" value={form.depositAmount || ''} onChange={e => setForm({...form, depositAmount: e.target.value})} />
          <Input label="Invoice Due" type="date" value={form.invoiceDue || ''} onChange={e => setForm({...form, invoiceDue: e.target.value})} />
          <div className="col-span-2"><Textarea label="Scope of Work" value={form.scope || ''} onChange={e => setForm({...form, scope: e.target.value})} rows={4}/></div>
          <div className="col-span-2"><Textarea label="Internal Notes" value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} rows={2}/></div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <Btn variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Btn>
          <Btn onClick={handleSave}>{editingJob ? 'Save Changes' : 'Create Job'}</Btn>
        </div>
      </Modal>
    </Layout>
  );
}

function Briefcase({ className, size }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>;
}
