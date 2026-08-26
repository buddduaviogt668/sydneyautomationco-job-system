import csv
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

ROOT = Path('/home/ubuntu/sydneyautomationco-job-system')
def q(v):
    return Decimal(str(v)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
rows = {r['job_number']: r for r in csv.DictReader((ROOT/'reconciliation_output/job_profit_reconciliation.csv').open())}
expected = {
    'SAI_100067': {'revenue': q('3250.00'), 'cost': q('1834.26'), 'ref': '00000729'},
    'SAI_100070': {'revenue': q('1550.00'), 'cost': q('714.55'), 'ref': '102'},
    'SAI_100097': {'revenue': q('2258.92'), 'cost': q('935.88'), 'ref': '163'},
}
for job, e in expected.items():
    r = rows[job]
    assert q(r['revenue_gst_inc']) == e['revenue'], (job, r['revenue_gst_inc'])
    assert q(r['direct_cost_total']) == e['cost'], (job, r['direct_cost_total'])
    assert r['supplier_refs'] == e['ref'], (job, r['supplier_refs'])
    assert r['flags'] == 'OK', (job, r['flags'])
# GST treatment: only the post-registration customer invoice and #163 input GST are claimable.
post_gst_revenue = q('2258.92')
assert q(post_gst_revenue / q('1.10')) == q('2053.56')
assert q(post_gst_revenue - q('2053.56')) == q('205.36')
assert q('935.88' ) - q('850.80') == q('85.08')
print('VALDIS_VERIFICATION_OK')
for job in expected:
    r=rows[job]
    print(job, 'revenue=', r['revenue_gst_inc'], 'direct_cost=', r['direct_cost_total'], 'gross_profit=', r['gross_profit_before_overhead'], 'margin=', r['gross_margin_pct']+'%', 'ref=', r['supplier_refs'])
