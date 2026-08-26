import json
from pathlib import Path

p = Path('/home/ubuntu/sydneyautomationco-job-system/.private-recovery/data.baseline.json')
data = json.loads(p.read_text(encoding='utf-8'))
if isinstance(data, dict):
    jobs = data.get('jobs', [])
    clients = data.get('clients', [])
    expenses = data.get('expenses', [])
    supplier = data.get('supInvoices', data.get('supplierInvoices', data.get('supplier_invoices', [])))
else:
    jobs, clients, expenses, supplier = [], [], [], []
print('top_keys=', list(data.keys()) if isinstance(data, dict) else type(data).__name__)
client = next((c for c in clients if c.get('company') == 'Valdis Berzins'), None)
client_id = client.get('id') if client else None
vj = [j for j in jobs if j.get('clientId') == client_id or j.get('client') == 'Valdis Berzins' or j.get('company') == 'Valdis Berzins']
refs = {j.get('jobNumber') for j in vj}
ve = [e for e in expenses if e.get('jobRef') in refs or e.get('jobNumber') in refs]
job_ids = {j.get('id') for j in vj}
vs = [s for s in supplier if s.get('jobRef') in refs or s.get('jobNumber') in refs or s.get('jobId') in job_ids]
print('client=', client)
print('jobs=')
for j in vj:
    print(json.dumps({k:j.get(k) for k in ['id','jobNumber','status','quoteAmount','invoiceAmount','invoiceNumber','paidDate','scope','partsCost','supplierCost','labourCost','laborCost','cost','totalCost']}, ensure_ascii=False))
print('expenses=')
for e in ve: print(json.dumps(e, ensure_ascii=False))
print('supplier_invoices=')
for s in vs: print(json.dumps(s, ensure_ascii=False))
