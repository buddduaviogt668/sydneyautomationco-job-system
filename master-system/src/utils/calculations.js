import { fyStart, isInFY } from './format';

// Single source of truth for job revenue — matches existing index.html logic exactly
export function jobRevenue(j) {
  if (!j) return 0;
  if ((j.jobNumber || '').startsWith('SAQ') || j.type === 'SAQ') return 0;
  const dep = Number(j.depositAmount) || 0;
  const inv = Number(j.invoiceAmount) || 0;
  const quote = Number(j.quoteAmount) || 0;
  if (dep > 0 && inv > 0) {
    if (Math.abs((dep + inv) - quote) < 0.01) return quote;
    if (inv < quote * 0.9) return dep + inv;
    return inv;
  }
  if (inv > 0) return inv;
  return quote;
}

// True balance owed (never double-counts deposit)
export function jobBalance(j) {
  if (!j) return 0;
  const rev = jobRevenue(j);
  const dep = Number(j.depositAmount) || 0;
  if (dep > 0) return Math.max(0, rev - dep);
  const inv = Number(j.invoiceAmount) || 0;
  return inv || rev;
}

// Outstanding = unpaid balance
export function jobOutstanding(j) {
  if (!j) return 0;
  if (j.invoiceAmount != null && j.invoiceAmount !== '') return Number(j.invoiceAmount) || 0;
  const q = Number(j.quoteAmount) || 0;
  const d = Number(j.depositAmount) || 0;
  return q - d > 0 ? q - d : 0;
}

// Job cost (parts + supplier invoices)
export function jobCost(j, supInvoices = []) {
  if (!j) return 0;
  if (j.actualPartsCost != null && j.actualPartsCost !== '' && Number(j.actualPartsCost) > 0)
    return Number(j.actualPartsCost);
  const linked = supInvoices.filter(i => i.jobId === j.id || i.jobRef === j.jobNumber);
  const linkedTotal = linked.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  if (linkedTotal > 0) return linkedTotal;
  if ((j.parts || []).length > 0) return (j.parts || []).reduce((s, p) => s + (Number(p.cost) || 0) * (Number(p.qty) || 1), 0);
  return 0;
}

// Full profitability for a job
export function jobProfit(j, supInvoices = [], expenses = [], cfg = {}) {
  const rev = jobRevenue(j);
  const parts = jobCost(j, supInvoices);
  const expCost = (expenses || []).filter(e => e.jobRef === j.jobNumber || e.jobRef === j.id).reduce((s, e) => s + Number(e.amount || 0), 0);
  const hoursLogged = (j.labour || []).reduce((s, l) => s + Number(l.hours || 0), 0);
  const monthlyGross = Number(cfg.payGross) || 0;
  const annualCost = monthlyGross * 12 * (1 + (Number(cfg.superRate) || 11.5) / 100);
  const costPerHour = annualCost > 0 ? annualCost / 1000 : 0;
  const labourCost = costPerHour > 0 ? hoursLogged * costPerHour : 0;
  const total = parts + expCost + labourCost;
  const profit = rev - total;
  const margin = rev > 0 ? (profit / rev) * 100 : 0;
  return { rev, parts, expCost, labourCost, total, profit, margin };
}

