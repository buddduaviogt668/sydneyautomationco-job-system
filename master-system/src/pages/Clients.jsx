import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, Search, Mail, Phone, MapPin, Briefcase, TrendingUp, ChevronDown } from 'lucide-react';
import { useStore } from '../store/useStore';
import { jobRevenue } from '../utils/calculations';
import { fmt$, fmtDate, today } from '../utils/format';
import { Badge } from '../components/ui/Badge';
import { Modal, Input, Textarea, Btn } from '../components/ui/Modal';
import Layout, { PageHeader } from '../components/layout/Layout';

const EMPTY = { company: '', contact: '', email: '', phone: '', address: '', abn: '', notes: '' };

export default function Clients() {
  const { clients, jobs, addClient, updateClient } = useStore();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [expandedId, setExpandedId] = useState(null);

  const filtered = useMemo(() => {
    let list = [...clients];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => (c.company||'').toLowerCase().includes(q) || (c.contact||'').toLowerCase().includes(q) || (c.email||'').toLowerCase().includes(q));
    }
    return list;
  }, [clients, search]);

  const clientStats = useMemo(() => {
    const map = {};
    clients.forEach(c => {
      const cjobs = jobs.filter(j => j.clientId === c.id);
      const paid = cjobs.filter(j => j.status === 'paid');
      const revenue = paid.reduce((s, j) => s + jobRevenue(j), 0);
      const active = cjobs.filter(j => !['paid','lost'].includes(j.status)).length;
      const lastJob = cjobs.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      map[c.id] = { total: cjobs.length, paid: paid.length, revenue, active, lastJob };
    });
    return map;
  }, [clients, jobs]);

  const openNew = () => { setForm(EMPTY); setEditingId(null); setModalOpen(true); };
  const openEdit = (c) => { setForm({...c}); setEditingId(c.id); setModalOpen(true); };

  const handleSave = () => {
    if (!form.company && !form.contact) return toast.error('Company or contact name required');
    if (editingId) {
      updateClient(editingId, form);
      toast.success('Client updated');
    } else {
      addClient({ ...form, id: `c_${Date.now()}`, createdAt: today() });
      toast.success('Client added');
    }
    setModalOpen(false);
  };

  const top = [...clients].sort((a,b) => (clientStats[b.id]?.revenue||0) - (clientStats[a.id]?.revenue||0));

  return (
    <Layout>
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} clients · ${fmt$(Object.values(clientStats).reduce((s,x) => s + x.revenue, 0))} total billed`}
        actions={<Btn onClick={openNew}><Plus size={15}/> Add Client</Btn>}
      >
        <div className="mt-4 relative w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search clients…"
            className="w-full pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-400"/>
        </div>
      </PageHeader>

      <div className="p-6">
        {/* Top Clients Strip */}
        {!search && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {top.slice(0, 4).map((c, i) => {
              const st = clientStats[c.id] || {};
              return (
                <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-black">
                      {(c.company || c.contact || '?')[0].toUpperCase()}
                    </div>
                    <div className="text-xs font-bold text-slate-700 truncate">{c.company || c.contact}</div>
                  </div>
                  <div className="text-lg font-black text-slate-900">{fmt$(st.revenue)}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{st.paid} paid jobs</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Client List */}
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((c, i) => {
              const st = clientStats[c.id] || {};
              const cjobs = jobs.filter(j => j.clientId === c.id).sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt));
              const isExp = expandedId === c.id;
              return (
                <motion.div key={c.id} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.02 }}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-colors">
                  <div className="flex items-center gap-5 px-5 py-4 cursor-pointer" onClick={() => setExpandedId(isExp ? null : c.id)}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                      {(c.company || c.contact || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-2">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{c.company || c.contact}</div>
                        {c.company && c.contact && <div className="text-xs text-slate-500">{c.contact}</div>}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        {c.email && <div className="text-xs text-slate-500 flex items-center gap-1"><Mail size={11}/>{c.email}</div>}
                        {c.phone && <div className="text-xs text-slate-500 flex items-center gap-1"><Phone size={11}/>{c.phone}</div>}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-xs text-slate-400"><span className="font-bold text-slate-700">{st.total}</span> jobs</div>
                        {st.active > 0 && <div className="text-xs text-indigo-600 font-bold">{st.active} active</div>}
                      </div>
                      <div className="flex items-center justify-end gap-3">
                        <div className="text-right">
                          <div className="text-sm font-black text-slate-800">{fmt$(st.revenue)}</div>
                          <div className="text-xs text-slate-400">{st.paid} paid</div>
                        </div>
                      </div>
                    </div>
                    <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform ${isExp ? 'rotate-180':''}`}/>
                  </div>

                  <AnimatePresence>
                    {isExp && (
                      <motion.div initial={{ height:0 }} animate={{ height:'auto' }} exit={{ height:0 }} className="overflow-hidden">
                        <div className="px-5 pb-5 pt-1 border-t border-slate-100 bg-slate-50">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
                            {c.address && <div className="flex items-start gap-2 text-sm"><MapPin size={13} className="text-slate-400 mt-0.5"/><span className="text-slate-600">{c.address}</span></div>}
                            {c.abn && <div className="text-sm text-slate-600">ABN: {c.abn}</div>}
                            {c.notes && <div className="text-sm text-slate-500 italic col-span-full">{c.notes}</div>}
                          </div>
                          {/* Job history */}
                          {cjobs.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Job History</div>
                              <div className="space-y-1.5">
                                {cjobs.slice(0,5).map(j => (
                                  <div key={j.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-slate-200 text-xs">
                                    <span className="font-mono font-bold text-indigo-500 w-24 shrink-0">{j.jobNumber}</span>
                                    <span className="flex-1 text-slate-600 truncate">{j.scope?.split('\n')[0]}</span>
                                    <Badge status={j.status} size="xs"/>
                                    {jobRevenue(j) > 0 && <span className="font-bold text-slate-700">{fmt$(jobRevenue(j))}</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="flex gap-2 mt-3">
                            <Btn variant="secondary" size="sm" onClick={() => openEdit(c)}>Edit Client</Btn>
                            {c.email && <Btn variant="ghost" size="sm" onClick={() => window.open(`mailto:${c.email}`)}>
                              <Mail size={13}/> Email
                            </Btn>}
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
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Client' : 'Add Client'}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Company Name" value={form.company||''} onChange={e=>setForm({...form,company:e.target.value})}/>
          <Input label="Contact Name" value={form.contact||''} onChange={e=>setForm({...form,contact:e.target.value})}/>
          <Input label="Email" type="email" value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})}/>
          <Input label="Phone" value={form.phone||''} onChange={e=>setForm({...form,phone:e.target.value})}/>
          <div className="col-span-2"><Input label="Address" value={form.address||''} onChange={e=>setForm({...form,address:e.target.value})}/></div>
          <Input label="ABN" value={form.abn||''} onChange={e=>setForm({...form,abn:e.target.value})}/>
          <div className="col-span-2"><Textarea label="Notes" value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})} rows={2}/></div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <Btn variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Btn>
          <Btn onClick={handleSave}>{editingId ? 'Save' : 'Add Client'}</Btn>
        </div>
      </Modal>
    </Layout>
  );
}
