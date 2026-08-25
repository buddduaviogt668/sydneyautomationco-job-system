from pathlib import Path

p = Path('/home/ubuntu/sydneyautomationco-job-system/index.html')
s = p.read_text()
anchor = "// ─── AGED DEBTORS ────────────────────────────────────────────────────────────\nfunction renderAgedDebtors(){"
insert = r'''// ─── FIRST-CLASS DEBTOR DISPLAY ENTRIES ───────────────────────────────────────
// A job can have an unpaid deposit and a separate unpaid balance invoice.
// Keep the job total unchanged, but expose the two receivable components in
// debtor views so collection and payment allocation are unambiguous.
function getDebtorEntries(){
  const out=[];
  (jobs||[]).filter(j=>['invoiced','overdue'].includes(j.status)).forEach(j=>{
    const dep=Math.max(0,Number(j.depositAmount)||0);
    const bal=Math.max(0,Number(j.invoiceAmount)>0 ? jobAmountDisplay(j) : 0);
    const depPaid=depositIsPaid(j);
    const jobPaid=j.status==='paid';
    const client=gc(j.clientId);
    if(dep>0 && !depPaid && !jobPaid){
      out.push({j,client,kind:'deposit',number:j.depositInvoiceNumber||('DEP — '+(j.invoiceNumber||j.jobNumber)),amount:dep,due:j.depositInvoiceDue||j.depositDue||j.invoiceDue||'',label:'Deposit'});
    }
    if(bal>0 && !jobPaid){
      out.push({j,client,kind:'balance',number:j.invoiceNumber||j.jobNumber,amount:bal,due:j.invoiceDue||'',label:dep>0?'Balance':'Invoice'});
    }
    if(dep<=0 && bal<=0){
      const fallback=Math.max(0,jobOutstanding(j));
      if(fallback>0) out.push({j,client,kind:'invoice',number:j.invoiceNumber||j.jobNumber,amount:fallback,due:j.invoiceDue||'',label:'Invoice'});
    }
  });
  return out;
}
function debtorDays(entry){
  return entry.due ? Math.floor((new Date()-new Date(entry.due+'T00:00:00'))/86400000) : 0;
}
function debtorBucket(entry){
  const days=debtorDays(entry);
  if(days<=0) return 'current';
  if(days<=30) return '1-30';
  if(days<=60) return '31-60';
  if(days<=90) return '61-90';
  return '90+';
}

function renderAgedDebtors(){
  const entries = getDebtorEntries();
  if(entries.length===0) return '';

'''
if anchor not in s:
    raise SystemExit('aged debtors anchor missing')