// Aggregate financial stats for a set of jobs
export function calcFinancials(jobs = [], supInvoices = [], expenses = [], cfg = {}) {
  const paid = jobs.filter(j => j.status === 'paid' && !((j.jobNumber || '').startsWith('SAQ') || j.type === 'SAQ'));
  const paidYTD = paid.filter(j => isInFY(j.paidDate || j.createdAt));
  const invoiced = jobs.filter(j => ['invoiced', 'overdue'].includes(j.status) && !((j.jobNumber || '').startsWith('SAQ')));
  const activeQuotes = jobs.filter(j => j.type === 'SAQ' && !['paid', 'lost'].includes(j.status));
  
  const ytdRevenue = paidYTD.reduce((s, j) => s + jobRevenue(j), 0);
  const outstanding = invoiced.reduce((s, j) => s + jobOutstanding(j), 0);
  const pipeline = activeQuotes.reduce((s, j) => s + (Number(j.quoteAmount) || 0), 0);
  const paidThisMonth = paid.filter(j => {
    const d = j.paidDate || j.createdAt;
    if (!d) return false;
    const now = new Date();
    const jd = new Date(d + 'T00:00:00');
    return jd.getMonth() === now.getMonth() && jd.getFullYear() === now.getFullYear();
  });
  const thisMonth = paidThisMonth.reduce((s, j) => s + jobRevenue(j), 0);
  
  // Supplier costs YTD
  const ytdSupCosts = supInvoices
    .filter(i => isInFY(i.date))
    .reduce((s, i) => s + (Number(i.amount) || 0), 0);
  
  const avgJobValue = paidYTD.length > 0 ? ytdRevenue / paidYTD.length : 0;
  
  // Quote win rate
  const allQuotes = jobs.filter(j => j.type === 'SAQ' && ['paid', 'lost'].includes(j.status));
  const wonQuotes = allQuotes.filter(j => j.status === 'paid');
  const winRate = allQuotes.length > 0 ? Math.round((wonQuotes.length / allQuotes.length) * 100) : 0;

  const cashForecast = outstanding + pipeline * 0.4;
  const gstThreshold = 75000;
  const gstPct = Math.min(100, Math.round((ytdRevenue / gstThreshold) * 100));
  
  return {
    ytdRevenue, outstanding, pipeline, thisMonth, ytdSupCosts,
    avgJobValue, winRate, cashForecast, gstPct, gstThreshold,
    paidCount: paidYTD.length, paidThisMonthCount: paidThisMonth.length,
    activeJobs: jobs.filter(j => !['paid', 'lost'].includes(j.status)).length,
    overdueCount: jobs.filter(j => j.status === 'overdue').length,
    pipelineCoverage: thisMonth > 0 ? (cashForecast / thisMonth).toFixed(1) : '—',
    takeHome: thisMonth * 0.785,
  };
}

// Monthly revenue for last 12 months (for charts)
export function monthlyRevenue(jobs = []) {
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const year = d.getFullYear();
    const month = d.getMonth();
    const label = d.toLocaleString('en-AU', { month: 'short', year: '2-digit' });
    const rev = jobs
      .filter(j => j.status === 'paid' && !((j.jobNumber || '').startsWith('SAQ')))
      .filter(j => {
        const pd = j.paidDate || j.createdAt;
        if (!pd) return false;
        const jd = new Date(pd + 'T00:00:00');
        return jd.getMonth() === month && jd.getFullYear() === year;
      })
      .reduce((s, j) => s + jobRevenue(j), 0);
    months.push({ label, rev, month, year });
  }
  return months;
}

// Top clients by revenue
export function topClients(jobs = [], clients = []) {
  const map = {};
  jobs.filter(j => j.status === 'paid' && !((j.jobNumber || '').startsWith('SAQ'))).forEach(j => {
    const cid = j.clientId;
    if (!map[cid]) map[cid] = { cid, jobs: 0, revenue: 0 };
    map[cid].jobs++;
    map[cid].revenue += jobRevenue(j);
  });
  return Object.values(map)
    .map(m => {
      const c = clients.find(x => x.id === m.cid) || {};
      return { ...m, name: c.company || c.contact || m.cid };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);
}

export function overdueEscalation(jobs = []) {
  return jobs.filter(j => ['invoiced', 'overdue'].includes(j.status) && j.invoiceDue && new Date(j.invoiceDue + 'T00:00:00') < new Date())
    .map(j => {
      const days = Math.floor((new Date() - new Date(j.invoiceDue + 'T00:00:00')) / 86400000);
      const tier = days >= 30 ? 3 : days >= 14 ? 2 : 1;
      return { ...j, daysOverdue: days, tier };
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue);
}
