from pathlib import Path

p=Path('/home/ubuntu/sydneyautomationco-job-system/index.html')
s=p.read_text()
anchor="// ─── JOB NOTES (timestamped) ────────────────────────────────────────────────\nfunction addJobNote(jobId){"
insert=r'''// ─── COLLECTION LOG ────────────────────────────────────────────────────────────
// Follow-up is drafted/recorded, never silently sent. Payment status is not
// changed by this action.
function recordCollectionAttempt(jobId){
  const j=jobs.find(x=>x.id===jobId); if(!j) return;
  const channel=prompt('Follow-up channel (phone, email, SMS, WhatsApp):','phone');
  if(!channel) return;
  const note=prompt('What happened? Include any promise-to-pay date if given:','');
  if(note===null) return;
  const promise=prompt('Promise-to-pay date (YYYY-MM-DD), if provided:','')||'';
  const entry={id:'col_'+Date.now(),date:today(),channel:channel.trim(),note:note.trim(),promiseDate:promise.trim()};
  j.collectionLog=(j.collectionLog||[]).concat([entry]);
  j.lastCollectionContact=entry.date;
  if(entry.promiseDate) j.promiseToPayDate=entry.promiseDate;
  j.activityLog=(j.activityLog||[]).concat([{ts:new Date().toLocaleString('en-AU'),msg:'Collection follow-up logged via '+entry.channel+(entry.promiseDate?' · promise '+entry.promiseDate:'')}]);
  save();
  showToast('Collection follow-up saved — payment status unchanged','success');
  renderMain();
}

function latestCollectionNote(j){
  const a=(j?.collectionLog||[]).slice(-1)[0];
  return a?`${a.date} · ${a.channel}${a.promiseDate?' · promise '+a.promiseDate:''}`:'';
}

// ─── JOB NOTES (timestamped) ────────────────────────────────────────────────
function addJobNote(jobId){'''
if anchor not in s: raise SystemExit('notes anchor missing')
s=s.replace(anchor,insert,1)
old="""            <button onclick=\"sendWhatsApp('${j.id}','chase')\" style=\"background:#25D366;color:#fff;border:none;border-radius:5px;padding:5px 8px;font-size:11px;font-weight:700;cursor:pointer\" title=\"Chase via WhatsApp\">💬</button>
            ${CFG.stripePaymentLinkBase?`<button onclick=\"openStripePaymentLink('${j.id}')\" style=\"background:#635bff;color:#fff;border:none;border-radius:5px;padding:5px 8px;font-size:11px;font-weight:700;cursor:pointer\" title=\"Open Stripe pay link\">💳</button>`:''}
            <button onclick=\"openJobDetail('${j.id}')\" style=\"background:#f1f5f9;border:1px solid #e2e8f0;border-radius:5px;padding:5px 8px;font-size:11px;font-weight:600;cursor:pointer;color:#334155\">View →</button>"""
new="""            <button onclick=\"sendWhatsApp('${j.id}','chase')\" style=\"background:#25D366;color:#fff;border:none;border-radius:5px;padding:5px 8px;font-size:11px;font-weight:700;cursor:pointer\" title=\"Draft/chase via WhatsApp\">💬</button>
            <button onclick=\"recordCollectionAttempt('${j.id}')\" style=\"background:#fef3c7;border:1px solid #fde68a;color:#92400e;border-radius:5px;padding:5px 8px;font-size:11px;font-weight:700;cursor:pointer\" title=\"Log collection attempt\">Log</button>
            ${CFG.stripePaymentLinkBase?`<button onclick=\"openStripePaymentLink('${j.id}')\" style=\"background:#635bff;color:#fff;border:none;border-radius:5px;padding:5px 8px;font-size:11px;font-weight:700;cursor:pointer\" title=\"Open Stripe pay link\">💳</button>`:''}
            <button onclick=\"openJobDetail('${j.id}')\" style=\"background:#f1f5f9;border:1px solid #e2e8f0;border-radius:5px;padding:5px 8px;font-size:11px;font-weight:600;cursor:pointer;color:#334155\">View →</button>"""
if old not in s: raise SystemExit('debtor action buttons anchor missing')
s=s.replace(old,new,1)
p.write_text(s)
print('collection log patch applied')
