# Sydney Automation Co. Job System — Production Hardening Audit

**Author:** Manus AI  
**Audit date:** 25 August 2026  
**Application:** [Sydney Automation Co. job system](https://sydneyautomationco-job-system.vercel.app/)  
**Repository:** [buddduaviogt668/sydneyautomationco-job-system](https://github.com/buddduaviogt668/sydneyautomationco-job-system)

## Executive assessment

The application is a useful operating tool with substantial workflow coverage: clients, quotes, jobs, approvals, deposits, invoices, debtors, supplier costs, expenses, kilometres, timesheets, backups, cloud synchronisation, AI helpers, and communications. It is not yet equivalent to ServiceM8 or Xero in production assurance. The principal limitation is architectural: the deployed root application is a large client-side single-page app that stores working data in browser storage and performs direct REST synchronisation to Supabase. That model can be made safer, but it cannot provide true accounting-grade auditability, multi-user permissions, immutable financial history, or dependable server-side recovery by front-end patches alone.

The most important financial risk is inconsistent money semantics. Historical records mix GST-inclusive and GST-exclusive values, and the code uses heuristics and hard-coded exceptions to infer the correct display amount. Split deposit and balance invoices are represented inside a job record rather than as first-class linked invoice transactions. This caused the earlier AJB, Matrix, Quest, Towns, and Black Rock debtor inconsistencies. The immediate operating risk is cash collection and reconciliation; the strategic product risk is data integrity across devices and users.

## Current strengths

The application already has several positive controls. It has stable job and invoice reference generation, data-file export and restore, rolling local backups, checksum manifests, conflict detection before verified cloud pushes, overdue-status scanning, invoice-reference guards, a data-integrity audit, quick capture for expenses and supplier invoices, and an explicit deposit-status migration. The existing upgrade plan correctly identifies the need for authenticated server-side APIs, a canonical cloud model, first-class invoices and payments, and role-based access.

## Findings by area

| Area | Severity | Finding | Consequence |
|---|---|---|---|
| Financial amounts | Critical | Historical `invoiceAmount`, `quoteAmount`, and GST conventions are mixed; `jobAmountDisplay` relies on heuristics and hard-coded confirmed exceptions. | Debtors, revenue, GST, and profit can disagree. |
| Deposit and balance invoices | Critical | Deposit and balance are not universally represented as separate invoice records. | Deposit can be hidden, duplicated, or treated as paid when it is not. |
| Debtors | High | The debtors screen can show one combined row rather than separate linked deposit and balance rows. | Follow-up, due-date tracking, and payment allocation are ambiguous. |
| Due dates | High | Some invoices have no due date; terms are not uniformly derived from issue date. | Current invoices can appear overdue or disappear from collection workflows. |
| Authentication | Critical | No visible login or organisation-membership layer was found in the root app. | Anyone with access to the app/device context may be able to use the application. |
| Client-side secrets | Critical | Supabase URL, anon key, and an `x-app-secret` value are embedded in the client bundle. | The custom secret is not secret and should not be relied upon for protection. |
| Persistence | High | Browser localStorage is a working database; file and cloud saves are asynchronous and cloud writes are per dataset. | Browser loss, quota failure, partial writes, or device conflicts can cause operational disruption. |
| Restore | High | Full restore replaces current data after a confirmation, but there is no visible dry-run diff or automatic pre-restore snapshot. | A mistaken restore can replace valid current records. |
| Audit trail | High | Many edits mutate records directly; paid status is not consistently an append-only payment event. | It is difficult to prove who changed what and when. |
| Data migrations | High | Several startup migrations and repairs mutate records automatically; some are based on hard-coded job references. | A future release can alter historical data without a review queue. |
| XSS/rendering | Medium | Many views use `innerHTML`; a global escape helper exists, but not every dynamic rendering path is demonstrably escaped. AI output is inserted after simple Markdown replacements. | Malicious or malformed stored text could become executable markup. |
| Testing | High | Existing regression scripts contained hard-coded Windows paths and no standard CI test command. | Checks are not portable or reliably repeatable. |
| Architecture | Critical | The repository contains a tracked root `index.html` application and a separate nested React/Vite `master-system` template. | Deployment ownership and source-of-truth can be confused. |

## Data reconciliation observations

The live operational review identified the following corrected positions:

| Account | Correct treatment | Amount |
|---|---|---:|
| AJB Electrical | Deposit and balance both unpaid | $24,035.00 |
| Matrix Electrical Group | Four overdue invoices | $3,886.00 |
| Quest Apartments | Overdue invoice | $797.50 |
| Towns Security | Overdue invoice | $770.00 |
| Ivo Andrejco | Overdue invoice based on current record | $715.00 |
| Black Rock Electrical | Current invoice, seven-day term from 20 August issue date | $1,100.00 |

The corrected overdue total is approximately **$6,168.50**. Including AJB and the current Black Rock invoice, total outstanding exposure is approximately **$31,303.50**. These figures must be validated against the bank and invoice documents before being treated as accounting records.

The repository export audit also found three legacy exceptions requiring review rather than automatic overwrite: SAI_100060 has a line total of $3,995 while its stored invoice amount is the $1,997.50 balance; SAI_100059 has an $8.40 line sum versus a $558.40 stored invoice amount; and kilometre trip `hist_19` refers to missing job SAI_100041. SAI_100062 was cleaned for Maggie Yiu: it remains a $0 job with notes, but its invoice fields and misleading Paid status were removed/set to Lost.

## Required target model

A production-safe finance model should make every invoice a durable transaction with stable ID, customer, job/opportunity link, subtotal, GST rate, GST amount, total including GST, issue date, due date, status, paid date, and audit events. A deposit invoice and balance invoice should be separate records linked to one job or opportunity. Payments should be separate records allocated to one or more invoices. Edits should create versions or events rather than silently replacing prior financial facts.

Monthly reporting should use explicit bases: invoice issue date for invoiced revenue, payment date for collected cash, invoice due date for ageing, supplier invoice date for costs, and expense date for operating expenses. GST reporting should use the stored GST amount, not infer GST from differences between unrelated quote and invoice fields.

## Priority remediation plan

### P0 — protect data and stop financial ambiguity

1. Introduce a canonical invoice schema with explicit GST fields and a migration review screen.
2. Add first-class deposit and balance invoice rows to the debtors screen without changing the combined job total.
3. Require invoice issue dates and calculate due dates from customer terms; preserve existing due dates on historical invoices unless explicitly corrected.
4. Prevent Paid status without a payment date and payment amount; make Void/Cancelled non-financial states.
5. Add a dry-run and automatic pre-restore snapshot before any backup restore.
6. Replace direct browser reliance on `x-app-secret` with authenticated server-side access and protected environment variables.

### P1 — make operation dependable

1. Move authoritative data to authenticated Supabase tables with organisation IDs, row-level security, stable IDs, updated timestamps, version numbers, soft deletion, and audit events.
2. Replace per-dataset timestamp wins with transactional versioned writes and explicit conflict resolution.
3. Add idempotency keys for invoice creation, payment recording, exports, reminders, and integrations.
4. Add a searchable activity/audit log for jobs, quotes, invoices, deposits, payments, costs, and deletes.
5. Add automated tests for GST, deposits, payment allocation, ageing, monthly reports, imports, restores, and conflict scenarios.

### P2 — improve field-service parity

1. Add sites, assets, systems, checklists, technician assignment, time approval, photos, signatures, service reports, warranty, and recurring maintenance as first-class records.
2. Add an accounting export/reconciliation workflow rather than presenting the app as a replacement for Xero.
3. Add collection workflows with customer-level terms, reminder schedules, promise-to-pay notes, and days-sales-outstanding reporting.
4. Add accessibility and mobile regression testing, especially for job close-out, receipt capture, and invoice review.

## Release gates

A release should not be called production-ready until all of the following pass: a clean build; portable automated tests; no duplicate invoice references; no paid invoice without payment date; no orphaned invoice, payment, cost, or attachment; deposit plus balance equals job total; invoice subtotal plus GST equals invoice total; debtor total equals invoice total less allocated payments; restore dry-run and checksum verification; cloud conflict test; mobile smoke test; and a security review confirming no application secret is shipped to the browser.

## Current recommendation

Do not attempt to reach ServiceM8/Xero reliability by adding more client-side heuristics to the existing root file. Continue using the current app as an operational client, but harden the immediate financial and backup controls first, then migrate the authoritative data and permissions to a server-side authenticated model. The existing `UPGRADE_PLAN.md` is directionally correct and should become the implementation roadmap.

## References

[1]: https://sydneyautomationco-job-system.vercel.app/ "Sydney Automation Co. job system"
[2]: https://github.com/buddduaviogt668/sydneyautomationco-job-system "Sydney Automation Co. job-system repository"

## Leakage-prevention release update — 25 August 2026

The latest release adds three additional controls. New Quick Invoices now record explicit GST metadata and use the canonical due-date resolver. Invoice creation refuses to reuse an existing invoice or job reference. Backup restore now validates the incoming structure, displays record counts, and downloads a safety copy before replacing current data. The in-app integrity audit now flags issued invoices without due dates and deposits without an explicit status/date.

The debtor view and printed debtor report now expose separate deposit and balance entries. A paid deposit produces only the remaining balance row; an unpaid deposit produces a separate deposit row; and an ordinary invoice remains a single row. The job-level total is not added twice.

The live deployment was smoke-tested after the debtor release. The production runtime-error check returned no grouped runtime errors in the previous seven-day window. The live integrity audit after the authorised Maggie cleanup now reports one unresolved exception: duplicate invoice reference SAI_100041 on two historical records. That exception remains intentionally unresolved because changing either historical reference without the owner’s direction could break reconciliation.

These controls make the current browser application more leakage-resistant, but they do not make it equivalent to Xero’s accounting ledger or ServiceM8’s authenticated multi-user platform. Server-side authentication, row-level security, transactional writes, immutable payment events, and a first-class invoice/payment database remain the next major architectural release.
