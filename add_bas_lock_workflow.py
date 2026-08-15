from pathlib import Path
p=Path('/home/ubuntu/sydneyautomationco-job-system/index.html')
s=p.read_text()

# Add persistent BAS workflow containers to defaults.
old="  payrollMode:'owner_drawings',\n"
new="  payrollMode:'owner_drawings',\n  basPeriods:{},\n  basAdjustments:[],\n"
if old not in s: raise SystemExit('payrollMode default anchor missing')
s=s.replace(old,new,1)

# Preserve the existing arithmetic as a base calculation.
old2="function calcBASDraft(){\n"
new2="function calcBASDraftBase(){\n"
if old2 not in s: raise SystemExit('calcBASDraft anchor missing')
s=s.replace(old2,new2,1)

# Insert workflow helpers before setPayrollMode.
anchor="function setPayrollMode(mode){ CFG.payrollMode=mode; saveCFG(); renderMain(); }\n"
workflow=r'''function basPeriodKey(q){ return `${q.start}_${q.end}`; }
function basPeriodRecord(q){
  if(!CFG.basPeriods) CFG.basPeriods={};
  const key=basPeriodKey(q);
  if(!CFG.basPeriods[key]) CFG.basPeriods[key]={key,start:q.start,end:q.end,label:q.label,status:'draft',reviews:[],events:[],adjustmentIds:[]};
  return CFG.basPeriods[key];
}
function basActor(){ return CFG.accountantName||CFG.bizName||'Sydney Automation Co. user'; }
function basEvent(period,type,details){
  if(!period.events) period.events=[];
  period.events.push({id:Date.now().toString()+Math.random().toString(36).slice(2,7),at:new Date().toISOString(),actor:basActor(),type,details:details||''});
}
function basStatusLabel(status){ return {draft:'Draft',review_requested:'Review requested',approved:'Approved',locked:'Locked'}[status]||'Draft'; }
function calcBASDraft(){
  const base=calcBASDraftBase();
  const period=basPeriodRecord(base.q);
  const adjustments=(CFG.basAdjustments||[]).filter(a=>a.periodKey===period.key && a.status!=='void');
  const locked=period.status==='locked' && period.snapshot;
  if(locked) return {...period.snapshot, q:base.q, mode:base.mode, period, locked:true, adjustments};
  const adj=adjustments.reduce((o,a)=>{ const k=a.field; o[k]=(o[k]||0)+Number(a.amount||0); return o; },{});
  const result={...base,
    cashSales:base.cashSales+(adj.G1||0),
    salesGST:base.salesGST+(adj['1A']||0),
    purchasesGross:base.purchasesGross+(adj.G10||0),
    inputGST:base.inputGST+(adj['1B']||0),
    w1:base.w1+(adj.W1||0), w2:base.w2+(adj.W2||0), w3:base.w3+(adj.W3||0), w4:base.w4+(adj.W4||0)
  };
  result.netGST=result.salesGST-result.inputGST; result.w5=result.w2+result.w3+result.w4;
  return {...result,period,locked:false,adjustments};
}
function basSnapshot(b){
  const keys=['cashSales','expenseGross','supplierGross','purchasesGross','salesGST','inputGST','netGST','mode','ownerDrawings','w1','w2','w3','w4','w5'];
  const o={}; keys.forEach(k=>o[k]=b[k]); return o;
}
function basPromptActor(){ return prompt('Enter reviewer / operator name:',CFG.accountantName||'')||basActor(); }
function requestBASReview(){
  const b=calcBASDraft(), p=b.period; if(p.status==='locked'){alert('This BAS period is locked. Unlock it with a documented reason before requesting another review.');return;}
  const actor=basPromptActor(); const notes=prompt('Review request notes (optional):','Please review BAS draft and source documents.')||'';
  p.status='review_requested'; p.reviews=p.reviews||[]; p.reviews.push({at:new Date().toISOString(),actor,status:'requested',notes}); basEvent(p,'review_requested',notes); CFG.accountantName=actor; saveCFG(); renderMain();
}
function approveAndLockBAS(){
  const b=calcBASDraft(), p=b.period; if(p.status==='locked'){alert('This BAS period is already locked.');return;}
  const actor=basPromptActor(); const notes=prompt('Enter accountant approval notes. This will freeze the BAS snapshot:','Reviewed source records and adjustments.')||'';
  if(!confirm(`Lock ${p.label} as reviewed? The BAS values will be frozen until a documented unlock.`)) return;
  p.status='locked'; p.lockedAt=new Date().toISOString(); p.lockedBy=actor; p.snapshot=basSnapshot(b); p.reviews=p.reviews||[]; p.reviews.push({at:new Date().toISOString(),actor,status:'approved_and_locked',notes}); basEvent(p,'period_locked',notes); CFG.accountantName=actor; saveCFG(); renderMain();
}
function unlockBASPeriod(){
  const b=calcBASDraft(), p=b.period; if(p.status!=='locked'){alert('This BAS period is not locked.');return;}
  const actor=basPromptActor(); const reason=prompt('Document the reason for unlocking this BAS period:','Correction required after accountant review.'); if(!reason) return;
  if(!confirm(`Unlock ${p.label}? This creates a permanent audit event.`)) return;
  p.status='draft'; p.unlockedAt=new Date().toISOString(); p.unlockedBy=actor; p.unlockReason=reason; basEvent(p,'period_unlocked',reason); p.snapshot=null; CFG.accountantName=actor; saveCFG(); renderMain();
}
function addBASAdjustment(){
  const b=calcBASDraft(), p=b.period; if(p.status==='locked'){alert('Locked BAS periods are read-only. Unlock with a documented reason before adding an adjustment.');return;}
  const field=prompt('BAS field to adjust: G1, 1A, G10, 1B, W1, W2, W3 or W4','1B'); if(!field || !['G1','1A','G10','1B','W1','W2','W3','W4'].includes(field.toUpperCase())){alert('Use one of: G1, 1A, G10, 1B, W1, W2, W3 or W4.');return;}
  const amount=Number(prompt(`Adjustment amount for ${field.toUpperCase()} (use negative for a reduction):`,'0')); if(!Number.isFinite(amount)||amount===0)return;
  const reason=prompt('Reason and supporting document reference:','Accountant adjustment — source document ref:'); if(!reason)return;
  const actor=basPromptActor(); const a={id:Date.now().toString(),periodKey:p.key,field:field.toUpperCase(),amount,reason,actor,createdAt:new Date().toISOString(),status:'active'};
  if(!CFG.basAdjustments) CFG.basAdjustments=[]; CFG.basAdjustments.push(a); p.adjustmentIds=p.adjustmentIds||[]; p.adjustmentIds.push(a.id); basEvent(p,'adjustment_added',`${a.field} ${amount}: ${reason}`); CFG.accountantName=actor; saveCFG(); renderMain();
}
function voidBASAdjustment(id){
  const a=(CFG.basAdjustments||[]).find(x=>x.id===id); if(!a)return; const p=basPeriodRecord(basQuarterForDate(new Date(a.createdAt))); if(p.status==='locked'){alert('Locked BAS periods are read-only. Unlock the period before voiding an adjustment.');return;} const reason=prompt('Reason for voiding this adjustment:'); if(!reason)return; a.status='void'; a.voidedAt=new Date().toISOString(); a.voidedBy=basActor(); a.voidReason=reason; basEvent(p,'adjustment_voided',`${a.field} ${a.amount}: ${reason}`); saveCFG(); renderMain();
}
'''
if anchor not in s: raise SystemExit('setPayrollMode anchor missing')
s=s.replace(anchor,workflow+'\n'+anchor,1)

