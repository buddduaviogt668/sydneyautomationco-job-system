from pathlib import Path
p=Path('/home/ubuntu/sydneyautomationco-job-system/index.html')
s=p.read_text()
old="function renderPayroll(){\n"
new="function renderPayroll(){\n  const soleTraderPayroll=(CFG.payrollMode||'owner_drawings')==='owner_drawings';\n"
if old not in s: raise SystemExit('renderPayroll anchor missing')
s=s.replace(old,new,1)
repls=[
("label:'PAYG Tax'", "label:soleTraderPayroll?'Tax reserve':'PAYG Tax'"),
("Pay yourself a wage · Set aside PAYG tax · Grow your super · Know what's left for bills", "${soleTraderPayroll?'Plan owner drawings · Reserve tax · Build voluntary retirement savings · Know what is safe to withdraw':'Pay yourself a wage · Set aside PAYG tax · Grow your super · Know what\\'s left for bills'}"),
("Pay run obligation: ${fmt$(P?.grossPerPeriod||0)}", "${soleTraderPayroll?'Owner-draw target':'Pay-run obligation'}: ${fmt$(P?.grossPerPeriod||0)}"),
("Gross Pay per ${freqLabel} ($)", "${soleTraderPayroll?'Owner-draw target':'Gross Pay'} per ${freqLabel} ($)"),
("Super Rate (%)", "${soleTraderPayroll?'Voluntary retirement reserve (%)':'Super Rate (%)'}"),
("${payCard('PAYG Tax',fmt$(P.taxPerPeriod),'withheld','#ef4444',fmt$(P.annualTax)+'/yr · set aside')}", "${payCard(soleTraderPayroll?'Tax Reserve (planning)':'PAYG Tax',fmt$(P.taxPerPeriod),soleTraderPayroll?'planning estimate':'withheld','#ef4444',fmt$(P.annualTax)+'/yr · set aside')}") ,
("${payCard('Super',fmt$(P.superPerPeriod),'employer contrib.','#8b5cf6',fmt$(P.superPerPeriod*P.periods)+'/yr · '+CFG.superRate+'%')}", "${payCard(soleTraderPayroll?'Retirement Reserve':'Super',fmt$(P.superPerPeriod),soleTraderPayroll?'voluntary target':'employer contrib.','#8b5cf6',fmt$(P.superPerPeriod*P.periods)+'/yr · '+CFG.superRate+'%')}") ,
("${payCard('Net Take-Home',fmt$(P.netPay),'after tax','#10b981',fmt$(P.netPay*P.periods)+'/yr')}", "${payCard(soleTraderPayroll?'Indicative Draw After Reserve':'Net Take-Home',fmt$(P.netPay),soleTraderPayroll?'not payroll net pay':'after tax','#10b981',fmt$(P.netPay*P.periods)+'/yr')}") ,
("Current employer rate: ${CFG.superRate}% of gross.", "${soleTraderPayroll?'Current voluntary retirement target':'Current employer rate'}: ${CFG.superRate}% of gross.")
]
for a,b in repls:
    if a not in s: print('missing',a[:80])
    s=s.replace(a,b,1)
p.write_text(s)
print('patched',p)
