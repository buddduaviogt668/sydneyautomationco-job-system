# Valdis supplier and labour invoice reconciliation

The supplied documents now include three invoices associated with work at 36 William Street, Henley NSW 2111, matching the Valdis Berzins customer address in the protected baseline.

| Invoice | Supplier | Date | Work / description | Subtotal | GST | Total | Paid / balance |
|---|---|---|---|---:|---:|---:|---:|
| J Lydement #163 | J Lydement Electrical Pty Ltd | 24 Jul 2026 | Nuisance tripping, GPOs, heat-lamp fittings, pool equipment and lighting fault finding | $850.80 | $85.08 | $935.88 | Paid $0.00 / due $935.88 |
| J Lydement #102 | J Lydement Electrical Pty Ltd | 26 May 2026 | C-Bus network fault finding, cable tracing, sensor reconnection and recommissioning | $600.00 | $60.00 | $660.00 | Paid $0.00 / due $660.00 |
| Sharper #00000729 | Sharper Automation Pty Limited | 26 May 2026 (due 9 Jun 2026) | Supply of 1 x 4-channel dimmer and 5 x C-Bus power supplies | $1,625.87 | $162.59 | $1,788.46 | Paid $0.00 / due $1,788.46 |

Combined invoice totals: subtotal $3,076.67; GST $307.67; GST-inclusive total $3,384.34; unpaid balance $3,384.34.

Matching observations: Invoice #102 matches the existing SAI_100070 linked labour record of $660.00 and its description is consistent with that job. Sharper #00000729 matches the existing SAI_100067 linked parts record, currently recorded as $1,788.44; the invoice image totals $1,788.46, a $0.02 discrepancy likely due to source rounding/data-entry. Invoice #163 is the additional $935.88 invoice previously missing from the protected baseline; its address and work description match Valdis, but it has no SAI job number and should be linked to the correct Valdis service job only after confirmation.

Important accounting rule: these supplier invoices are GST-inclusive cash costs. The GST components sum to $307.67 and should not be added on top of the totals when calculating job cost. Stripe fees previously recorded for SAI_100067 and SAI_100070 are separate business expenses and should be kept separate from supplier invoice amounts.
