import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Globe2, RefreshCw, Search, Phone, Mail, MapPin, ArrowRight, CheckCircle2, ExternalLink, KeyRound } from 'lucide-react';
import Layout, { PageHeader } from '../components/layout/Layout';
import { Badge } from '../components/ui/Badge';
import { Btn, Input, Select, Textarea } from '../components/ui/Modal';
import { useStore } from '../store/useStore';
import { today, statusLabel } from '../utils/format';

const API_URL = import.meta.env.VITE_LEADS_API_URL || '/api/leads';
const STATUS_OPTIONS = ['new', 'contacted', 'quoted', 'converted', 'lost'];
const PATH_LABELS = {
  urgent: 'Urgent Sydney fault',
  remote: 'National remote programming',
  commercial: 'Commercial lighting',
  facilities: 'Car-park, strata or maintenance',
  smart_home: 'Premium Smart Home Package',
};

function relativeDate(value) {
  try { return new Date(value).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' }); } catch { return value || '—'; }
}

export default function WebsiteLeads() {
  const { clients, addClient, addJob } = useStore();
  const [token, setToken] = useState(() => localStorage.getItem('sac:leadAdminToken') || '');
  const [tokenDraft, setTokenDraft] = useState(token);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');

  const loadLeads = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?limit=250`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Could not load website leads');
      setLeads(data.leads || []);
    } catch (error) { toast.error(error.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadLeads(); }, [token]);
  useEffect(() => { setNotes(selected?.notes || ''); }, [selected]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const haystack = [lead.name, lead.email, lead.phone, lead.location, lead.message, PATH_LABELS[lead.path], lead.source_page].join(' ').toLowerCase();
      return matchesStatus && (!q || haystack.includes(q));
    });
  }, [leads, search, statusFilter]);

  const saveToken = () => {
    localStorage.setItem('sac:leadAdminToken', tokenDraft.trim());
    setToken(tokenDraft.trim());
  };

  const updateLead = async (lead, status, extra = {}) => {
    try {
      const res = await fetch(API_URL, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id: lead.id, status, notes: extra.notes ?? lead.notes ?? '', convertedJobId: extra.convertedJobId || lead.converted_job_id || '' }) });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Could not update lead');
      setLeads((items) => items.map((item) => item.id === lead.id ? { ...item, status, notes: extra.notes ?? item.notes, converted_job_id: extra.convertedJobId || item.converted_job_id } : item));
      setSelected((item) => item?.id === lead.id ? { ...item, status, notes: extra.notes ?? item.notes, converted_job_id: extra.convertedJobId || item.converted_job_id } : item);
      toast.success('Lead updated');
    } catch (error) { toast.error(error.message); }
  };

  const convertToJob = async (lead) => {
    let client = clients.find((item) => (lead.email && item.email === lead.email) || (lead.phone && item.phone === lead.phone));
    if (!client) {
      client = { id: `c_${Date.now()}`, company: lead.name, contact: lead.name, email: lead.email || '', phone: lead.phone || '', address: lead.location || '', abn: '', notes: `Website lead from ${PATH_LABELS[lead.path] || lead.path}` , createdAt: today() };
      addClient(client);
    }
    const job = { id: `job_${Date.now()}`, jobNumber: `SAI_${100000 + Math.floor(Math.random() * 9999)}`, type: 'SAI', status: 'lead', scope: `${PATH_LABELS[lead.path] || lead.path}: ${lead.message || 'Website enquiry'}`, clientId: client.id, quoteAmount: '', invoiceAmount: '', depositAmount: '', scheduledDate: '', invoiceDue: '', notes: `Website lead ${lead.id}\nSource: ${lead.source_page || 'SAC website'}\nPreferred contact: ${lead.contact_preference || 'Not supplied'}`, createdAt: today(), invoiceLines: [], activityLog: [{ ts: today(), msg: 'Website lead converted to job' }] };
    addJob(job);
    await updateLead(lead, 'converted', { convertedJobId: job.id });
    toast.success(`Converted to ${job.jobNumber}`);
  };

  if (!token) return (
    <Layout>
      <PageHeader title="Website Leads" subtitle="Inbound SAC enquiries" />
      <div className="p-6 max-w-2xl"><div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"><div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4"><KeyRound size={20}/></div><h2 className="text-lg font-black text-slate-900">Connect the lead inbox</h2><p className="text-sm text-slate-500 mt-2 leading-relaxed">Enter the Website Leads admin token once. It is stored only in this browser session and is used to load and update inbound SAC enquiries.</p><div className="mt-5 flex gap-3"><div className="flex-1"><Input type="password" label="Admin token" value={tokenDraft} onChange={(e) => setTokenDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveToken()} /></div><div className="pt-6"><Btn onClick={saveToken}>Connect</Btn></div></div></div></div>
    </Layout>
  );

  return (
    <Layout>
      <PageHeader title="Website Leads" subtitle={`${filtered.length} inbound enquiry${filtered.length === 1 ? '' : 'ies'} · Website Leads inbox`} actions={<Btn variant="secondary" onClick={loadLeads} disabled={loading}><RefreshCw size={15} className={loading ? 'animate-spin' : ''}/> Refresh</Btn>}>
        <div className="flex items-center gap-3 mt-4 flex-wrap"><div className="relative flex-1 max-w-sm"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search leads…" className="w-full pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-400"/></div><Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">All statuses</option>{STATUS_OPTIONS.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</Select></div>
      </PageHeader>
      <div className="p-6 space-y-3">
        {filtered.length === 0 && <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center"><Globe2 className="mx-auto text-slate-300" size={32}/><h2 className="font-bold text-slate-700 mt-3">No website leads yet</h2><p className="text-sm text-slate-400 mt-1">New SAC enquiries will appear here automatically.</p></div>}
        {filtered.map((lead) => <div key={lead.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="flex items-center gap-2 flex-wrap"><h2 className="font-black text-slate-900">{lead.name}</h2><Badge status={lead.status} /><span className="text-xs text-slate-400">{PATH_LABELS[lead.path] || lead.path}</span></div><div className="flex gap-4 flex-wrap text-xs text-slate-500 mt-2"><span><Phone size={12} className="inline mr-1"/>{lead.phone || 'No phone'}</span><span><Mail size={12} className="inline mr-1"/>{lead.email || 'No email'}</span><span><MapPin size={12} className="inline mr-1"/>{lead.location || 'No location'}</span></div></div><div className="text-xs text-slate-400 shrink-0">{relativeDate(lead.created_at)}</div></div><p className="text-sm text-slate-600 mt-4 whitespace-pre-wrap leading-relaxed">{lead.message || 'No project description supplied.'}</p><div className="flex items-center gap-2 mt-4 flex-wrap"><Select value={lead.status} onChange={(e) => updateLead(lead, e.target.value)}>{STATUS_OPTIONS.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</Select>{lead.phone && <a className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50" href={`tel:${lead.phone}`}><Phone size={13}/> Call</a>}{lead.email && <a className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50" href={`mailto:${lead.email}`}><Mail size={13}/> Email</a>}<button onClick={() => setSelected(lead)} className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-700">View details <ArrowRight size={13}/></button></div></div>)}
      </div>
      {selected && <div className="fixed inset-0 bg-slate-950/40 z-50 flex items-center justify-center p-6" onMouseDown={(e) => e.target === e.currentTarget && setSelected(null)}><div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl shadow-2xl p-6"><div className="flex items-start justify-between gap-4"><div><div className="text-xs font-black uppercase tracking-widest text-indigo-500">Website lead</div><h2 className="text-2xl font-black text-slate-900 mt-1">{selected.name}</h2><p className="text-sm text-slate-500 mt-1">{PATH_LABELS[selected.path] || selected.path} · {relativeDate(selected.created_at)}</p></div><button onClick={() => setSelected(null)} className="text-slate-400 text-2xl">×</button></div><div className="grid grid-cols-2 gap-4 mt-6 text-sm"><div><div className="text-xs uppercase font-bold text-slate-400">Phone</div><div className="mt-1">{selected.phone || '—'}</div></div><div><div className="text-xs uppercase font-bold text-slate-400">Email</div><div className="mt-1">{selected.email || '—'}</div></div><div><div className="text-xs uppercase font-bold text-slate-400">Location</div><div className="mt-1">{selected.location || '—'}</div></div><div><div className="text-xs uppercase font-bold text-slate-400">Source</div><a className="mt-1 block text-indigo-600 truncate" href={selected.source_page || '#'} target="_blank" rel="noreferrer">{selected.source_page || '—'} <ExternalLink size={12} className="inline"/></a></div></div><div className="mt-6"><div className="text-xs uppercase font-bold text-slate-400 mb-2">Message</div><div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap">{selected.message || 'No message supplied.'}</div></div><div className="mt-5"><Textarea label="Internal notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}/></div><div className="flex justify-end gap-3 mt-5"><Btn variant="secondary" onClick={() => updateLead(selected, selected.status, { notes })}>Save notes</Btn>{selected.status !== 'converted' && <Btn variant="success" onClick={() => convertToJob(selected)}><CheckCircle2 size={15}/> Convert to job</Btn>}</div></div></div>}
    </Layout>
  );
}
