from pathlib import Path

p = Path('/home/ubuntu/sydneyautomationco-job-system/index.html')
s = p.read_text()

old = "const SB_HEADERS = {"
new = "// v32 integrity foundation: every cloud sync is now auditable per dataset.\nconst SYNC_SCHEMA_VERSION = 'v32-integrity-1';\nconst SYNC_DATA_KEYS = ['clients','jobs','projects','leads','counters','kmlog','expenses','taxman','cfg','partsdb','timesheets','recurring','supInvoices'];\n\nconst SB_HEADERS = {"
if old not in s: raise SystemExit('config anchor not found')
s = s.replace(old, new, 1)

old = "      if (!res.ok) {\n        const err = await res.text();\n        console.warn('Supabase write error:', res.status, err);\n      }\n    } catch(e) { console.warn('Supabase write failed:', e); }\n  },"
new = "      if (!res.ok) {\n        const err = await res.text();\n        console.warn('Supabase write error:', res.status, err);\n        return false;\n      }\n      return true;\n    } catch(e) { console.warn('Supabase write failed:', e); return false; }\n  },"
if old not in s: raise SystemExit('SB.set anchor not found')
s = s.replace(old, new, 1)

anchor = "\nconst STORE = {"
insert = r'''

// ─── DATA INTEGRITY / CONFLICT UTILITIES ─────────────────────────────────────
// Canonical JSON makes checksums stable across browsers and formatting changes.
function _canonical(v){
  if(Array.isArray(v)) return '['+v.map(_canonical).join(',')+']';
  if(v && typeof v==='object') return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+_canonical(v[k])).join(',')+'}';
  return JSON.stringify(v);
}
function _checksum(v){
  const text=_canonical(v); let h=2166136261;
  for(let i=0;i<text.length;i++){ h^=text.charCodeAt(i); h=Math.imul(h,16777619); }
  return ('00000000'+(h>>>0).toString(16)).slice(-8);
}
function _recordKey(x, i){ return String(x?.id ?? x?.jobNumber ?? x?.invoiceNumber ?? x?.jobRef ?? ('row_'+i)); }
function _mergeRecords(localValue, cloudValue){
  if(!Array.isArray(localValue) || !Array.isArray(cloudValue)) return localValue ?? cloudValue;
  const out=new Map();
  cloudValue.forEach((x,i)=>out.set(_recordKey(x,i),x));
  localValue.forEach((x,i)=>out.set(_recordKey(x,i),x));
  return Array.from(out.values());
}
function _datasetValue(k){
  if(k==='clients') return clients;
  if(k==='jobs') return _jobsForCloud(jobs);
  if(k==='projects') return projects;
  if(k==='leads') return leads;
  if(k==='counters') return counters;
  if(k==='kmlog') return kmLog;
  if(k==='expenses') return expenses;
  if(k==='taxman') return taxManual;
  if(k==='cfg') return CFG;
  if(k==='partsdb') return PARTS_DB;
  if(k==='timesheets') return timesheets;
  if(k==='recurring') return recurringJobs;
  if(k==='supInvoices') return (window._supInvoices||[]).map(i=>{const c={...i};delete c._fileObj;return c;});
  return STORE.get(k);
}
function _buildSyncManifest(savedAt){
  const datasets={};
  SYNC_DATA_KEYS.forEach(k=>{const v=_datasetValue(k); datasets[k]={count:Array.isArray(v)?v.length:null,checksum:_checksum(v)};});
  return {schema:SYNC_SCHEMA_VERSION,savedAt:Number(savedAt)||Date.now(),datasets};
}
function _manifestSummary(m){
  if(!m) return 'no manifest';
  const bad=Object.entries(m.datasets||{}).filter(([,x])=>!x?.checksum).map(([k])=>k);
  return `${m.schema||'legacy'} · ${Object.keys(m.datasets||{}).length} datasets${bad.length?' · incomplete':''}`;
}
window.getSyncHealth=async function(){
  const cloud=await SB.getAll();
  const local={savedAt:Number(STORE.get('savedAt'))||0,manifest:STORE.get('syncManifest')};
  const cloudManifest=cloud?.syncManifest||null;
  const localChecks=_buildSyncManifest(local.savedAt);
  const mismatches=[];
  SYNC_DATA_KEYS.forEach(k=>{const a=localChecks.datasets[k]?.checksum,b=cloudManifest?.datasets?.[k]?.checksum;if(b&&a!==b)mismatches.push(k);});
  return {online:Object.keys(cloud||{}).length>0,localSavedAt:local.savedAt,cloudSavedAt:Number(cloud?.savedAt)||0,localManifest:_manifestSummary(local.manifest),cloudManifest:_manifestSummary(cloudManifest),mismatches,localJobCount:Array.isArray(jobs)?jobs.length:0,cloudJobCount:Array.isArray(cloud?.jobs)?cloud.jobs.length:null,localKmCount:kmLog.length,cloudKmCount:Array.isArray(cloud?.kmlog)?cloud.kmlog.length:null};
};
'''
if anchor not in s: raise SystemExit('STORE anchor not found')
s = s.replace(anchor, insert+anchor, 1)

