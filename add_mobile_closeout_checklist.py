from pathlib import Path

p = Path('/home/ubuntu/sydneyautomationco-job-system/index.html')
s = p.read_text()
old_tabs = "${[['details','📋'],['parts','🔧'],['notes','📝'],['photos','📷'],['approval','✍'],['payment','💳']].map(([t,l])=>"
new_tabs = "${[['details','📋'],['checklist','✅'],['parts','🔧'],['notes','📝'],['photos','📷'],['approval','✍'],['payment','💳']].map(([t,l])=>"
if old_tabs not in s:
    raise SystemExit('mobile tabs anchor missing')
s = s.replace(old_tabs, new_tabs, 1)
needle = "      ${tab==='parts'?`\n        <!-- Parts used -->"
insert = r'''      ${tab==='checklist'?`
        <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:10px">Close-out Checklist</div>
        <div style="font-size:12px;color:#64748b;margin-bottom:12px">Complete these checks before raising the final invoice.</div>
        ${(()=>{
          const checks=[
            ['scope','Work completed matches the approved scope'],
            ['safety','Safety, isolation, and site hazards checked'],
            ['photos','Before/after photos captured where relevant'],
            ['walkthrough','Customer walkthrough or findings explained'],
            ['variation','Any extra work or variation recorded'],
          ];
          const state=j.mobileChecklist||{};
          return checks.map(([key,label])=>`<label style="display:flex;align-items:flex-start;gap:10px;background:#fff;border:1px solid ${state[key]?'#86efac':'#e2e8f0'};border-radius:10px;padding:13px 14px;margin-bottom:8px;cursor:pointer">
            <input type="checkbox" ${state[key]?'checked':''} onchange="(function(){const j=jobs.find(x=>x.id==='${jobId}');if(!j.mobileChecklist)j.mobileChecklist={};j.mobileChecklist['${key}']=this.checked;save();renderMain();}).call(this)" style="width:18px;height:18px;accent-color:#10b981;flex-shrink:0">
            <span style="font-size:13px;color:#0f172a;line-height:1.4">${label}</span>
          </label>`).join('');
        })()}
        <div style="background:#f8fafc;border-radius:10px;padding:12px 14px;font-size:11px;color:#64748b;margin-top:12px">The checklist is saved to this job and forms part of the close-out record.</div>
      `:''}

      ${tab==='parts'?`
        <!-- Parts used -->'''
if needle not in s:
    raise SystemExit('mobile parts anchor missing')
s=s.replace(needle, insert, 1)
p.write_text(s)
print('mobile closeout checklist patch applied')
