from pathlib import Path

p=Path('/home/ubuntu/sydneyautomationco-job-system/index.html')
s=p.read_text()

repls=[
("{id:'oh3',name:'Internet',monthly:110.00}", "{id:'oh3',name:'Internet',monthly:114.00}"),
("{id:'oh9',name:'Software / Subscriptions',monthly:0}", "{id:'oh9',name:'Microsoft 365',monthly:9.90}"),
("{id:'su1',name:'Stickers (service call)',total:50,recoverOver:20}", "{id:'su1',name:'Stickers (service call)',total:50,recoverOver:9999}"),
("{id:'su2',name:'Polo shirts',total:40,recoverOver:20}", "{id:'su2',name:'Polo shirts',total:40,recoverOver:9999}"),
("{id:'su3',name:'Shirt printing / logo',total:177,recoverOver:20}", "{id:'su3',name:'Shirt printing / logo',total:177,recoverOver:9999}"),
("function totalFixedPerJob(km, tolls){ return overheadPerJob() + startupRecoveryPerJob() + defaultTravelCost(km||CFG.defaultKm, tolls!=null?tolls:CFG.defaultTolls); }", "function totalFixedPerJob(km, tolls){ return overheadPerJob() + defaultTravelCost(km||CFG.defaultKm, tolls!=null?tolls:CFG.defaultTolls); }"),
("const totalCost=partsCost+travelCost+frtCost+overheadPerJob()+startupRecoveryPerJob();", "const totalCost=partsCost+travelCost+frtCost+overheadPerJob();"),
("const totalCost=partsCost+travelCost+freightCost+overheadPerJob()+startupRecoveryPerJob();", "const totalCost=partsCost+travelCost+freightCost+overheadPerJob();"),
]
for old,new in repls:
    if old not in s:
        raise SystemExit('missing anchor: '+old)
    s=s.replace(old,new,1)

anchor="let _storedCFG = STORE.get('cfg') || {};\n"
insert="""let _storedCFG = STORE.get('cfg') || {};
// Expense/profitability correction migration: update only the old untouched defaults.
// Historical expense rows remain unchanged; this affects the current management model.
(function migrateExpenseProfitDefaults(){
  let dirty=false;
  if(Array.isArray(_storedCFG.overheads)){
    const internet=_storedCFG.overheads.find(o=>o.name==='Internet' && Number(o.monthly)===110);
    if(internet){ internet.monthly=114; dirty=true; }
    const ms=_storedCFG.overheads.find(o=>o.name==='Software / Subscriptions' && Number(o.monthly)===9.9);
    if(ms){ ms.name='Microsoft 365'; ms.monthly=9.9; dirty=true; }
  }
  if(Array.isArray(_storedCFG.startupItems)){
    _storedCFG.startupItems.forEach(item=>{
      const n=String(item.name||'').toLowerCase();
      if((n.includes('sticker')||n.includes('polo')||n.includes('shirt')||n.includes('jacket')||n.includes('printing')) && Number(item.recoverOver)!==9999){ item.recoverOver=9999; dirty=true; }
    });
  }
  if(dirty) STORE.set('cfg', _storedCFG);
})();
"""
if anchor not in s:
    raise SystemExit('missing stored cfg anchor')
s=s.replace(anchor,insert,1)
p.write_text(s)
print('patched',p)
