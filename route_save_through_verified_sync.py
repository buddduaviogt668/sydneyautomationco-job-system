from pathlib import Path
p=Path('/home/ubuntu/sydneyautomationco-job-system/index.html')
s=p.read_text()
old="""  // Push to Supabase (non-blocking) — track failures
  const _saveTs = Date.now();
  const _manifest = _buildSyncManifest(_saveTs);
  STORE.set('syncManifest', _manifest);
  Promise.all([
    SB.set('savedAt', _saveTs),
    SB.set('clients', clients),
    SB.set('jobs', _jobsForCloud(jobs)),
    SB.set('projects', projects),
    SB.set('counters', counters),
    SB.set('kmlog', kmLog),
    SB.set('expenses', expenses),
    SB.set('taxman', taxManual),
    SB.set('leads', leads),
    SB.set('recurring', recurringJobs),
    SB.set('timesheets', timesheets),
    SB.set('cfg', CFG),
    SB.set('partsdb', PARTS_DB),
    SB.set('supInvoices', (window._supInvoices||[]).map(i=>{const c={...i};delete c._fileObj;c.fileData=!!i.fileData;return c;})),
    SB.set('syncManifest', _manifest),
  ]).then((results)=>{
    if(results.some(x=>x===false)) throw new Error('One or more dataset writes failed');
    _sbOnline = true;
    _lastSyncTs = new Date();
    updateSyncStatus('online');
  }).catch(e => {
    _sbOnline = false;
    updateSyncStatus('offline');
    console.warn('Supabase sync error:', e);
  });"""
new="""  // All automatic saves use the verified path: merge safe append-only data,
  // write each dataset, write a manifest, then read back and verify checksums.
  _pushToSupabase().then(()=>{
    _sbOnline = true;
    updateSyncStatus('online');
  }).catch(e => {
    _sbOnline = false;
    updateSyncStatus('error');
    console.warn('Verified Supabase sync error:', e);
    showToast('⚠ Cloud sync needs attention — local data is preserved','warn');
  });"""
if old not in s: raise SystemExit('save block not found')
s=s.replace(old,new,1)
p.write_text(s)
print('save routed through verified sync')