# Add review controls and history to the BAS panel before the draft-control warning.
needle="    <div style=\"margin-top:11px;background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:9px 11px;font-size:10px;color:#92400e;line-height:1.5\"><strong>Draft control:</strong>"
insert=r'''    <div style="margin-top:13px;padding-top:12px;border-top:1px solid #e2e8f0">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><div style="font-size:11px;color:#475569"><strong>Period status:</strong> <span style="background:${b.locked?'#fee2e2':b.period.status==='review_requested'?'#fef3c7':'#dcfce7'};color:${b.locked?'#991b1b':b.period.status==='review_requested'?'#92400e':'#166534'};padding:4px 8px;border-radius:10px;font-weight:800">${b.locked?'🔒 Locked':basStatusLabel(b.period.status)}</span>${b.period.lockedAt?` · locked ${fmtD(b.period.lockedAt)}`:''}</div><div style="display:flex;gap:5px;flex-wrap:wrap">${!b.locked?`<button onclick="addBASAdjustment()" style="background:#fff;border:1px solid #64748b;color:#334155;border-radius:6px;padding:6px 8px;font-size:10px;font-weight:800;cursor:pointer">+ Log adjustment</button><button onclick="requestBASReview()" style="background:#fef3c7;border:1px solid #f59e0b;color:#92400e;border-radius:6px;padding:6px 8px;font-size:10px;font-weight:800;cursor:pointer">Request accountant review</button><button onclick="approveAndLockBAS()" style="background:#166534;border:none;color:#fff;border-radius:6px;padding:6px 8px;font-size:10px;font-weight:800;cursor:pointer">Approve &amp; lock period</button>`:`<button onclick="unlockBASPeriod()" style="background:#fee2e2;border:1px solid #ef4444;color:#991b1b;border-radius:6px;padding:6px 8px;font-size:10px;font-weight:800;cursor:pointer">Unlock with reason</button>`}</div></div>
      ${b.adjustments.length?`<div style="margin-top:9px;font-size:10px;color:#475569"><strong>Adjustment log:</strong> ${b.adjustments.map(a=>`<span style="display:inline-flex;align-items:center;gap:4px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:5px;padding:4px 6px;margin:3px 3px 0 0"><strong>${a.field}</strong> ${a.amount>=0?'+':''}${fmt$(a.amount)} · ${esc(a.reason)}${!b.locked?` <button onclick="voidBASAdjustment('${a.id}')" style="border:0;background:none;color:#dc2626;cursor:pointer;font-weight:800">×</button>`:''}</span>`).join('')}</div>`:''}
      ${((b.period.events||[]).length)?`<details style="margin-top:9px"><summary style="font-size:10px;color:#475569;font-weight:800;cursor:pointer">Review history (${b.period.events.length} events)</summary><div style="margin-top:6px;max-height:130px;overflow:auto">${[...(b.period.events||[])].reverse().map(e=>`<div style="font-size:10px;color:#64748b;padding:5px 0;border-bottom:1px solid #f1f5f9"><strong>${esc(e.type.replaceAll('_',' '))}</strong> · ${esc(e.actor)} · ${fmtD(e.at)}<br>${esc(e.details||'')}</div>`).join('')}</div></details>`:''}
    </div>
'''
if needle not in s: raise SystemExit('draft control needle missing')
s=s.replace(needle,insert+needle,1)

# Block adding pay runs to a locked BAS period.
old3="function savePayRun(){\n  const run = {"
new3="function savePayRun(){\n  const selectedDate=document.getElementById('pr-date')?.value||today();\n  const lockedPayPeriod=basPeriodRecord(basQuarterForDate(new Date(selectedDate))).status==='locked';\n  if(lockedPayPeriod){ alert('This BAS period is locked. Unlock it with a documented reason before adding or changing pay-run records in the period.'); return; }\n  const run = {"
if old3 not in s: raise SystemExit('savePayRun anchor missing')
s=s.replace(old3,new3,1)

p.write_text(s)
print('patched',p)
