from pathlib import Path
p=Path('/home/ubuntu/sydneyautomationco-job-system/index.html')
s=p.read_text()

# Add configurable planning defaults beside income targets.
old="  incomeMin:60000, incomeComfort:90000, incomeStretch:120000,\n"
new="""  incomeMin:60000, incomeComfort:90000, incomeStretch:120000,
  businessStructure:'sole_trader',
  taxReserveRate:0.30,
  retirementReserveRate:0.115,
  ownerDrawMonthly:6000,
"""
if old not in s: raise SystemExit('income defaults anchor missing')
s=s.replace(old,new,1)

# Add calculation helpers before dynamic pricing helpers.
anchor="// ─── DYNAMIC PRICING HELPERS ─────────────────────────────────────────────────\n"
helpers=r'''// ─── SOLE-TRADER CASH PLANNING HELPERS ───────────────────────────────────────
function gstComponentInclusive(amount){ const rate=Number(CFG.gst||0.1); return CFG.gstRegistered===false?0:(Number(amount)||0)*rate/(1+rate); }
function _planningMonthKey(){ return new Date().toISOString().slice(0,7); }
function soleTraderPlanning(){
  const m=_planningMonthKey();
  const paidMonth=jobs.filter(j=>j.status==='paid' && (j.paidDate||'').startsWith(m));
  const cashCollected=paidMonth.reduce((s,j)=>s+jobRevenue(j),0);
  const gstOnSales=gstComponentInclusive(cashCollected);
  const expenseMonth=expenses.filter(e=>(e.date||'').startsWith(m)).reduce((s,e)=>s+(Number(e.amount)||0),0);
  const gstOnExpenses=expenses.filter(e=>(e.date||'').startsWith(m) && e.taxCat!=='other').reduce((s,e)=>s+gstComponentInclusive(e.amount),0);
  const gstReserve=Math.max(0,gstOnSales-gstOnExpenses);
  const operatingCosts=expenseMonth+overheadMonthlyTotal();
  const cashExGst=Math.max(0,cashCollected-gstReserve);
  const estimatedProfit=Math.max(0,cashExGst-operatingCosts);
  const taxReserve=estimatedProfit*(Number(CFG.taxReserveRate)||0.30);
  const drawTarget=Number(CFG.ownerDrawMonthly||CFG.payGross||6000);
  const retirementReserve=drawTarget*(Number(CFG.retirementReserveRate)||0.115);
  const availableAfterReserves=Math.max(0,cashCollected-gstReserve-expenseMonth-overheadMonthlyTotal()-taxReserve-retirementReserve);
  const weeksElapsed=Math.max(1,Math.min(4.333,new Date().getDate()/7));
  const safeWeekly=Math.max(0,Math.min(drawTarget/4.333,availableAfterReserves/weeksElapsed));
  return {month:m,cashCollected,gstOnSales,gstOnExpenses,gstReserve,expenseMonth,operatingCosts,cashExGst,estimatedProfit,taxReserve,drawTarget,retirementReserve,availableAfterReserves,safeWeekly};
}
'''
if anchor not in s: raise SystemExit('pricing anchor missing')
s=s.replace(anchor,helpers+'\n'+anchor,1)

# Update break-even from compulsory super semantics to optional retirement reserve.
s=s.replace("const superRate = (Number(CFG.superRate)||11.5)/100;\n  const superAmt = wage * superRate;\n  const totalFixed = ohMonthly + wage + superAmt;", "const retirementRate = (Number(CFG.retirementReserveRate)||11.5)/100;\n  const retirementAmt = wage * retirementRate;\n  const totalFixed = ohMonthly + wage + retirementAmt;",1)
s=s.replace("overheads + monthly drawings + super", "overheads + owner drawings + optional retirement reserve",1)
s=s.replace("Overheads <strong style=\"color:#0f172a\">${fmt$(ohMonthly)}</strong> + Gross pay <strong style=\"color:#0f172a\">${fmt$(wage)}</strong> + Super <strong style=\"color:#0f172a\">${fmt$(superAmt)}</strong>", "Overheads <strong style=\"color:#0f172a\">${fmt$(ohMonthly)}</strong> + Owner drawings <strong style=\"color:#0f172a\">${fmt$(wage)}</strong> + Optional retirement reserve <strong style=\"color:#0f172a\">${fmt$(retirementAmt)}</strong>",1)