old = "async function _pushToSupabase(){\n  const keys = ['clients','jobs','projects','leads','counters','kmlog','expenses','taxman','cfg','partsdb','timesheets','recurring','supInvoices'];\n  const now = Date.now();\n  await SB.set('savedAt', now);\n  STORE.set('savedAt', String(now));\n  for(const k of keys){\n    const v = k==='supInvoices'\n      ? (window._supInvoices||[]).map(i=>{const c={...i};delete c._fileObj;c.fileData=!!i.fileData;return c;})\n      : k==='jobs' ? _jobsForCloud(jobs)\n      : STORE.get(k) || (k==='clients'?clients:k==='counters'?counters:k==='kmlog'?kmLog:k==='expenses'?expenses:k==='taxman'?taxManual:null);\n    if(v !== null && v !== undefined) await SB.set(k, v);\n  }\n  _lastSyncTs = new Date();\n  updateSyncStatus('online');\n}"
new = r'''async function _pushToSupabase(){
  const now = Date.now();
  const cloudBefore = await SB.getAll();
  // Merge append-only logs by stable id so a phone trip cannot be erased by a laptop snapshot.
  if(Array.isArray(cloudBefore?.kmlog)) kmLog = _mergeRecords(kmLog, cloudBefore.kmlog);
  const values={};
  SYNC_DATA_KEYS.forEach(k=>{ values[k]=_datasetValue(k); });
  const manifest=_buildSyncManifest(now);
  const results=[];
  for(const k of SYNC_DATA_KEYS){ if(values[k]!==null && values[k]!==undefined) results.push(await SB.set(k, values[k])); }
  results.push(await SB.set('savedAt', now));
  results.push(await SB.set('syncManifest', manifest));
  if(results.some(x=>x!==true)) throw new Error('One or more cloud dataset writes failed; local data was not marked synchronised.');
  STORE.set('savedAt', String(now));
  STORE.set('syncManifest', manifest);
  const cloudAfter=await SB.getAll();
  const verify=cloudAfter?.syncManifest;
  const failed=SYNC_DATA_KEYS.filter(k=>verify?.datasets?.[k]?.checksum!==manifest.datasets[k]?.checksum);
  if(failed.length) throw new Error('Cloud verification failed for: '+failed.join(', '));
  _lastSyncTs = new Date();
  updateSyncStatus('online');
}'''
if old not in s: raise SystemExit('_push function anchor not found')
s = s.replace(old, new, 1)

# Store a manifest on pull and expose a stronger status message.
old = "  if (sbData.savedAt)   { STORE.set('savedAt', String(sbData.savedAt)); }\n  // Auto-fix overdue statuses after loading"
new = "  if (sbData.savedAt)   { STORE.set('savedAt', String(sbData.savedAt)); }\n  if (sbData.syncManifest) { STORE.set('syncManifest', sbData.syncManifest); }\n  // Auto-fix overdue statuses after loading"
if old not in s: raise SystemExit('apply manifest anchor not found')
s = s.replace(old, new, 1)

# Add manifest to the regular save path and make the existing Promise surface failures.
old = "  const _saveTs = Date.now();\n  Promise.all(["
new = "  const _saveTs = Date.now();\n  const _manifest = _buildSyncManifest(_saveTs);\n  STORE.set('syncManifest', _manifest);\n  Promise.all(["
if old not in s: raise SystemExit('save timestamp anchor not found')
s = s.replace(old, new, 1)
old = "    SB.set('supInvoices', (window._supInvoices||[]).map(i=>{const c={...i};delete c._fileObj;c.fileData=!!i.fileData;return c;})),\n  ]).then(()=>{"
new = "    SB.set('supInvoices', (window._supInvoices||[]).map(i=>{const c={...i};delete c._fileObj;c.fileData=!!i.fileData;return c;})),\n    SB.set('syncManifest', _manifest),\n  ]).then((results)=>{\n    if(results.some(x=>x===false)) throw new Error('One or more dataset writes failed');"
if old not in s: raise SystemExit('save promise anchor not found')
s = s.replace(old, new, 1)

# Include integrity metadata in file exports and clean duplicate append-only log rows on restore.
old = "    supInvoices:  supInvoicesWithFiles\n  };"
new = "    supInvoices:  supInvoicesWithFiles,\n    syncManifest: _buildSyncManifest(Date.now())\n  };"
if old not in s: raise SystemExit('payload manifest anchor not found')
s = s.replace(old, new, 1)
old = "  if (sbData.kmlog)     { kmLog     = sbData.kmlog;      localStorage.setItem('sac:kmlog',     JSON.stringify(kmLog)); }"
new = "  if (sbData.kmlog)     { kmLog     = _mergeRecords([], sbData.kmlog); localStorage.setItem('sac:kmlog', JSON.stringify(kmLog)); }"
if old not in s: raise SystemExit('cloud kmlog anchor not found')
s = s.replace(old, new, 1)
# Update UI version string globally only where the visible app title is defined; keep data payload version untouched.
s = s.replace('v31 — Quotes + Excel Import', 'v32 — Integrity + Quotes + Excel Import')
s = s.replace('Running v31 — Quotes + Excel Import active', 'Running v32 — Integrity + Quotes + Excel Import active')

p.write_text(s)
print('patched', p)
''
