const fs = require('fs');
const path = require('path');

const FILE_TO_AUDIT = path.join('C:', 'Users', 'gaska', 'SydneyAutomation_Data_20260526 (10).json');
const TODAY = new Date('2026-05-28');

function audit() {
    console.log(`\n================================================================`);
    console.log(`DEEP DATA AUDIT: ${FILE_TO_AUDIT}`);
    console.log(`================================================================\n`);

    let raw;
    try {
        raw = fs.readFileSync(FILE_TO_AUDIT, 'utf8');
    } catch (e) {
        console.error(`Error: Could not read file.`);
        return;
    }

    let data;
    try {
        data = JSON.parse(raw);
    } catch (e) {
        console.error(`Error: Could not parse JSON.`);
        return;
    }

    const issues = [];
    const jobs = data.jobs || [];
    const clients = data.clients || [];
    const supInvoices = data.supInvoices || [];
    const expenses = data.expenses || [];
    const kmLog = data.kmLog || [];
    const partsdb = data.partsdb || [];

    const clientIds = new Set(clients.map(c => c.id));
    const jobIds = new Set(jobs.map(j => j.id));
    const jobNumbers = {}; // num -> id

    console.log(`- Data Version: ${data.version}`);
    console.log(`- Statistics: ${jobs.length} Jobs, ${clients.length} Clients, ${supInvoices.length} Supplier Invoices, ${expenses.length} Expenses, ${kmLog.length} KM Trips, ${partsdb.length} Parts.\n`);

    // --- 1. CLIENT AUDIT ---
    clients.forEach(c => {
        if (!c.id) issues.push(`[Client] Missing ID for entry: ${JSON.stringify(c).substring(0, 50)}...`);
        if (!c.company && !c.contact) issues.push(`[Client ${c.id}] Missing both Company and Contact name.`);
    });

    // --- 2. JOB AUDIT ---
    jobs.forEach(j => {
        const idLabel = j.jobNumber || j.id;
        
        // ID & Numbering
        if (j.jobNumber) {
            if (jobNumbers[j.jobNumber] && jobNumbers[j.jobNumber] !== j.id) {
                issues.push(`[Job] Duplicate Job Number "${j.jobNumber}" (IDs: ${jobNumbers[j.jobNumber]}, ${j.id})`);
            }
            jobNumbers[j.jobNumber] = j.id;
        }

        // Referential Integrity
        if (j.clientId && !clientIds.has(j.clientId)) {
            issues.push(`[Job ${idLabel}] Linked to non-existent Client ID: "${j.clientId}"`);
        }

        // Financial Logic
        const quote = parseFloat(j.quoteAmount) || 0;
        const dep = parseFloat(j.depositAmount) || 0;
        const inv = parseFloat(j.invoiceAmount) || 0;
        
        if (j.invoiceLines && j.invoiceLines.length > 0) {
            let linesSum = 0;
            j.invoiceLines.forEach((l, idx) => {
                const amt = parseFloat(l.amount) || 0;
                const calc = Number(((parseFloat(l.qty) || 0) * (parseFloat(l.unit) || 0)).toFixed(2));
                if (Math.abs(calc - amt) > 0.01) {
                    issues.push(`[Job ${idLabel}] Line ${idx+1} math error: Qty*Unit=$${calc}, but Amount=$${amt}`);
                }
                linesSum += amt;
            });
            linesSum = Number(linesSum.toFixed(2));
            if (inv > 0 && Math.abs(linesSum - inv) > 0.01) {
                const notes = (j.notes || '') + (j.scope || '');
                if (notes.toLowerCase().includes('parking') && Math.abs(linesSum + 75 - inv) < 0.01) {
                    issues.push(`[Job ${idLabel}] Invoice discrepancy: Sum of lines ($${linesSum}) is $75 less than total ($${inv}). Notes mention parking.`);
                } else if (dep > 0 && Math.abs(linesSum - quote) < 0.01 && Math.abs(inv - (quote - dep)) < 0.01) {
                    issues.push(`[Job ${idLabel}] Invoice discrepancy: Lines show total ($${linesSum}), but invoiceAmount is only balance ($${inv}).`);
                } else {
                    issues.push(`[Job ${idLabel}] Invoice discrepancy: Sum of lines ($${linesSum}) does not match invoiceAmount ($${inv}).`);
                }
            }
        } else if (['paid', 'invoiced', 'overdue'].includes(j.status) && inv > 0) {
            issues.push(`[Job ${idLabel}] Status "${j.status}" with $${inv} invoiced, but has 0 line items.`);
        }

        // Date Integrity
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        ['createdAt', 'paidDate', 'scheduledDate', 'invoiceDue'].forEach(field => {
            if (j[field] && typeof j[field] === 'string' && j[field] !== "" && !dateRegex.test(j[field])) {
                issues.push(`[Job ${idLabel}] Invalid date format in ${field}: "${j[field]}" (Expected YYYY-MM-DD)`);
            }
        });

        if (j.status === 'paid' && !j.paidDate) issues.push(`[Job ${idLabel}] Status is "paid" but "paidDate" is missing.`);
    });

    // --- 3. SUPPLIER INVOICE AUDIT ---
    supInvoices.forEach(inv => {
        const label = `SupInv ${inv.id}`;
        if (inv.jobId && !jobIds.has(inv.jobId)) {
            issues.push(`[${label}] Linked to non-existent Job ID: "${inv.jobId}"`);
        }
        if (inv.jobId) {
            const job = jobs.find(j => j.id === inv.jobId);
            if (job && inv.jobRef) {
                const jobNumOnly = (job.jobNumber || '').replace(/\D/g, '');
                const invRefOnly = (inv.jobRef || '').replace(/\D/g, '');
                if (jobNumOnly !== invRefOnly) {
                    issues.push(`[${label}] Reference mismatch: Inv says "${inv.jobRef}", but Job is "${job.jobNumber}"`);
                }
            }
        }
    });

    // --- 4. EXPENSE AUDIT ---
    expenses.forEach(e => {
        if (e.jobId && !jobIds.has(e.jobId)) {
            issues.push(`[Expense ${e.id}] Linked to non-existent Job ID: "${e.jobId}"`);
        }
    });

    // --- 5. KM LOG AUDIT ---
    kmLog.forEach(trip => {
        if (trip.jobRef) {
            const job = jobs.find(j => j.jobNumber === trip.jobRef);
            if (!job) {
                issues.push(`[KM Trip ${trip.id}] Linked to unknown Job Number: "${trip.jobRef}"`);
            }
        }
    });

    // --- 6. PARTS DB AUDIT ---
    partsdb.forEach(p => {
        if (!p.partNumber) issues.push(`[Part ${p.id}] Missing partNumber.`);
        if (typeof p.buyPrice !== 'number') issues.push(`[Part ${p.id}] buyPrice is not a number: ${typeof p.buyPrice}`);
    });

    // --- RESULTS ---
    if (issues.length === 0) {
        console.log("✅ SUCCESS: No discrepancies found across all fields.");
    } else {
        console.log(`❌ FOUND ${issues.length} ISSUES:\n`);
        issues.forEach((issue, idx) => {
            console.log(`${idx + 1}. ${issue}`);
        });
    }
}

audit();