# Add planning card after GST threshold comment.
marker="    <!-- GST THRESHOLD -->\n"
card=r'''    <!-- SOLE-TRADER CASH PLANNING -->
    ${(()=>{const P=soleTraderPlanning(); return `<div style="background:#fff;border:1px solid #c7d2fe;border-radius:12px;padding:20px 24px;margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">
        <div><div style="font-size:16px;font-weight:800;color:#1e1b4b">Sole-Trader Cash Plan</div><div style="font-size:11px;color:#64748b;margin-top:3px">Current month · management estimate, not a lodged tax result</div></div>
        <div style="background:#eef2ff;color:#3730a3;border-radius:8px;padding:7px 10px;font-size:11px;font-weight:800">30% tax reserve · 11.5% retirement reserve</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:16px">
        <div style="background:#f8fafc;border-radius:9px;padding:12px"><div style="font-size:10px;color:#64748b;text-transform:uppercase;font-weight:800">GST to reserve</div><div style="font-size:21px;font-weight:900;color:#2563eb;margin-top:4px">${fmt$(P.gstReserve)}</div><div style="font-size:10px;color:#94a3b8">sales GST less estimated credits</div></div>
        <div style="background:#fff7ed;border-radius:9px;padding:12px"><div style="font-size:10px;color:#9a3412;text-transform:uppercase;font-weight:800">Tax reserve</div><div style="font-size:21px;font-weight:900;color:#ea580c;margin-top:4px">${fmt$(P.taxReserve)}</div><div style="font-size:10px;color:#9a3412">30% of estimated profit</div></div>
        <div style="background:#f5f3ff;border-radius:9px;padding:12px"><div style="font-size:10px;color:#6d28d9;text-transform:uppercase;font-weight:800">Retirement reserve</div><div style="font-size:21px;font-weight:900;color:#7c3aed;margin-top:4px">${fmt$(P.retirementReserve)}</div><div style="font-size:10px;color:#6d28d9">optional monthly target</div></div>
        <div style="background:#ecfdf5;border-radius:9px;padding:12px"><div style="font-size:10px;color:#166534;text-transform:uppercase;font-weight:800">Safe draw this week</div><div style="font-size:21px;font-weight:900;color:#059669;margin-top:4px">${fmt$(P.safeWeekly)}</div><div style="font-size:10px;color:#166534">target cap ${fmt$(P.drawTarget*12/52)}/week</div></div>
      </div>
      <div style="margin-top:12px;background:#f8fafc;border-radius:8px;padding:10px 12px;font-size:11px;color:#475569;line-height:1.6">The safe-draw figure is capped by your $${fmt$(P.drawTarget)}/month owner-drawing target and reduced by estimated GST, recorded expenses, recurring overhead, tax reserve, and optional retirement reserve. Keep the underlying calculation separate from your accountant’s final tax position.</div>
    </div>`})()}
'''
if marker not in s: raise SystemExit('GST marker missing')
s=s.replace(marker,card+marker,1)

# Add settings controls under income targets.
marker2="    <!-- DOCUMENTS & TEMPLATES -->\n"
settings=r'''    <!-- SOLE-TRADER PLANNING SETTINGS -->
    <div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:12px;margin-bottom:20px;padding:20px">
      <div style="font-size:15px;font-weight:800;color:#1e1b4b;margin-bottom:4px">Sole-Trader Planning</div>
      <div style="font-size:11px;color:#4338ca;margin-bottom:14px">These are management reserves, not payroll or lodged tax calculations.</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
        <div><label style="display:block;font-size:11px;font-weight:800;color:#3730a3;text-transform:uppercase;margin-bottom:5px">Tax reserve %</label><input id="cfg-taxReserveRate" type="number" step="0.5" value="${((CFG.taxReserveRate||0.30)*100).toFixed(1)}" style="${inputStyle}"><div style="font-size:10px;color:#6366f1;margin-top:3px">Applied to estimated profit</div></div>
        <div><label style="display:block;font-size:11px;font-weight:800;color:#3730a3;text-transform:uppercase;margin-bottom:5px">Retirement reserve %</label><input id="cfg-retirementReserveRate" type="number" step="0.5" value="${((CFG.retirementReserveRate||0.115)*100).toFixed(1)}" style="${inputStyle}"><div style="font-size:10px;color:#6366f1;margin-top:3px">Optional sole-trader reserve</div></div>
        <div><label style="display:block;font-size:11px;font-weight:800;color:#3730a3;text-transform:uppercase;margin-bottom:5px">Monthly owner drawings</label><input id="cfg-ownerDrawMonthly" type="number" step="100" value="${CFG.ownerDrawMonthly||6000}" style="${inputStyle}"><div style="font-size:10px;color:#6366f1;margin-top:3px">Target only; safe draw may be lower</div></div>
      </div>
    </div>
'''
if marker2 not in s: raise SystemExit('documents marker missing')
s=s.replace(marker2,settings+marker2,1)

# Persist settings.
old2="  CFG.incomeStretch = gn('cfg-incomeStretch') || CFG.incomeStretch;\n"
new2="""  CFG.incomeStretch = gn('cfg-incomeStretch') || CFG.incomeStretch;
  if(gn('cfg-taxReserveRate')!=null) CFG.taxReserveRate = gn('cfg-taxReserveRate')/100;
  if(gn('cfg-retirementReserveRate')!=null) CFG.retirementReserveRate = gn('cfg-retirementReserveRate')/100;
  if(gn('cfg-ownerDrawMonthly')!=null) CFG.ownerDrawMonthly = gn('cfg-ownerDrawMonthly');
"""
if old2 not in s: raise SystemExit('settings save anchor missing')
s=s.replace(old2,new2,1)

p.write_text(s)
print('patched',p)
