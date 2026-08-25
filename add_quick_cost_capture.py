from pathlib import Path
p=Path('/home/ubuntu/sydneyautomationco-job-system/index.html')
s=p.read_text()

# Add quick actions to the two most-used screens.
s=s.replace("<button onclick=\"openModal('addExpense')\" style=\"background:#0f172a;color:#fff;border:none;border-radius:8px;padding:10px 20px;font-size:14px;font-weight:700;cursor:pointer\">+ Log Expense</button>", "<button onclick=\"openQuickCostCapture('expense')\" style=\"background:#6366f1;color:#fff;border:none;border-radius:8px;padding:10px 20px;font-size:14px;font-weight:700;cursor:pointer\">⚡ Quick Expense</button><button onclick=\"openModal('addExpense')\" style=\"background:#0f172a;color:#fff;border:none;border-radius:8px;padding:10px 20px;font-size:14px;font-weight:700;cursor:pointer\">+ Detailed Expense</button>", 1)
s=s.replace("<button onclick=\"document.getElementById('parts-tab').value='orders';renderMain()\" style=\"background:#7c3aed;color:#fff;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:600;cursor:pointer\">🧾 Supplier Orders</button>", "<button onclick=\"openQuickCostCapture('supplier')\" style=\"background:#f07020;color:#fff;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer\">⚡ Quick Supplier Invoice</button><button onclick=\"document.getElementById('parts-tab').value='orders';renderMain()\" style=\"background:#7c3aed;color:#fff;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:600;cursor:pointer\">🧾 Supplier Orders</button>", 1)

