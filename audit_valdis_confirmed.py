import json
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

ROOT = Path('/home/ubuntu/sydneyautomationco-job-system')
data = json.loads((ROOT / '.private-recovery' / 'data.baseline.json').read_text())
clients = {c.get('id'): c for c in data.get('clients', [])}
jobs = data.get('jobs', [])
sup = data.get('supInvoices', [])
expenses = data.get('expenses', [])

def money(v):
    return Decimal(str(v or 0)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

valdis = [j for j in jobs if clients.get(j.get('clientId'), {}).get('company') == 'Valdis Berzins' or j.get('client') == 'Valdis Berzins' or j.get('company') == 'Valdis Berzins']
print('VALDIS_JOBS')
for j in valdis:
    print(json.dumps({k: j.get(k) for k in ['id','jobNumber','status','gstExempt','quoteAmount','invoiceAmount','depositAmount','invoiceNumber','invoiceDate','paidDate','scope','address','siteAddress','notes']}, ensure_ascii=False))
    linked_sup = [i for i in sup if i.get('jobId') == j.get('id') or i.get('jobRef') == j.get('jobNumber')]
    linked_exp = [i for i in expenses if i.get('jobId') == j.get('id') or i.get('jobRef') == j.get('jobNumber')]
    print('SUP', json.dumps(linked_sup, ensure_ascii=False))
    print('EXP', json.dumps(linked_exp, ensure_ascii=False))

print('ALL_JOB_NUMBERS_MATCHING_100097')
for j in jobs:
    if '100097' in str(j.get('jobNumber')) or '100097' in json.dumps(j):
        print(json.dumps(j, ensure_ascii=False))

print('GST_CONFIG', json.dumps(data.get('cfg', {}), ensure_ascii=False))
