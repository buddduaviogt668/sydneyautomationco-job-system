from pathlib import Path

p = Path('/home/ubuntu/sydneyautomationco-job-system/index.html')
s = p.read_text()

repls = [
(
'''  // Revenue invoiced this month — uses invoiceAmount (not jobRevenue, which only counts paid)\n  // SAI jobs with an invoiceDate in this month → sum their invoiceAmount (or quoteAmount if no invoice yet)\n  const mthInvoiced = jobs\n    .filter(j=>j.type==='SAI' && (j.invoiceDate||j.createdAt||'')>=mStart && (j.invoiceDate||j.createdAt||'')<=mEnd)\n    .reduce((s,j)=>s + (Number(j.invoiceAmount)||Number(j.amountDue)||Number(j.quoteAmount)||0), 0);''',
'''  // Revenue invoiced this month. Balance and deposit invoices are separate components\n  // of one job; each is counted only when its own invoice date is recorded.\n  const mthInvoiced = jobs.reduce((sum,j)=>{\n    if(j.type!=='SAI') return sum;\n    const invDate = j.invoiceDate || j.createdAt || '';\n    const balance = (invDate>=mStart && invDate<=mEnd)\n      ? (Number(j.invoiceAmount)||Number(j.amountDue)||0) : 0;\n    const depDate = j.depositInvoiceDate || '';\n    const deposit = (depDate>=mStart && depDate<=mEnd && Number(j.depositAmount)>0)\n      ? Number(j.depositAmount) : 0;\n    return sum + balance + deposit;\n  },0);'''),
(
'''        <div>\n          <label style="display:block;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:4px">Deposit Date</label>\n          <input id="je-depositdate" type="date" value="${j.depositDate||''}" style="${inputStyle}">\n        </div>''',
'''        <div>\n          <label style="display:block;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:4px">Deposit Status</label>\n          <select id="je-depositstatus" style="${inputStyle};appearance:none;cursor:pointer;font-weight:700">\n            <option value="unpaid"${(j.depositStatus || (j.depositDate?'paid':'unpaid'))==='unpaid'?' selected':''}>Deposit invoiced — unpaid</option>\n            <option value="paid"${(j.depositStatus || (j.depositDate?'paid':'unpaid'))==='paid'?' selected':''}>Deposit received</option>\n          </select>\n        </div>\n        <div>\n          <label style="display:block;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:4px">Deposit Date Received</label>\n          <input id="je-depositdate" type="date" value="${j.depositDate||''}" style="${inputStyle}">\n        </div>\n        <div>\n          <label style="display:block;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:4px">Deposit Invoice Date</label>\n          <input id="je-deposit-invdate" type="date" value="${j.depositInvoiceDate||j.depositHeader?.issueDate||''}" style="${inputStyle}">\n        </div>'''),
(
'''  j.depositDate   = document.getElementById('je-depositdate')?.value||'';\n  j.invoiceNumber = document.getElementById('je-invnum')?.value.trim()||'';''',
'''  j.depositDate   = document.getElementById('je-depositdate')?.value||'';\n  j.depositStatus = document.getElementById('je-depositstatus')?.value || (j.depositDate ? 'paid' : 'unpaid');\n  if(j.depositStatus==='unpaid') j.depositDate='';\n  j.depositInvoiceDate = document.getElementById('je-deposit-invdate')?.value||'';\n  j.invoiceNumber = document.getElementById('je-invnum')?.value.trim()||'';'''),
(
'''function jobOutstanding(j) {\n  const inv = Number(j.invoiceAmount);\n  if (inv > 0) return jobAmountDisplay(j);\n  const q = Number(j.quoteAmount) || 0;\n  const d = Number(j.depositAmount) || 0;\n  return (q - d > 0) ? (q - d) : 0;\n}''',
'''function depositIsPaid(j){\n  // Explicit status wins; legacy records remain compatible via depositDate.\n  return Number(j.depositAmount)>0 && (j.depositStatus==='paid' || (!j.depositStatus && !!j.depositDate));\n}\nfunction depositOutstanding(j){\n  return Number(j.depositAmount)>0 && !depositIsPaid(j) ? Number(j.depositAmount) : 0;\n}\nfunction jobOutstanding(j) {\n  const inv = Number(j.invoiceAmount);\n  if (inv > 0) return jobAmountDisplay(j) + depositOutstanding(j);\n  const q = Number(j.quoteAmount) || 0;\n  const d = Number(j.depositAmount) || 0;\n  return (q - d > 0) ? ((depositIsPaid(j) ? 0 : d) + (q-d)) : (depositIsPaid(j) ? 0 : d);\n}'''),
(
'''  const isPaid = isDeposit ? (Number(j.depositAmount)>0 && !!j.depositDate) : j.status==='paid';''',
'''  const isPaid = isDeposit ? depositIsPaid(j) : j.status==='paid';'''),
(
'''  const depAmt = isDeposit ? (Number(dh.depositAmount)||depositAmountFor(j)) : 0;''',
'''  const depAmt = isDeposit ? (Number(dh.depositAmount)||depositAmountFor(j)) : 0;'''),
(
'''function sendDepositInvoiceEmail(jobId){\n  const j = jobs.find(x=>x.id===jobId);''',
'''function sendDepositInvoiceEmail(jobId){\n  const j = jobs.find(x=>x.id===jobId);'''),
]

for old, new in repls:
    if old not in s:
        raise SystemExit('Missing expected source block:\n' + old[:160])
    s = s.replace(old, new, 1)

# Mark the deposit invoice as issued only when its email is actually sent.
needle = "  const depAmt = depositAmountFor(j);\n  if(!(depAmt>0)){ showToast('No deposit amount set for this job','warn'); return; }"
replacement = "  const depAmt = depositAmountFor(j);\n  if(!(depAmt>0)){ showToast('No deposit amount set for this job','warn'); return; }\n  if(!j.depositInvoiceDate) j.depositInvoiceDate = (j.depositHeader && j.depositHeader.issueDate) || today();"
if needle not in s:
    raise SystemExit('Missing deposit email issuance block')
s = s.replace(needle, replacement, 1)

p.write_text(s)
print('patched index.html')
