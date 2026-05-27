const fs = require('fs');

try {
    const data = JSON.parse(fs.readFileSync('SydneyAutomation_Backup_2026-05-27.json', 'utf8'));
    const issues = [];
    
    const validStatuses = ["lead", "scheduled", "quoted", "invoiced", "paid", "lost", "overdue", "approved"];

    data.jobs.forEach(job => {
        const jobId = job.jobNumber || job.id;

        // 1. Check status
        if (!job.status) {
            issues.push(`[Job ${jobId}] Missing status.`);
        } else if (!validStatuses.includes(job.status)) {
            issues.push(`[Job ${jobId}] Unknown status: "${job.status}".`);
        }

        // 2. Paid vs paidDate
        if (job.status === "paid" && (!job.paidDate || job.paidDate.trim() === "")) {
            issues.push(`[Job ${jobId}] Status is "paid" but "paidDate" is missing or empty.`);
        }
        if (job.status !== "paid" && job.paidDate && job.paidDate.trim() !== "") {
            issues.push(`[Job ${jobId}] Status is "${job.status}" but it has a "paidDate" (${job.paidDate}).`);
        }

        // 3. Deposit logic
        const invoiceAmount = parseFloat(job.invoiceAmount) || 0;
        const depositAmount = parseFloat(job.depositAmount) || 0;
        const quoteAmount = parseFloat(job.quoteAmount) || 0;

        // Sometimes the quote amount doesn't match invoice amount, let's see if it's way off without explanation
        // Actually, scope change often explains it, maybe ignore this unless requested.
        
        // Let's check for date formatting issues (YYYY-MM-DD is standard)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (job.createdAt && job.createdAt.trim() !== "" && !dateRegex.test(job.createdAt)) {
            issues.push(`[Job ${jobId}] "createdAt" date format is unusual: ${job.createdAt}`);
        }
        if (job.paidDate && job.paidDate.trim() !== "" && !dateRegex.test(job.paidDate)) {
            issues.push(`[Job ${jobId}] "paidDate" date format is unusual: ${job.paidDate}`);
        }
        if (job.scheduledDate && job.scheduledDate.trim() !== "" && !dateRegex.test(job.scheduledDate)) {
            issues.push(`[Job ${jobId}] "scheduledDate" date format is unusual: ${job.scheduledDate}`);
        }
    });

    if (issues.length === 0) {
        console.log("No obvious structural or logical issues found.");
    } else {
        console.log("Found the following potential issues:");
        issues.forEach(i => console.log(i));
    }

} catch (e) {
    console.error("Error processing file:", e);
}
