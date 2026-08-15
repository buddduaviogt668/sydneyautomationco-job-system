from pathlib import Path
p=Path('/home/ubuntu/sydneyautomationco-job-system/index.html')
s=p.read_text()
old="""      <button onclick=\"forcePullFromCloud()\" title=\"Pull latest data from cloud\" style=\"flex:1;background:#0c2a4a;border:none;border-radius:6px;color:#60a5fa;padding:5px 0;font-size:10px;font-weight:700;cursor:pointer\">⬇ Pull</button>
      <button onclick=\"forcePushToCloud()\" title=\"Push local data to cloud\" style=\"flex:1;background:#0c2a4a;border:none;border-radius:6px;color:#60a5fa;padding:5px 0;font-size:10px;font-weight:700;cursor:pointer\">⬆ Push</button>"""
new="""      <button onclick=\"forcePullFromCloud()\" title=\"Pull latest data from cloud\" style=\"flex:1;background:#0c2a4a;border:none;border-radius:6px;color:#60a5fa;padding:5px 0;font-size:10px;font-weight:700;cursor:pointer\">⬇ Pull</button>
      <button onclick=\"forcePushToCloud()\" title=\"Push local data to cloud\" style=\"flex:1;background:#0c2a4a;border:none;border-radius:6px;color:#60a5fa;padding:5px 0;font-size:10px;font-weight:700;cursor:pointer\">⬆ Push</button>
      <button onclick=\"verifyAndRepairSync()\" title=\"Verify datasets and repair safe append-only logs\" style=\"flex:1;background:#0c2a4a;border:none;border-radius:6px;color:#a7f3d0;padding:5px 0;font-size:10px;font-weight:700;cursor:pointer\">✓ Verify</button>"""
if old not in s: raise SystemExit('sidebar control anchor missing')
s=s.replace(old,new,1)
anchor="\n// ─── END SYNC HELPERS ─────────────────────────────────────────────────────────"
insert=r'''

// Safe repair flow: only merges append-only kilometre logs, never overwrites jobs or money.
async function verifyAndRepairSync(){
  updateSyncStatus('syncing');
  try{
    const cloud=await SB.getAll();
    const cloudKm=Array.isArray(cloud?.kmlog)?cloud.kmlog:[];
    const beforeLocal=kmLog.length, beforeCloud=cloudKm.length;
    const merged=_mergeRecords(kmLog,cloudKm);
    const health=await getSyncHealth();
    const changed=merged.length!==beforeLocal || merged.length!==beforeCloud || (health.mismatches||[]).length>0;
    if(!changed){ updateSyncStatus('online'); showToast('✓ All datasets match cloud — no repair needed','success'); return; }
    const detail=`Local km rows: ${beforeLocal}\nCloud km rows: ${beforeCloud}\nSafe merged rows: ${merged.length}\nMismatched datasets: ${(health.mismatches||[]).join(', ')||'legacy cloud (no manifest)'}\n\nOnly the kilometre log will be merged. Jobs, clients, invoices, quotes and expenses will not be overwritten.`;
    if(!confirm('Sync health check found a difference.\n\n'+detail+'\n\nRepair the kilometre log now?')){ updateSyncStatus('online'); return; }
    const ok=await SB.set('kmlog',merged);
    if(ok!==true) throw new Error('Cloud kilometre-log write was rejected');
    kmLog=merged; localStorage.setItem('sac:kmlog',JSON.stringify(kmLog));
    const now=Date.now(), manifest=_buildSyncManifest(now);
    if((await SB.set('savedAt',now))!==true || (await SB.set('syncManifest',manifest))!==true) throw new Error('Cloud verification metadata could not be saved');
    STORE.set('savedAt',String(now)); STORE.set('syncManifest',manifest);
    _lastSyncTs=new Date(); updateSyncStatus('online'); renderNav(); renderMain();
    showToast('✓ Kilometre log repaired and cloud-verified ('+merged.length+' unique trips)','success');
  }catch(e){ console.error('verifyAndRepairSync',e); updateSyncStatus('error'); showToast('⚠ Sync repair failed: '+e.message,'error'); }
}
'''
if anchor not in s: raise SystemExit('sync helper anchor missing')
s=s.replace(anchor,insert+anchor,1)
s=s.replace("const APP_VERSION = 'v31';","const APP_VERSION = 'v32';",1)
p.write_text(s)
print('sync repair control added')
