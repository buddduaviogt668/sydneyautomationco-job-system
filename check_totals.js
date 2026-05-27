const fs = require('fs');

try {
    const data = JSON.parse(fs.readFileSync('SydneyAutomation_Backup_2026-05-27.json', 'utf8'));
    
    let totalInvoiced = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    
    const overdueJobs = [];
    const supplierInvoices = [];
    
    data.jobs.forEach(job => {
        if (job.status === 'lost') return;
        if (job.status === 'quoted') return;
        if (job.status === 'lead') return;

        const amount = parseFloat(job.invoiceAmount) || 0;
        
        // Summing up everything that is invoiced, overdue, scheduled, paid, approved?
        // Wait, if it has an invoiceAmount and an invoiceNumber, it's invoiced.
        if (job.invoiceNumber && amount > 0) {
            totalInvoiced += amount;
            
            if (job.status === 'paid') {
                totalCollected += amount;
            } else {
                totalOutstanding += amount;
            }
            
            if (job.status === 'overdue') {
                overdueJobs.push(job.jobNumber);
            }
        }
        
        if (job.supplierRef) {
            // this job has a supplier cost? Actually the supplier spend comes from somewhere else.
        }
    });

    console.log(`Total Invoiced: $${totalInvoiced.toFixed(2)}`);
    console.log(`Collected: $${totalCollected.toFixed(2)}`);
    console.log(`Outstanding: $${totalOutstanding.toFixed(2)}`);
    console.log(`Overdue Count: ${overdueJobs.length}`);

} catch (e) {
    console.error(e);
}
