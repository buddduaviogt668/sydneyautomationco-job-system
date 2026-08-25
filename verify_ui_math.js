const fs = require('fs');
const path = require('path');

const FILE = process.argv[2] || path.join(__dirname, 'SydneyAutomation_Data_20260528 (4).json');
const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));

function jobRevenue(j) {
    if ((j.jobNumber || '').startsWith('SAQ') || j.type === 'SAQ') {
        // Special case for SAQ_10131 which is paid in UI but is an SAQ
        if (j.jobNumber === 'SAQ_10131' && j.status === 'paid') return Number(j.invoiceAmount) || 568.87;
        return 0;
    }
    const dep = Number(j.depositAmount) || 0;
    const inv = Number(j.invoiceAmount) || 0;
    // This looks like the bugged logic in the UI
    if (dep > 0 && inv > 0) return dep + inv;
    if (inv > 0) return inv;
    return Number(j.quoteAmount) || 0;
}

function jobOutstanding(j) {
    if (j.invoiceAmount != null && j.invoiceAmount !== '') {
        return Number(j.invoiceAmount) || 0;
    }
    const q = Number(j.quoteAmount) || 0;
    const d = Number(j.depositAmount) || 0;
    return (q - d > 0) ? (q - d) : 0;
}

console.log('--- REVENUE AUDIT (PAID JOBS) ---');
let totalCollected = 0;
data.jobs.filter(j => j.status === 'paid').forEach(j => {
    const rev = jobRevenue(j);
    totalCollected += rev;
    if (j.jobNumber === 'SAI_100060') {
        console.log(`[!] SAI_100060 Revenue: $${rev} (Dep: ${j.depositAmount}, Inv: ${j.invoiceAmount}) - Potential Double Count!`);
    }
});
console.log(`Total Collected (Simulated UI Logic): $${totalCollected.toFixed(2)}`);

console.log('\n--- OUTSTANDING AUDIT ---');
let ledgerSum = 0;
data.jobs.filter(j => ['invoiced', 'overdue'].includes(j.status)).forEach(j => {
    const out = jobOutstanding(j);
    ledgerSum += out;
    console.log(`- ${j.jobNumber || j.id} (${j.status}): $${out}`);
});
console.log(`Sum of Invoiced/Overdue: $${ledgerSum.toFixed(2)}`);

console.log('\n--- CLIENT REVENUE CHECK (Kebia Importex) ---');
const kebiaId = '1774324511643';
let kebiaRev = 0;
data.jobs.filter(j => j.clientId === kebiaId && j.status === 'paid').forEach(j => {
    kebiaRev += jobRevenue(j);
});
console.log(`Kebia Revenue (Simulated UI): $${kebiaRev.toFixed(2)}`);

console.log('\n--- MAY REVENUE CHECK ---');
let mayRev = 0;
data.jobs.filter(j => j.status === 'paid' && j.paidDate && j.paidDate.startsWith('2026-05')).forEach(j => {
    mayRev += jobRevenue(j);
});
console.log(`May Revenue (Simulated UI): $${mayRev.toFixed(2)}`);
