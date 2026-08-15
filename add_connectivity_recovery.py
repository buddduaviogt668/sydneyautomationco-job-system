from pathlib import Path
p=Path('/home/ubuntu/sydneyautomationco-job-system/index.html')
s=p.read_text()
anchor="\nfunction updateAutoSaveStatus(){"
insert=r'''

let _syncRetryTimer = null;
function scheduleVerifiedSyncRetry(){
  if(!navigator.onLine) return;
  clearTimeout(_syncRetryTimer);
  _syncRetryTimer=setTimeout(async()=>{
    try{
      updateSyncStatus('syncing');
      await _pushToSupabase();
      showToast('☁ Connection restored — cloud sync verified','success');
    }catch(e){
      updateSyncStatus('error');
      console.warn('Reconnect sync deferred:',e.message);
    }
  },1200);
}
window.addEventListener('offline',()=>updateSyncStatus('offline'));
window.addEventListener('online',()=>scheduleVerifiedSyncRetry());
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible' && navigator.onLine){
    getSyncHealth().then(h=>{
      if((h.mismatches||[]).length) showToast('⚠ Cloud changed elsewhere — pull and review before editing','warn');
    }).catch(()=>{});
  }
});
'''
if anchor not in s: raise SystemExit('autosave anchor missing')
s=s.replace(anchor,insert+anchor,1)
p.write_text(s)
print('connectivity recovery added')
