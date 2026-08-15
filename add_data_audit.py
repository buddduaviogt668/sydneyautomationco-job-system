from pathlib import Path
p=Path('/home/ubuntu/sydneyautomationco-job-system/index.html')
s=p.read_text()
anchor="window.getSyncHealth=async function(){"
insert=r'''window.runDataIntegrityAudit=function(){
  const issues=[];
  const dup=(arr,key,label)=>{const seen=new Map();(arr||[]).forEach((x,i)=>{const v=x?.[key];if(!v)return; if(seen.has(v)) issues.push({severity:'high',type:'duplicate',field:label,value:v,rows:[seen.get(v),i]}); else seen.set(v,i);});};
  dup(jobs,'id','job id'); dup(jobs,'jobNumber','job number'); dup(jobs,'invoiceNumber','invoice number'); dup(clients,'id','client id'); dup(expenses,'id','expense id'); dup(kmLog,'id','kilometre id');
  (jobs||[]).forEach((j,i)=>{
    if(j.clientId && !clients.some(c=>c.id===j.clientId)) issues.push({severity:'high',type:'orphan',field:'clientId',value:j.clientId,row:i,job:j.jobNumber});
    ['invoiceAmount','quoteAmount','depositAmount'].forEach(k=>{if(j[k]!=='' && j[k]!=null && (!Number.isFinite(Number(j[k])) || Number(j[k])<0)) issues.push({severity:'high',type:'invalid_amount',field:k,value:j[k],job:j.jobNumber});});
    if(j.status==='paid' && !j.paidDate) issues.push({severity:'medium',type:'missing_paid_date',job:j.jobNumber});
    if(j.status==='overdue' && !(Number(j.invoiceAmount)>0)) issues.push({severity:'medium',type:'overdue_without_invoice',job:j.jobNumber});
  });
  const counts={jobs:(jobs||[]).length,clients:(clients||[]).length,expenses:(expenses||[]).length,kmlog:(kmLog||[]).length,issues:issues.length};
  return {ok:issues.length===0,counts,issues,generatedAt:new Date().toISOString()};
};

'''
if anchor not in s: raise SystemExit('audit anchor missing')
s=s.replace(anchor,insert+anchor,1)
old="""    const health=await getSyncHealth();
    const changed=merged.length!==beforeLocal || merged.length!==beforeCloud || (health.mismatches||[]).length>0;
    if(!changed){ updateSyncStatus('online'); showToast('✓ All datasets match cloud — no repair needed','success'); return; }"""
new="""    const health=await getSyncHealth();
    const audit=runDataIntegrityAudit();
    const changed=merged.length!==beforeLocal || merged.length!==beforeCloud || (health.mismatches||[]).length>0;
    if(!changed){ updateSyncStatus('online'); showToast(audit.ok?'✓ Cloud verified — no repair needed':'⚠ Cloud verified · '+audit.issues.length+' data issues need review','warn'); return; }"""
if old not in s: raise SystemExit('verify flow anchor missing')
s=s.replace(old,new,1)
p.write_text(s)
print('data audit added')
