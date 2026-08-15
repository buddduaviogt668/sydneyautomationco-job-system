from pathlib import Path
p=Path('/home/ubuntu/sydneyautomationco-job-system/index.html')
s=p.read_text()
old="""    }
    // Also push to Supabase asynchronously
    SB.set(k, v).catch(()=>{});
  },
  _quotaWarned: false"""
new="""    }
    // Cloud writes are intentionally handled only by _pushToSupabase().
    // Keeping this local-only prevents per-key writes from racing the
    // verified manifest transaction and silently overwriting another device.
  },
  _quotaWarned: false"""
if old not in s: raise SystemExit('STORE direct-write block not found')
s=s.replace(old,new,1)
p.write_text(s)
print('removed direct STORE cloud write')
