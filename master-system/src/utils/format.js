export const fmt$ = (v) =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 2 }).format(Number(v) || 0);

export const fmtShort$ = (v) => {
  const n = Number(v) || 0;
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return fmt$(n);
};

export const fmtDate = (d) => {
  if (!d) return '—';
  try { return new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
};

export const fmtDateShort = (d) => {
  if (!d) return '—';
  try { return new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }); }
  catch { return d; }
};

export const today = () => new Date().toISOString().slice(0, 10);

export const daysAgo = (d) => {
  if (!d) return null;
  return Math.floor((new Date() - new Date(d + 'T00:00:00')) / 86400000);
};

export const daysOverdue = (dueDate) => {
  if (!dueDate) return 0;
  const diff = Math.floor((new Date() - new Date(dueDate + 'T00:00:00')) / 86400000);
  return Math.max(0, diff);
};

export const statusColor = (status) => {
  const map = {
    paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    invoiced: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
    overdue: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
    quoted: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
    scheduled: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500' },
    lead: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-400' },
    booking: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-500' },
    lost: { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200', dot: 'bg-slate-400' },
    approved: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500' },
  };
  return map[status] || map.lead;
};

export const statusLabel = (s) => {
  const map = { paid: 'Paid', invoiced: 'Invoiced', overdue: 'Overdue', quoted: 'Quoted', scheduled: 'Scheduled', lead: 'Lead', booking: 'Booking', lost: 'Lost', approved: 'Approved' };
  return map[s] || s;
};

export const truncate = (str, n = 60) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');

export const fyStart = () => {
  const now = new Date();
  const year = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-07-01`;
};

export const isInFY = (dateStr) => {
  if (!dateStr) return false;
  return dateStr >= fyStart();
};
