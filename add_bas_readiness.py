from pathlib import Path
p=Path('/home/ubuntu/sydneyautomationco-job-system/index.html')
s=p.read_text()

old="  businessStructure:'sole_trader',\n"
new="  businessStructure:'sole_trader',\n  payrollMode:'owner_drawings',\n"
if old not in s: raise SystemExit('businessStructure default anchor missing')
s=s.replace(old,new,1)

anchor="function renderPayroll(){\n"
helpers=r'''function basQuarterForDate(d){
  const dt=d instanceof Date?d:new Date(d||new Date());
  const fyStart=dt.getMonth()>=6?dt.getFullYear():dt.getFullYear()-1;
  const q=dt.getMonth()>=6&&dt.getMonth()<=8?1:dt.getMonth()>=9&&dt.getMonth()<=11?2:dt.getMonth()<=2?3:4;
  const starts={1:`${fyStart}-07-01`,2:`${fyStart}-10-01`,3:`${fyStart+1}-01-01`,4:`${fyStart+1}-04-01`};
  const ends={1:`${fyStart}-09-30`,2:`${fyStart}-12-31`,3:`${fyStart+1}-03-31`,4:`${fyStart+1}-06-30`};
  return {fyStart,q,start:starts[q],end:ends[q],label:`Q${q} FY${String(fyStart).slice(-2)}/${String(fyStart+1).slice(-2)}`};
}
function calcBASDraft(){
  const q=basQuarterForDate(new Date());
  const inRange=d=>d&&d>=q.start&&d<=q.end;
  const cashSales=jobs.filter(j=>j.status==='paid'&&inRange(j.paidDate)).reduce((s,j)=>s+jobRevenue(j),0);
  const expenseRows=(expenses||[]).filter(e=>inRange(e.date));
  const supplierRows=(window._supInvoices||[]).filter(e=>inRange(e.date||e.invoiceDate));
  const expenseGross=expenseRows.reduce((s,e)=>s+Number(e.amount||0),0);
  const supplierGross=supplierRows.reduce((s,e)=>s+Number(e.amount||0),0);
  const purchasesGross=expenseGross+supplierGross;
  const salesGST=gstComponentInclusive(cashSales);
  const inputGST=gstComponentInclusive(expenseGross)+gstComponentInclusive(supplierGross);
  const mode=CFG.payrollMode||((CFG.businessStructure||'sole_trader')==='sole_trader'?'owner_drawings':'employee_payroll');
  const payRows=(CFG.payRuns||[]).filter(r=>inRange(r.date));
  const ownerDrawings=payRows.reduce((s,r)=>s+Number(r.gross||r.net||0),0);
  const w1=mode==='employee_payroll'?ownerDrawings:0;
  const w2=mode==='employee_payroll'?payRows.reduce((s,r)=>s+Number(r.tax||0),0):0;
  const w3=0,w4=0,w5=w2+w3+w4;
  return {q,cashSales,expenseGross,supplierGross,purchasesGross,salesGST,inputGST,netGST:salesGST-inputGST,mode,payRows,ownerDrawings,w1,w2,w3,w4,w5};
}
function setPayrollMode(mode){ CFG.payrollMode=mode; saveCFG(); renderMain(); }
function exportBASDraft(){
  const b=calcBASDraft();
  const rows=[['Sydney Automation Co. — BAS Draft (review only)'],['Period',b.q.start,b.q.end],['Basis','Cash basis estimate — confirm accounting basis'],[],['Label','Amount','Source / note'],['G1 Total sales',b.cashSales,'Paid jobs in period'],['1A GST on sales',b.salesGST,'GST-inclusive estimate'],['G10 Purchases',b.purchasesGross,'Logged expenses + supplier invoices'],['1B GST on purchases',b.inputGST,'GST-inclusive estimate'],['Net GST payable/refund',b.netGST,'1A less 1B'],['W1 Salary/wages',b.w1,b.mode==='owner_drawings'?'Owner drawings excluded':'Logged pay runs'],['W2 PAYG withheld',b.w2,b.mode==='owner_drawings'?'Owner drawings excluded':'Logged PAYG'],['W3 Other withholding',b.w3,'No records'],['W4 No-ABN withholding',b.w4,'No records'],['W5 Total withheld',b.w5,'W2 + W3 + W4'],['Owner drawings logged',b.ownerDrawings,'Not a wage for sole-trader BAS treatment']];
  const csv=rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='SydneyAutomation_BAS_Draft_'+b.q.start+'_'+b.q.end+'.csv';a.click();
}
function renderBASDraftPanel(){
  const b=calcBASDraft();
  const sole=b.mode==='owner_drawings';
  return `<div style="background:#fff;border:1px solid #bfdbfe;border-radius:12px;padding:18px 20px;margin-bottom:20px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">
      <div><div style="font-size:16px;font-weight:800;color:#0f172a">BAS Preparation — ${b.q.label}</div><div style="font-size:11px;color:#64748b;margin-top:3px">${b.q.start} to ${b.q.end} · cash-basis management draft · <strong>not lodged</strong></div></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap"><button onclick="exportBASDraft()" style="background:#1d4ed8;color:#fff;border:none;border-radius:7px;padding:8px 11px;font-size:11px;font-weight:800;cursor:pointer">⬇ Export BAS Draft</button><button onclick="aiAsk('Review my BAS draft for ${b.q.label}. List the documents and accountant checks still required. Do not lodge it.')" style="background:#e0e7ff;color:#3730a3;border:none;border-radius:7px;padding:8px 11px;font-size:11px;font-weight:800;cursor:pointer">✦ BAS Review Checklist</button></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:9px;margin-top:15px">
      <div style="background:#eff6ff;border-radius:8px;padding:11px"><div style="font-size:10px;color:#1d4ed8;font-weight:800;text-transform:uppercase">G1 Sales</div><div style="font-size:19px;font-weight:900;margin-top:4px">${fmt$(b.cashSales)}</div><div style="font-size:10px;color:#64748b">paid jobs</div></div>
      <div style="background:#eef2ff;border-radius:8px;padding:11px"><div style="font-size:10px;color:#3730a3;font-weight:800;text-transform:uppercase">1A GST sales</div><div style="font-size:19px;font-weight:900;margin-top:4px">${fmt$(b.salesGST)}</div><div style="font-size:10px;color:#64748b">estimated</div></div>
      <div style="background:#f8fafc;border-radius:8px;padding:11px"><div style="font-size:10px;color:#475569;font-weight:800;text-transform:uppercase">G10 Purchases</div><div style="font-size:19px;font-weight:900;margin-top:4px">${fmt$(b.purchasesGross)}</div><div style="font-size:10px;color:#64748b">logged records</div></div>
      <div style="background:#f0fdf4;border-radius:8px;padding:11px"><div style="font-size:10px;color:#15803d;font-weight:800;text-transform:uppercase">1B GST credits</div><div style="font-size:19px;font-weight:900;margin-top:4px">${fmt$(b.inputGST)}</div><div style="font-size:10px;color:#64748b">estimated</div></div>
      <div style="background:${b.netGST>=0?'#fff7ed':'#ecfdf5'};border-radius:8px;padding:11px"><div style="font-size:10px;color:${b.netGST>=0?'#c2410c':'#15803d'};font-weight:800;text-transform:uppercase">Net GST</div><div style="font-size:19px;font-weight:900;margin-top:4px">${fmt$(b.netGST)}</div><div style="font-size:10px;color:#64748b">before adjustments</div></div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:13px;padding-top:12px;border-top:1px solid #e2e8f0">
      <div style="font-size:11px;color:#475569"><strong>Payroll treatment:</strong> ${sole?'sole-trader owner drawings — excluded from W1/W2':'employee-style pay runs — included in W1/W2'} · Logged drawings/pay runs this quarter: <strong>${fmt$(b.ownerDrawings)}</strong></div>
      <div style="display:flex;gap:5px"><button onclick="setPayrollMode('owner_drawings')" style="border:1px solid ${sole?'#2563eb':'#cbd5e1'};background:${sole?'#dbeafe':'#fff'};color:#1d4ed8;border-radius:6px;padding:6px 8px;font-size:10px;font-weight:800;cursor:pointer">Sole trader drawings</button><button onclick="setPayrollMode('employee_payroll')" style="border:1px solid ${!sole?'#2563eb':'#cbd5e1'};background:${!sole?'#dbeafe':'#fff'};color:#1d4ed8;border-radius:6px;padding:6px 8px;font-size:10px;font-weight:800;cursor:pointer">Employee payroll</button></div>
    </div>
    <div style="margin-top:11px;background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:9px 11px;font-size:10px;color:#92400e;line-height:1.5"><strong>Draft control:</strong> This panel is a reconciliation aid, not an ATO lodgement. Confirm cash/accrual basis, GST tax codes, supplier invoices, BAS period, PAYG status, and any adjustments with your registered tax or BAS agent before filing.</div>
  </div>`;
}
'''
if anchor not in s: raise SystemExit('renderPayroll anchor missing')
s=s.replace(anchor,helpers+'\n'+anchor,1)

# Render BAS panel immediately under payroll header before the pay settings bar.
needle="    <!-- PAY SETTINGS BAR -->\n"
if needle not in s: raise SystemExit('pay settings marker missing')
s=s.replace(needle,"    ${renderBASDraftPanel()}\n"+needle,1)

p.write_text(s)
print('patched',p)
