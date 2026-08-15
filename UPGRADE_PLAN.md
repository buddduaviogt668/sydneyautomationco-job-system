# Sydney Automation Co Job System — SaaS Upgrade Plan

## Product goal

Sydney Automation Co should operate as a specialist field-service platform built around C-Bus, Dynalite, DALI, emergency-lighting, electrical fault-finding, and automation projects. The system must make the complete commercial journey visible: lead, paid diagnostic, quote, approval, deposit, scheduled work, field execution, invoice, payment, warranty, and recurring maintenance.

The upgrade principle is **protect first, measure second, automate third, scale fourth**. No new feature should be allowed to silently overwrite jobs, invoices, quotes, payments, or field records.

## Current architecture risks

The current application is a single-page browser application with local browser storage and direct Supabase REST access. It is useful as an operating tool, but it is not yet a multi-tenant SaaS foundation.

| Risk | Impact | Required direction |
|---|---|---|
| Direct browser writes to Supabase | A device can overwrite cloud state | Move writes behind authenticated server-side APIs or transactional database functions |
| One global save timestamp | A newer phone dataset can be mixed with an older laptop dataset | Store per-dataset versions, checksums, and conflict records |
| Public frontend app secret | The secret can be inspected by any user of the site | Replace with authenticated users, role-based access, and server-side secrets |
| localStorage as working database | Browser clearing, device replacement, or quota failure can lose local changes | Treat Supabase as the source of truth and local storage as a cache/offline queue |
| Split invoices and deposit/balance pairs | Average invoice value understates customer value and can double-count revenue | Add a first-class opportunity/project ledger and linked invoice transactions |
| No timesheets in current export | Labour margin cannot be trusted | Add technician time capture, approval, and job-level cost allocation |
| No recurring jobs in current export | Recurring service revenue is invisible | Add service agreements, schedules, renewals, and maintenance history |
| Incomplete expense capture | Net profit is not reliable | Add supplier bills, vehicle costs, subcontractors, and overhead allocation |

## Target operating model

The target system has five layers.

1. **Identity and organisation:** authenticated users, organisation membership, roles, technician permissions, audit trail, and tenant isolation.
2. **Commercial CRM:** clients, sites, assets, systems, leads, opportunities, quote versions, approval history, deposits, and lost-reason analytics.
3. **Field operations:** schedule, dispatch, mobile job view, travel, time, parts, photos, service reports, signatures, checklists, and safety documentation.
4. **Finance:** invoice ledger, payment allocations, deposits, balances, GST, supplier costs, labour cost, margin, overdue collections, and accounting export.
5. **Intelligence and automation:** daily briefing, quote follow-up, overdue reminders, recurring maintenance, capacity planning, margin warnings, and management reporting.

## Release sequence

### Release 1 — Data integrity foundation

This release adds per-dataset manifests, checksums, verified writes, safe merge behaviour for append-only kilometre records, exported manifest metadata, and an in-app Verify action. It is intentionally non-destructive and is being reviewed separately from production.

### Release 2 — Canonical cloud data model

Introduce organisation, user, site, asset, opportunity, job, invoice, payment, cost, time entry, attachment, and audit-event tables. Add stable IDs, created/updated timestamps, soft deletion, version numbers, and database constraints. Existing JSON data should be imported through an idempotent migration, never by manually pasting records into production.

### Release 3 — Authenticated SaaS shell

Introduce login, organisation membership, role-based permissions, server-side API access, and tenant isolation. Remove the frontend app secret. Keep the current single-page app as a temporary migration client until the authenticated shell is ready.

### Release 4 — Commercial and field workflow

Add first-class opportunity/project grouping so a $715 diagnostic, a $3,000 follow-on project, deposit, balance, parts order, and warranty are understood as one customer opportunity. Add technician assignment, time capture, mobile close-out, photos, signatures, and a standard service report.

### Release 5 — Profit and recurring revenue

Add job-level gross margin, real labour cost, materials, travel, subcontractors, overhead allocation, recurring service agreements, renewals, scheduled inspections, and customer lifetime value reporting.

### Release 6 — Automation and integrations

Add transactional email, quote follow-up sequences, invoice reminders, calendar integration, accounting export, payment reconciliation, and controlled background jobs. Every automation must be idempotent, logged, retryable, and visible to the user.

## Non-negotiable safeguards

The system must never silently choose a newer timestamp and overwrite a different dataset. If two devices have different versions, the user must see a conflict summary and choose whether to merge, keep cloud, keep device, or open a recovery copy.

Financial records must be append-only or versioned. Marking an invoice paid should create a payment event rather than destroying the previous state. Deleting a job should be a soft delete with an audit event and recovery path.

Every export must include the schema version, export timestamp, organisation identifier, per-dataset row counts, checksums, and source device identifier. Restore must validate the schema and show a dry-run summary before changing live data.

## Success metrics

| Area | Primary measure |
|---|---|
| Data integrity | Zero unexplained record loss; every restore passes checksum validation |
| Cash conversion | Diagnostic-to-approved-work conversion rate and collected customer value |
| Profitability | Gross margin by opportunity after labour, materials, travel, and subcontractors |
| Operations | Technician utilisation, on-time arrival, first-time fix rate, and return visits |
| Collections | Days sales outstanding and overdue amount by age bucket |
| Recurring revenue | Active agreement value, renewal rate, and maintenance schedule completion |
| Product quality | Error-free syncs, successful backup restores, and no silent write failures |

## Decision rule for scaling

Do not add major fixed capacity solely because quoted pipeline is large. Add technician or vehicle capacity when paid demand, verified margin, cash collection, and documented workflows show sustained capacity pressure for at least four to six weeks.
