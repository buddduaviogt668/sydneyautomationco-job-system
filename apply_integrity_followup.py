from pathlib import Path
p=Path('/home/ubuntu/sydneyautomationco-job-system/index.html')
s=p.read_text()
old="    supInvoices:  supInvoicesWithFiles\n  };"
new="    supInvoices:  supInvoicesWithFiles,\n    syncManifest: _buildSyncManifest(Date.now())\n  };"
if old in s: s=s.replace(old,new,1)
old="  if (sbData.kmlog)     { kmLog     = sbData.kmlog;      localStorage.setItem('sac:kmlog',     JSON.stringify(kmLog)); }"
new="  if (sbData.kmlog)     { kmLog     = _mergeRecords([], sbData.kmlog); localStorage.setItem('sac:kmlog', JSON.stringify(kmLog)); }"
if old in s: s=s.replace(old,new,1)
old="  if (data.savedAt) STORE.set('savedAt', String(data.savedAt));\n}"
new="  if (data.savedAt) STORE.set('savedAt', String(data.savedAt));\n  if (data.syncManifest) STORE.set('syncManifest', data.syncManifest);\n}"
if old in s: s=s.replace(old,new,1)
p.write_text(s)
print('follow-up applied')
