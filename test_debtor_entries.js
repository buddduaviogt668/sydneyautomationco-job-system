const assert = require('assert');
const jobs = [
  { id:'ajb', jobNumber:'SAI_100103', status:'invoiced', depositAmount:'14420.99', depositStatus:'unpaid', invoiceAmount:'9614.01', quoteAmount:'24035.00', invoiceNumber:'SAI_100110', invoiceDue:'2026-09-30' },
  { id:'ordinary', jobNumber:'SAI_100093', status:'overdue', invoiceAmount:'605.00', quoteAmount:'605.00', invoiceNumber:'SAI_100093', invoiceDue:'2026-07-28' },
  { id:'paid-deposit', jobNumber:'SAI_100101', status:'invoiced', depositAmount:'2796.50', depositStatus:'paid', invoiceAmount:'1198.50', quoteAmount:'3995.00', invoiceNumber:'SAI_100101', invoiceDue:'2026-08-31' }
];
const depositIsPaid = j => Number(j.depositAmount)>0 && (j.depositStatus==='paid' || (!j.depositStatus && !!j.depositDate));
const jobAmountDisplay = j => Number(j.invoiceAmount||j.quoteAmount||0);
const jobOutstanding = j => {
  const inv=Number(j.invoiceAmount);
  const dep=Number(j.depositAmount)||0;
  return inv>0 ? jobAmountDisplay(j) + (dep>0 && !depositIsPaid(j) ? dep : 0) : 0;
};
const getDebtorEntries = () => jobs.flatMap(j => {
  if(!['invoiced','overdue'].includes(j.status)) return [];
  const dep=Math.max(0,Number(j.depositAmount)||0);
  const bal=Math.max(0,Number(j.invoiceAmount)>0 ? jobAmountDisplay(j) : 0);
  const rows=[];
  if(dep>0 && !depositIsPaid(j)) rows.push({kind:'deposit',amount:dep,number:j.depositInvoiceNumber||('DEP — '+(j.invoiceNumber||j.jobNumber))});
  if(bal>0) rows.push({kind:'balance',amount:bal,number:j.invoiceNumber||j.jobNumber});
  if(dep<=0 && bal<=0 && jobOutstanding(j)>0) rows.push({kind:'invoice',amount:jobOutstanding(j),number:j.invoiceNumber||j.jobNumber});
  return rows;
});
const rows=getDebtorEntries();
assert.deepStrictEqual(rows.filter(r=>r.kind==='deposit').map(r=>r.amount), [14420.99]);
assert.deepStrictEqual(rows.filter(r=>r.kind==='balance').map(r=>r.amount), [9614.01,605,1198.50]);
assert.strictEqual(rows.reduce((s,r)=>s+r.amount,0), 25838.50);
assert.strictEqual(rows.some(r=>r.number==='DEP — SAI_100101'), false);
console.log('debtor entry regression checks passed');
