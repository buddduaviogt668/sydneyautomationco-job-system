from pathlib import Path

p = Path('/home/ubuntu/sydneyautomationco-job-system/index.html')
s = p.read_text()
anchor = "// ─── DASHBOARD ───────────────────────────────────────────────────────────────\nfunction renderDashboard(){"
insert = r'''// ─── NEXT-ACTION QUEUE ─────────────────────────────────────────────────────────
// Generate one actionable item per risk so the operator can work from a single
// daily queue instead of searching across separate screens.
function getNextActionItems(){
  const items=[];
  const todayStr=today();
  const add=(priority,title,detail,job,action)=>items.push({priority,title,detail,job,action});
  getDebtorEntries().filter(e=>e.due && e.due<todayStr).sort((a,b)=>b.amount-a.amount).slice(0,8).forEach(e=>{
    add('urgent','Collect overdue '+e.label,`${e.number} · ${fmt$(e.amount)} · due ${fmtD(e.due)}`,e.j,`openJobDetail('${e.j.id}')`);
  });
  jobs.filter(j=>['quoted','lead'].includes(j.status)).forEach(j=>{
    const age=j.createdAt?Math.floor((new Date()-new Date(j.createdAt+'T00:00:00'))/86400000):0;
    if(age>(CFG.quoteValidDays||30)) add('high','Follow up expired quote',`${j.jobNumber} · ${fmt$(Number(j.quoteAmount)||0)} · ${age} days old`,j,`openJobDetail('${j.id}')`);
  });
  jobs.filter(j=>['invoiced','overdue'].includes(j.status) && Number(j.invoiceAmount)>0 && !j.invoiceDue).slice(0,5).forEach(j=>{
    add('high','Set missing due date',`${j.invoiceNumber||j.jobNumber} · ${fmt$(jobAmountDisplay(j))}`,j,`openJobDetail('${j.id}')`);
  });
  jobs.filter(j=>['scheduled','completed','work_order'].includes(j.status) && !j.invoiceNumber && !j.balanceInvoiceRaisedAt).slice(0,5).forEach(j=>{
    add('high','Review job for invoicing',`${j.jobNumber} · ${fmt$(Number(j.quoteAmount)||0)}`,j,`openJobDetail('${j.id}')`);
  });
  jobs.filter(j=>j.scheduledDate && j.scheduledDate>=todayStr && !['paid','lost'].includes(j.status)).sort((a,b)=>a.scheduledDate.localeCompare(b.scheduledDate)).slice(0,4).forEach(j=>{
    add('normal','Prepare upcoming job',`${j.jobNumber} · ${fmtD(j.scheduledDate)}`,j,`openJobDetail('${j.id}')`);
  });
  const rank={urgent:0,high:1,normal:2};
  return items.sort((a,b)=>rank[a.priority]-rank[b.priority]).slice(0,10);
}
function renderNextActionQueue(){
  const items=getNextActionItems();
  if(!items.length) return `<div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:14px 18px;margin-bottom:16px;color:#065f46;font-weight:700">✓ No urgent next actions — your workflow is clear.</div>`;
  const colors={urgent:'#dc2626',high:'#f59e0b',normal:'#2563eb'};
  return `<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:16px">
    <div style="background:#0f172a;padding:12px 18px;display:flex;align-items:center;justify-content:space-between">
      <div style="font-size:13px;font-weight:800;color:#fff">🎯 Next Actions — ${items.length} items</div>
      <span style="font-size:11px;color:#94a3b8">Work from the top</span>
    </div>
    <div>${items.map((x,i)=>`<div style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid #f8fafc">
      <span style="width:8px;height:8px;border-radius:50%;background:${colors[x.priority]};flex-shrink:0"></span>
      <div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:800;color:#0f172a">${i+1}. ${esc(x.title)}</div><div style="font-size:11px;color:#64748b;margin-top:2px">${esc(x.detail)}</div></div>
      <button onclick="${x.action}" style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;padding:5px 9px;font-size:11px;font-weight:700;color:#334155;cursor:pointer">Open →</button>
    </div>`).join('')}</div>`;
}

function renderDashboard(){'''
if anchor not in s:
    raise SystemExit('dashboard anchor missing')
s=s.replace(anchor,insert,1)
needle="    </div>\n\n    <!-- AI SMART ALERT BANNER -->"
replacement="    </div>\n\n    ${renderNextActionQueue()}\n\n    <!-- AI SMART ALERT BANNER -->"
if needle not in s:
    raise SystemExit('dashboard stats insertion point missing')
s=s.replace(needle,replacement,1)
p.write_text(s)
print('next action queue patch applied')
