const fs = require('fs');

try {
    const data = JSON.parse(fs.readFileSync('SydneyAutomation_Backup_2026-05-27.json', 'utf8'));
    const discrepancies = [];

    data.jobs.forEach(job => {
        const jobId = job.jobNumber || job.id;
        const invoiceAmount = parseFloat(job.invoiceAmount) || 0;
        
        if (job.invoiceLines && job.invoiceLines.length > 0) {
            let linesSum = 0;
            job.invoiceLines.forEach((line, index) => {
                const qty = parseFloat(line.qty) || 0;
                const unit = parseFloat(line.unit) || 0;
                const expectedAmount = Number((qty * unit).toFixed(2));
                const actualAmount = parseFloat(line.amount) || 0;
                
                if (Math.abs(expectedAmount - actualAmount) > 0.01) {
                    discrepancies.push(`[Job ${jobId}] Line ${index + 1}: qty(${qty}) * unit(${unit}) = ${expectedAmount}, but line amount is ${actualAmount}`);
                }
                linesSum += actualAmount;
            });
            
            linesSum = Number(linesSum.toFixed(2));
            if (Math.abs(linesSum - invoiceAmount) > 0.01) {
                discrepancies.push(`[Job ${jobId}] Sum of invoice lines is ${linesSum}, but invoiceAmount is ${invoiceAmount}`);
            }
        }
    });

    if (discrepancies.length === 0) {
        console.log("No financial discrepancies found in invoice lines.");
    } else {
        console.log("Found discrepancies:");
        discrepancies.forEach(d => console.log(d));
    }
} catch (e) {
    console.error("Error processing file:", e);
}
