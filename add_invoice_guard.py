from pathlib import Path
p=Path('/home/ubuntu/sydneyautomationco-job-system/index.html')
s=p.read_text()
anchor="// ─── ACTIONS ──────────────────────────────────────────────────────────────────\nfunction advanceJob(id, next){"
insert=r'''// ─── FINANCIAL INTEGRITY GUARDS ───────────────────────────────────────────────
function _invoiceRefsInUse(ref, exceptId){
  const needle=String(ref||'').trim().toLowerCase();
  if(!needle) return [];
  return jobs.filter(x=>x.id!==exceptId && String(x.invoiceNumber||'').trim().toLowerCase()===needle);
}
function _invoiceRefAvailable(ref, exceptId){
  const clashes=_invoiceRefsInUse(ref,exceptId);
  if(!clashes.length) return true;
  const desc=clashes.map(x=>`${x.jobNumber||x.id} (${x.invoiceAmount||'no amount'})`).join(', ');
  showToast(`⚠ Invoice reference already used by ${desc}. Choose a new reference.`,'error');
  return false;
}

'''
if anchor not in s: raise SystemExit('action anchor missing')
s=s.replace(anchor,insert+anchor,1)
old="""    if(manualNum) updates.invoiceNumber=manualNum;
    if(manualAmt) updates.invoiceAmount=manualAmt;
    if(manualDue) updates.invoiceDue=manualDue;
  }

  // ── PAID: auto-set paid date + prompt WhatsApp receipt confirmation ──────────"""
new="""    if(manualNum) updates.invoiceNumber=manualNum;
    if(manualAmt) updates.invoiceAmount=manualAmt;
    if(manualDue) updates.invoiceDue=manualDue;
    if(!_invoiceRefAvailable(updates.invoiceNumber,j.id)) return;
  }

  // ── PAID: auto-set paid date + prompt WhatsApp receipt confirmation ──────────"""
if old not in s: raise SystemExit('invoiced guard anchor missing')
s=s.replace(old,new,1)
old="""    if(manualNum) updates.invoiceNumber=manualNum;
    if(manualAmt) updates.invoiceAmount=manualAmt;
  }

  // ── DEPOSIT PAID: auto-fill deposit date ────────────────────────────────────"""
new="""    if(manualNum) updates.invoiceNumber=manualNum;
    if(manualAmt) updates.invoiceAmount=manualAmt;
    if(updates.invoiceNumber && !_invoiceRefAvailable(updates.invoiceNumber,j.id)) return;
  }

  // ── DEPOSIT PAID: auto-fill deposit date ────────────────────────────────────"""
if old not in s: raise SystemExit('paid guard anchor missing')
s=s.replace(old,new,1)
p.write_text(s)
print('invoice guard added')
