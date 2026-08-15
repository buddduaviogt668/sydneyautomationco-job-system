# Sydney Automation Co Data Recovery Runbook

## Before any repair

Do not press **Push** from a device when another device may contain newer work. First export a backup from every device that has been used. Keep the original files unchanged and record their filename, timestamp, row counts, and checksum.

Use **Pull** only when the cloud is confirmed to be the desired source of truth. Use **Push** only after a dry-run comparison confirms that the device contains all required jobs, clients, invoices, quotes, expenses, and field records.

## Normal daily procedure

At the end of each working day, confirm that the application shows cloud connected, run **Verify**, and download a dated JSON backup. If the system reports a mismatch, do not continue pushing from multiple devices. Keep working on one nominated device until the conflict is resolved.

## Phone-to-laptop handoff

Export the phone backup first, then export the laptop backup without pushing either one. Compare jobs, clients, quotes, invoices, expenses, payments, timesheets, and kilometre records. The source with the latest complete operational records becomes the recovery source. If the records differ, merge only append-only datasets where stable IDs exist; financial and job changes require explicit review.

After the cloud is repaired, press **Pull** on the second device, run **Verify**, and confirm that the job count, paid revenue, quote totals, expense count, timesheet count, and kilometre-log count match.

## Recovery acceptance checklist

| Check | Required result |
|---|---|
| JSON parses | Yes |
| Schema version is supported | Yes |
| Jobs have unique stable IDs and job numbers | Yes |
| Clients have stable IDs | Yes |
| Invoice amounts are numeric and non-negative | Yes |
| Paid jobs have a paid date or explicit payment event | Yes |
| Deposit and balance records are linked | Yes or flagged for review |
| Kilometre IDs are unique | Yes |
| Expense IDs are unique | Yes |
| Per-dataset checksums are present | Yes |
| Cloud post-write read-back matches the manifest | Yes |

## What to do after a failed sync

If an individual cloud write fails, the application must leave the device marked as unsynchronised and retain the local backup. Do not trust the global timestamp alone. Record the failing dataset, preserve the export, and retry after confirming connectivity.

If a financial dataset differs between devices, do not merge automatically. Create a recovery copy, identify which invoice, payment, quote, or job changed on each device, and resolve the difference in the canonical cloud record. Append-only logs such as kilometre entries can be merged by stable ID.

## Data retention

Keep at least seven daily backups, four weekly backups, and twelve monthly backups. Never overwrite the only copy. Test one restore every month using a separate browser profile or staging environment.