s = s.replace(anchor, insert, 1)
s = s.replace("  const bucket = (j) => {\n    if(!j.invoiceDue) return 'current';\n    const days = Math.floor((new Date()-new Date(j.invoiceDue+'T00:00:00'))/86400000);\n    if(days<=0) return 'current';\n    if(days<=30) return '1-30';\n    if(days<=60) return '31-60';\n    if(days<=90) return '61-90';\n    return '90+';\n  };\n\n", "  const bucket = debtorBucket;\n\n", 1)
s = s.replace("  const buckets = {'current':[],'1-30':[],'31-60':[],'61-90':[],'90+':[]};\n  overdue.forEach(j=>buckets[bucket(j)].push(j));", "  const buckets = {'current':[],'1-30':[],'31-60':[],'61-90':[],'90+':[]};\n  entries.forEach(e=>buckets[bucket(e)].push(e));", 1)
s = s.replace("  const total = overdue.reduce((s,j)=>s+jobOutstanding(j),0);", "  const total = entries.reduce((s,e)=>s+e.amount,0);", 1)
s = s.replace("${arr.length} invoice${arr.length!==1?'s':''}", "${arr.length} item${arr.length!==1?'s':''}", 1)
old = """      ${overdue.sort((a,b)=>(a.invoiceDue||'')>(b.invoiceDue||'')?1:-1).map(j=>{
        const c=gc(j.clientId);
        const days=j.invoiceDue?Math.floor((new Date()-new Date(j.invoiceDue+'T00:00:00'))/86400000):0;
        const bk=bucket(j);
        return `<div style=\"display:flex;align-items:center;gap:12px;padding:9px 16px;border-bottom:1px solid #f8fafc\" onmouseover=\"this.style.background='#f8fafc'\" onmouseout=\"this.style.background='transparent'\">
          <span style=\"background:${bColors[bk]};color:#fff;border-radius:4px;padding:2px 7px;font-size:10px;font-weight:700;min-width:60px;text-align:center\">${days>0?days+'d overdue':'Current'}</span>
          <div style=\"flex:1;min-width:0\">
            <div style=\"font-size:13px;font-weight:600;color:#0f172a\">${esc(c?.company||'—')}</div>
            <div style=\"font-size:11px;color:#94a3b8\">${j.invoiceNumber||j.jobNumber} · Due: ${fmtD(j.invoiceDue)||'not set'}</div>
          </div>
          <div style=\"text-align:right\">
            <div style=\"font-size:14px;font-weight:800;color:${bColors[bk]}\">${fmt$(jobOutstanding(j))}</div>
          </div>
          <div style=\"display:flex;gap:5px\">
            <button onclick=\"sendWhatsApp('${j.id}','chase')\" style=\"background:#25D366;color:#fff;border:none;border-radius:5px;padding:5px 8px;font-size:11px;font-weight:700;cursor:pointer\" title=\"Chase via WhatsApp\">💬</button>
            ${CFG.stripePaymentLinkBase?`<button onclick=\"openStripePaymentLink('${j.id}')\" style=\"background:#635bff;color:#fff;border:none;border-radius:5px;padding:5px 8px;font-size:11px;font-weight:700;cursor:pointer\" title=\"Open Stripe pay link\">💳</button>`:''}
            <button onclick=\"openJobDetail('${j.id}')\" style=\"background:#f1f5f9;border:1px solid #e2e8f0;border-radius:5px;padding:5px 8px;font-size:11px;font-weight:600;cursor:pointer;color:#334155\">View →</button>
          </div>
        </div>`;
      }).join('')}"""
new = """      ${entries.sort((a,b)=>(a.due||'')>(b.due||'')?1:-1).map(e=>{
        const j=e.j, c=e.client, days=debtorDays(e), bk=bucket(e);
        return `<div style=\"display:flex;align-items:center;gap:12px;padding:9px 16px;border-bottom:1px solid #f8fafc\" onmouseover=\"this.style.background='#f8fafc'\" onmouseout=\"this.style.background='transparent'\">
          <span style=\"background:${bColors[bk]};color:#fff;border-radius:4px;padding:2px 7px;font-size:10px;font-weight:700;min-width:60px;text-align:center\">${days>0?days+'d overdue':'Current'}</span>
          <div style=\"flex:1;min-width:0\">
            <div style=\"font-size:13px;font-weight:600;color:#0f172a\">${esc(c?.company||'—')}</div>
            <div style=\"font-size:11px;color:#94a3b8\">${esc(e.number)} · ${e.label} · Due: ${fmtD(e.due)||'not set'}</div>
          </div>
          <div style=\"text-align:right\"><div style=\"font-size:14px;font-weight:800;color:${bColors[bk]}\">${fmt$(e.amount)}</div></div>
          <div style=\"display:flex;gap:5px\">
            <button onclick=\"sendWhatsApp('${j.id}','chase')\" style=\"background:#25D366;color:#fff;border:none;border-radius:5px;padding:5px 8px;font-size:11px;font-weight:700;cursor:pointer\" title=\"Chase via WhatsApp\">💬</button>
            ${CFG.stripePaymentLinkBase?`<button onclick=\"openStripePaymentLink('${j.id}')\" style=\"background:#635bff;color:#fff;border:none;border-radius:5px;padding:5px 8px;font-size:11px;font-weight:700;cursor:pointer\" title=\"Open Stripe pay link\">💳</button>`:''}
            <button onclick=\"openJobDetail('${j.id}')\" style=\"background:#f1f5f9;border:1px solid #e2e8f0;border-radius:5px;padding:5px 8px;font-size:11px;font-weight:600;cursor:pointer;color:#334155\">View →</button>
          </div>
        </div>`;
      }).join('')}"""
