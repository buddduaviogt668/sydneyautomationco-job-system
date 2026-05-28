const fs = require('fs');

function jobRevenue(j) {
    if ((j.jobNumber || '').startsWith('SAQ') || j.type === 'SAQ') return 0;
    const dep = Number(j.depositAmount) || 0;
    const inv = Number(j.invoiceAmount) || 0;
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

try {
    const data = JSON.parse(fs.readFileSync('SydneyAutomation_Backup_2026-05-27.json', 'utf8'));
    
    let totalCollected = 0;
    let totalOutstanding = 0;
    const overdueJobs = [];
    
    data.jobs.forEach(job => {
        if (['lost', 'quoted', 'lead'].includes(job.status)) return;
        
        if (job.status === 'paid') {
            totalCollected += jobRevenue(job);
        } else if (['invoiced', 'overdue'].includes(job.status)) {
            totalOutstanding += jobOutstanding(job);
            if (job.status === 'overdue') {
                overdueJobs.push(job.jobNumber);
            }
        }
    });

    const totalInvoiced = totalCollected + totalOutstanding;

    console.log(`Total Invoiced: $${totalInvoiced.toFixed(2)}`);
    console.log(`Collected: $${totalCollected.toFixed(2)}`);
    console.log(`Outstanding: $${totalOutstanding.toFixed(2)}`);
    console.log(`Overdue Count: ${overdueJobs.length}`);

} catch (e) {
    console.error(e);
}