marker="// ─── ADD EXPENSE MODAL ────────────────────────────────────────────────────────\n"
insert=r'''// ─── QUICK COST CAPTURE ───────────────────────────────────────────────────────
// Fast path for routine entries: date, amount, description/reference, optional job,
// plus one attachment. Detailed forms remain available for unusual records.
function openQuickCostCapture(kind='expense'){
  const isSupplier=kind==='supplier';
  const jobOpts='<option value="">— No job link —</option>'+[...jobs].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(j=>`<option value="${j.id}">${j.jobNumber} — ${esc((gc(j.clientId)||{}).company||'')}</option>`).join('');
  const supplierList=(CFG.suppliers||[]);
  const supplierOpts=supplierList.map(x=>`<option value="${esc(x.name)}">`).join('');
  openModal('custom');
  document.getElementById('modal-title').textContent=isSupplier?'Quick Supplier Invoice':'Quick Expense';
  document.getElementById('modal-box').style.maxWidth='560px';
  document.getElementById('modal-body').innerHTML=`
    <div style="display:flex;gap:6px;background:#f1f5f9;border-radius:9px;padding:4px;margin-bottom:16px">
      <button onclick="openQuickCostCapture('expense')" style="flex:1;border:none;border-radius:7px;padding:8px;background:${!isSupplier?'#fff':'transparent'};box-shadow:${!isSupplier?'0 1px 3px rgba(0,0,0,.12)':'none'};font-weight:700;cursor:pointer">Expense</button>
      <button onclick="openQuickCostCapture('supplier')" style="flex:1;border:none;border-radius:7px;padding:8px;background:${isSupplier?'#fff':'transparent'};box-shadow:${isSupplier?'0 1px 3px rgba(0,0,0,.12)':'none'};font-weight:700;cursor:pointer">Supplier invoice</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div><label style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase">Date *</label><input id="qc-date" type="date" value="${today()}" style="${inputStyle}"></div>
      <div><label style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase">Amount incl. GST *</label><input id="qc-amount" type="number" step="0.01" min="0" autofocus style="${inputStyle};font-size:17px;font-weight:800" placeholder="0.00"></div>
    </div>
    ${isSupplier?`<div style="margin-top:10px"><label style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase">Supplier *</label><input id="qc-supplier" list="qc-suppliers" style="${inputStyle}" placeholder="Start typing supplier"><datalist id="qc-suppliers">${supplierOpts}</datalist></div>
      <div style="margin-top:10px"><label style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase">Invoice / reference</label><input id="qc-ref" style="${inputStyle}" placeholder="Supplier invoice number"></div>`
      :`<div style="margin-top:10px"><label style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase">What was bought? *</label><input id="qc-desc" style="${inputStyle}" placeholder="e.g. C-Bus relay, fuel, tools, parking"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px"><div><label style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase">Category</label><select id="qc-cat" style="${inputStyle};appearance:none">${EXP_CATS.map(c=>`<option value="${c.id}"${c.id==='cogs'?' selected':''}>${c.label}</option>`).join('')}</select></div><div><label style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase">Paid with</label><select id="qc-pay" style="${inputStyle};appearance:none">${EXP_PAY.map(x=>`<option value="${x.id}"${x.id==='business_card'?' selected':''}>${x.label}</option>`).join('')}</select></div></div>`}
    <div style="margin-top:10px"><label style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase">Link to job (optional)</label><select id="qc-job" style="${inputStyle};appearance:none">${jobOpts}</select></div>
    <div style="margin-top:10px"><label style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase">${isSupplier?'Notes':'Supplier / notes'}</label><input id="qc-notes" style="${inputStyle}" placeholder="Optional"></div>
    <div style="margin-top:14px;padding:12px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:8px"><label style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:#334155;cursor:pointer">📎 Attach receipt/invoice <input id="qc-file" type="file" accept="image/*,.pdf" style="display:none" onchange="quickCostFile(this)"></label><div id="qc-file-name" style="font-size:11px;color:#94a3b8;margin-top:5px">Optional — you can add it later</div></div>
    <button onclick="saveQuickCostCapture('${kind}')" style="width:100%;margin-top:16px;background:${isSupplier?'#f07020':'#6366f1'};color:#fff;border:none;border-radius:8px;padding:13px;font-size:14px;font-weight:800;cursor:pointer">✓ Save ${isSupplier?'Supplier Invoice':'Expense'}</button>`;
  window._quickCostFile=null;
  setTimeout(()=>document.getElementById('qc-amount')?.focus(),80);
}
function quickCostFile(input){
  const file=input.files?.[0]; if(!file)return;
  const reader=new FileReader(); reader.onload=e=>{window._quickCostFile={name:file.name,type:file.type,data:e.target.result};const el=document.getElementById('qc-file-name');if(el)el.textContent=file.name;}; reader.readAsDataURL(file);
}
function saveQuickCostCapture(kind){
  const amount=parseFloat(document.getElementById('qc-amount')?.value||0)||0;
  const date=document.getElementById('qc-date')?.value||today();
  const jobId=document.getElementById('qc-job')?.value||'';
  const notes=document.getElementById('qc-notes')?.value.trim()||'';
  if(!(amount>0)){alert('Enter a valid amount.');return;}
  if(kind==='supplier'){
    const supplier=document.getElementById('qc-supplier')?.value.trim()||'';
    if(!supplier){alert('Enter a supplier.');return;}
    const id='sinv_'+Date.now(); const r={id,jobId,supplier,ref:document.getElementById('qc-ref')?.value.trim()||'',date,amount,notes,costType:'parts',createdAt:new Date().toISOString()};
    if(window._quickCostFile){try{localStorage.setItem('sac:sinv:'+id,window._quickCostFile.data);}catch(e){} r.fileName=window._quickCostFile.name;r.fileType=window._quickCostFile.type;r.fileData=true;}
    window._supInvoices.push(r); saveSupInvoices();
    if(jobId&&!r.ref){const j=jobs.find(x=>x.id===jobId);if(j&&!j.supplierRef){j.supplierRef=supplier;save();}}
    showToast('Supplier invoice saved','success');
  } else {
    const desc=document.getElementById('qc-desc')?.value.trim()||'';
    if(!desc){alert('Enter what was bought.');return;}
    expenses.push({id:Date.now().toString(),date,description:desc,amount,taxCat:document.getElementById('qc-cat')?.value||'cogs',payMethod:document.getElementById('qc-pay')?.value||'business_card',jobId,notes,reimbursed:false,receiptData:window._quickCostFile?.data||null});
    save(); showToast('Expense saved','success');
  }
  window._quickCostFile=null; closeModal(); renderMain();
}

'''
if marker not in s: raise SystemExit('marker missing')
s=s.replace(marker,insert+marker,1)
p.write_text(s)
print('quick capture patch applied')
