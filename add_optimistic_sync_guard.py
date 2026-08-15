from pathlib import Path
p=Path('/home/ubuntu/sydneyautomationco-job-system/index.html')
s=p.read_text()
old="""  if(changed){
    STORE.set('jobs', jobs);
    SB.set('jobs', _jobsForCloud(jobs)).catch(()=>{});
  }"""
new="""  if(changed){
    STORE.set('jobs', jobs);
    // Do not write this dataset directly. The next verified save/push owns
    // the cloud transaction and will detect conflicts before writing.
  }"""
if old not in s: raise SystemExit('overdue direct write block missing')
s=s.replace(old,new,1)
old="""async function _pushToSupabase(){
  const now = Date.now();
  const cloudBefore = await SB.getAll();
  // Merge append-only logs by stable id so a phone trip cannot be erased by a laptop snapshot.
  if(Array.isArray(cloudBefore?.kmlog)) kmLog = _mergeRecords(kmLog, cloudBefore.kmlog);"""
new="""async function _pushToSupabase(){
  const now = Date.now();
  const localLast = Number(STORE.get('savedAt')) || 0;
  const localManifest = STORE.get('syncManifest') || null;
  const cloudBefore = await SB.getAll();
  const cloudLast = Number(cloudBefore?.savedAt) || 0;
  const cloudManifest = cloudBefore?.syncManifest || null;
  const cloudChangedElsewhere = !!(cloudLast > localLast && localManifest && cloudManifest && SYNC_DATA_KEYS.some(k=>localManifest.datasets?.[k]?.checksum !== cloudManifest.datasets?.[k]?.checksum));
  if(cloudChangedElsewhere && !window._allowForcePushOnce){
    throw new Error('Cloud changed on another device. Pull and review the conflict before pushing local changes.');
  }
  window._allowForcePushOnce = false;
  // Merge append-only logs by stable id so a phone trip cannot be erased by a laptop snapshot.
  if(Array.isArray(cloudBefore?.kmlog)) kmLog = _mergeRecords(kmLog, cloudBefore.kmlog);"""
if old not in s: raise SystemExit('push function anchor missing')
s=s.replace(old,new,1)
old="""  try {
    await _pushToSupabase();
    showToast('☁ Pushed to cloud — ' + jobs.length + ' jobs, ' + clients.length + ' clients', 'success');"""
new="""  try {
    window._allowForcePushOnce = true;
    await _pushToSupabase();
    showToast('☁ Pushed to cloud — ' + jobs.length + ' jobs, ' + clients.length + ' clients', 'success');"""
if old not in s: raise SystemExit('force push anchor missing')
s=s.replace(old,new,1)
p.write_text(s)
print('optimistic sync guard added')