if old not in s:
    raise SystemExit('aged debtors row block missing')
s = s.replace(old, new, 1)
old2 = """function printAgedDebtors(){
  const overdue = jobs.filter(j=>['invoiced','overdue'].includes(j.status) && jobOutstanding(j) > 0);
  const total = overdue.reduce((s,j)=>s+jobOutstanding(j),0);"""
new2 = """function printAgedDebtors(){
  const entries = getDebtorEntries();
  const total = entries.reduce((s,e)=>s+e.amount,0);"""
if old2 not in s:
    raise SystemExit('print debtors header missing')
s = s.replace(old2, new2, 1)
s = s.replace("${overdue.length} invoices outstanding", "${entries.length} items outstanding", 1)
old3 = """  ${overdue.sort((a,b)=>(a.invoiceDue||'')>(b.invoiceDue||'')?1:-1).map(j=>{
    const c=gc(j.clientId);
    const days=j.invoiceDue?Math.floor((new Date()-new Date(j.invoiceDue+'T00:00:00'))/86400000):0;
    const col=days>90?'#7f1d1d':days>60?'#991b1b':days>30?'#c2410c':days>0?'#d97706':'#166534';
    return `<tr><td><strong>${esc(c?.company||'—')}</strong>${c?.phone?`<br><span style=\"font-size:11px;color:#64748b\">${esc(c.phone)}</span>`:''}</td>
    <td style=\"font-family:monospace;font-size:12px\">${esc(j.invoiceNumber||j.jobNumber)}</td>
    <td>${fmtD(j.invoiceDue)||'—'}</td>
    <td><strong style=\"color:${col}\">${days>0?days+' days':'Current'}</strong></td>
    <td style=\"text-align:right;font-weight:800;color:${col}\">${fmt$(jobOutstanding(j))}</td>
    <td><span style=\"background:${col};color:#fff;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:700\">${days>90?'CRITICAL':days>60?'SERIOUS':days>30?'OVERDUE':days>0?'LATE':'CURRENT'}</span></td></tr>`;
  }).join('')}"""
new3 = """  ${entries.sort((a,b)=>(a.due||'')>(b.due||'')?1:-1).map(e=>{
    const c=e.client, days=debtorDays(e);
    const col=days>90?'#7f1d1d':days>60?'#991b1b':days>30?'#c2410c':days>0?'#d97706':'#166534';
    return `<tr><td><strong>${esc(c?.company||'—')}</strong>${c?.phone?`<br><span style=\"font-size:11px;color:#64748b\">${esc(c.phone)}</span>`:''}</td>
    <td style=\"font-family:monospace;font-size:12px\">${esc(e.number)} · ${e.label}</td>
    <td>${fmtD(e.due)||'—'}</td>
    <td><strong style=\"color:${col}\">${days>0?days+' days':'Current'}</strong></td>
    <td style=\"text-align:right;font-weight:800;color:${col}\">${fmt$(e.amount)}</td>
    <td><span style=\"background:${col};color:#fff;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:700\">${days>90?'CRITICAL':days>60?'SERIOUS':days>30?'OVERDUE':days>0?'LATE':'CURRENT'}</span></td></tr>`;
  }).join('')}"""
if old3 not in s:
    raise SystemExit('print debtors row block missing')
s = s.replace(old3, new3, 1)
p.write_text(s)
print('debtor entry patch applied')
