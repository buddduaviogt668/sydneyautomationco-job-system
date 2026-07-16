import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, Trash2, GripVertical, Send, Download, Calculator, CheckCircle2, AlertCircle, ChevronRight, FileText, User } from 'lucide-react';
import { useStore } from '../store/useStore';
import { fmt$, today } from '../utils/format';
import { Input, Select, Textarea, Btn, Modal } from '../components/ui/Modal';
import Layout, { PageHeader } from '../components/layout/Layout';

const TARGET_MARGIN = 40;

const newLine = () => ({ id: Date.now() + Math.random(), desc: '', qty: 1, cost: 0, price: 0 });

export default function QuoteBuilder() {
  const { clients, addJob, config } = useStore();

  const [clientId, setClientId] = useState('');
  const [jobType, setJobType] = useState('SAQ');
  const [scope, setScope] = useState('');
  const [notes, setNotes] = useState('');
  const [depositPct, setDepositPct] = useState(config.defaultDepositPct || 50);
  const [payTerms, setPayTerms] = useState(config.defaultPayTermsDays || 7);
  const [lines, setLines] = useState([newLine()]);
  const [saved, setSaved] = useState(false);

  const addLine = () => setLines(l => [...l, newLine()]);
  const removeLine = (id) => setLines(l => l.filter(x => x.id !== id));
  const updateLine = (id, field, value) => setLines(l => l.map(x => x.id === id ? { ...x, [field]: value } : x));

  const calc = useMemo(() => {
    const subtotalCost = lines.reduce((s, l) => s + (Number(l.cost) || 0) * (Number(l.qty) || 1), 0);
    const subtotalPrice = lines.reduce((s, l) => s + (Number(l.price) || 0) * (Number(l.qty) || 1), 0);
    const grossProfit = subtotalPrice - subtotalCost;
    const margin = subtotalPrice > 0 ? (grossProfit / subtotalPrice) * 100 : 0;
    const gstRate = config.gstRegistered ? (config.gstRate || 10) / 100 : 0;
    const gst = subtotalPrice * gstRate;
    const total = subtotalPrice + gst;
    const deposit = total * (depositPct / 100);
    const balance = total - deposit;
    return { subtotalCost, subtotalPrice, grossProfit, margin, gst, total, deposit, balance };
  }, [lines, depositPct, config.gstRegistered, config.gstRate]);

  const client = clients.find(c => c.id === clientId);

  const handleSave = () => {
    if (!scope.trim() && lines.every(l => !l.desc.trim())) return toast.error('Add a scope or line items');
    const quoteAmount = calc.total.toFixed(2);
    const invoiceLines = lines.filter(l => l.desc.trim()).map(l => ({
      id: `l_${Date.now()}_${Math.random().toString(36).slice(2,5)}`,
      desc: l.desc,
      qty: Number(l.qty) || 1,
      unit: Number(l.price) || 0,
      cost: Number(l.cost) || 0,
      amount: (Number(l.qty)||1) * (Number(l.price)||0),
    }));
    addJob({
      id: `job_${Date.now()}`,
      type: jobType,
      status: jobType === 'SAQ' ? 'quoted' : 'invoiced',
      clientId,
      scope,
      notes,
      quoteAmount,
      invoiceAmount: jobType === 'SAI' ? quoteAmount : '',
      depositAmount: depositPct > 0 ? calc.deposit.toFixed(2) : '',
      createdAt: today(),
      jobNumber: `${jobType}_${100000 + Math.floor(Math.random() * 9999)}`,
      invoiceLines,
      activityLog: [{ ts: new Date().toLocaleString('en-AU'), msg: `📋 ${jobType === 'SAQ' ? 'Quote' : 'Invoice'} created via builder` }],
    });
    setSaved(true);
    toast.success(`${jobType === 'SAQ' ? 'Quote' : 'Invoice'} created!`);
  };

  const handlePrint = () => {
    const c = client || {};
    const B = config;
    const w = window.open('', '_blank', 'width=900,height=750');
    const gstRate = B.gstRegistered ? (B.gstRate || 10) / 100 : 0;
    const showGst = B.gstRegistered;
    const lineRows = lines.filter(l => l.desc).map(l =>
      `<tr><td style="padding:10px 14px;font-size:13px;color:#0e1f3d;border-bottom:1px solid #e8edf5">${l.desc}</td>
       <td style="padding:10px 14px;text-align:center;font-size:13px;border-bottom:1px solid #e8edf5">${l.qty}</td>
       <td style="padding:10px 14px;text-align:right;font-size:13px;border-bottom:1px solid #e8edf5">$${Number(l.price).toFixed(2)}</td>
       <td style="padding:10px 14px;text-align:right;font-size:13px;font-weight:700;border-bottom:1px solid #e8edf5">$${((Number(l.qty)||1)*(Number(l.price)||0)).toFixed(2)}</td></tr>`
    ).join('');
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Quote</title>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',sans-serif;background:#fff;color:#0f172a}@media print{button{display:none!important}*{-webkit-print-color-adjust:exact!important}}</style>
    </head><body style="padding:40px;max-width:860px;margin:0 auto">
    <button onclick="window.print()" style="margin-bottom:24px;background:#0f172a;color:#fff;border:none;border-radius:8px;padding:10px 20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">🖨 Print / Save PDF</button>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px">
      <div>
        <div style="font-size:28px;font-weight:900;color:#0f172a;letter-spacing:-0.5px">${B.bizName || 'Sydney Automation Co.'}</div>
        <div style="font-size:12px;color:#64748b;margin-top:4px">${B.bizEmail || ''} · ${B.bizPhone || ''}</div>
        ${B.bizLicence ? `<div style="font-size:12px;color:#64748b">Lic: ${B.bizLicence}</div>` : ''}
        ${B.gstRegistered && B.bizABN ? `<div style="font-size:12px;color:#64748b">ABN: ${B.bizABN}</div>` : ''}
      </div>
      <div style="text-align:right">
        <div style="font-size:11px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">${jobType === 'SAQ' ? 'QUOTATION' : 'TAX INVOICE'}</div>
        <div style="font-size:22px;font-weight:900;color:#0f172a">${jobType}_DRAFT</div>
        <div style="font-size:12px;color:#64748b;margin-top:4px">${new Date().toLocaleDateString('en-AU',{day:'numeric',month:'long',year:'numeric'})}</div>
      </div>
    </div>
    <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px">
      <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Bill To</div>
      <div style="font-size:16px;font-weight:700;color:#0f172a">${c.company || c.contact || 'Client'}</div>
      ${c.contact && c.company ? `<div style="font-size:13px;color:#64748b">${c.contact}</div>` : ''}
      ${c.address ? `<div style="font-size:13px;color:#64748b">${c.address}</div>` : ''}
      ${c.email ? `<div style="font-size:13px;color:#64748b">${c.email}</div>` : ''}
    </div>
    ${scope ? `<div style="margin-bottom:20px"><div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Scope of Works</div><div style="font-size:13px;color:#334155;line-height:1.6;white-space:pre-wrap">${scope}</div></div>` : ''}
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      <thead><tr style="background:#0f172a">
        <th style="padding:10px 14px;text-align:left;font-size:10px;font-weight:700;color:#fff;text-transform:uppercase">Description</th>
        <th style="padding:10px 14px;text-align:center;font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;width:60px">Qty</th>
        <th style="padding:10px 14px;text-align:right;font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;width:100px">Unit</th>
        <th style="padding:10px 14px;text-align:right;font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;width:110px">Amount</th>
      </tr></thead>
      <tbody>${lineRows}</tbody>
    </table>
    <div style="display:flex;justify-content:flex-end;margin-bottom:24px">
      <div style="min-width:260px">
        <div style="display:flex;justify-content:space-between;padding:8px 14px;font-size:13px;border-bottom:1px solid #e2e8f0"><span style="color:#64748b">Subtotal</span><span>$${calc.subtotalPrice.toFixed(2)}</span></div>
        ${showGst ? `<div style="display:flex;justify-content:space-between;padding:8px 14px;font-size:13px;border-bottom:1px solid #e2e8f0"><span style="color:#64748b">GST (${B.gstRate || 10}%)</span><span>$${calc.gst.toFixed(2)}</span></div>` : ''}
        <div style="display:flex;justify-content:space-between;padding:12px 14px;font-size:16px;font-weight:900;background:#0f172a;color:#fff;border-radius:0 0 8px 8px"><span>TOTAL</span><span>$${calc.total.toFixed(2)}</span></div>
        ${depositPct > 0 ? `<div style="display:flex;justify-content:space-between;padding:8px 14px;font-size:13px;color:#6366f1;font-weight:700;margin-top:8px"><span>Required Deposit (${depositPct}%)</span><span>$${calc.deposit.toFixed(2)}</span></div>` : ''}
      </div>
    </div>
    <div style="font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:12px">Payment due within ${payTerms} days.${showGst ? ' Tax invoice for GST purposes.' : ''}</div>
    </body></html>`);
    w.document.close();
  };

  return (
    <Layout>
      <PageHeader
        title="Quote & Invoice Builder"
        subtitle="Interactive builder with live margin tracking"
        actions={
          <>
            <Btn variant="secondary" onClick={handlePrint}><Download size={14}/> Preview PDF</Btn>
            <Btn onClick={handleSave} disabled={saved}>{saved ? <><CheckCircle2 size={14}/> Saved</> : <><Send size={14}/> Save {jobType === 'SAQ' ? 'Quote' : 'Invoice'}</>}</Btn>
          </>
        }
      />

      {saved && (
        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="mx-6 mt-4 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3 flex items-center gap-3">
          <CheckCircle2 size={18} className="text-emerald-600"/>
          <span className="text-sm font-semibold text-emerald-800">Saved! Check Jobs or Quotes for the new record.</span>
          <Btn variant="ghost" size="sm" className="ml-auto" onClick={() => setSaved(false)}>Create Another</Btn>
        </motion.div>
      )}

      <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Builder */}
        <div className="xl:col-span-2 space-y-5">
          {/* Job Setup */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><User size={16} className="text-indigo-500"/> Client & Job Setup</h3>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Document Type" value={jobType} onChange={e => setJobType(e.target.value)}>
                <option value="SAQ">SAQ — Quote / Estimate</option>
                <option value="SAI">SAI — Tax Invoice</option>
              </Select>
              <Select label="Client" value={clientId} onChange={e => setClientId(e.target.value)}>
                <option value="">— Select Client —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.company || c.contact}</option>)}
              </Select>
              <div className="col-span-2"><Textarea label="Scope of Works" value={scope} onChange={e => setScope(e.target.value)} rows={3} placeholder="Describe the full scope of works…"/></div>
              <Input label={`Deposit %`} type="number" min={0} max={100} value={depositPct} onChange={e => setDepositPct(Number(e.target.value))}/>
              <Input label="Payment Terms (days)" type="number" value={payTerms} onChange={e => setPayTerms(Number(e.target.value))}/>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><FileText size={16} className="text-indigo-500"/> Line Items</h3>
              <Btn variant="secondary" size="sm" onClick={addLine}><Plus size={14}/> Add Line</Btn>
            </div>

            {/* Column Headers */}
            <div className="grid grid-cols-12 gap-2 px-5 py-2 bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
              <div className="col-span-4">Description</div>
              <div className="col-span-1 text-center">Qty</div>
              <div className="col-span-2 text-right">Cost (Int.)</div>
              <div className="col-span-2 text-right">Unit Price</div>
              <div className="col-span-2 text-right">Line Total</div>
              <div className="col-span-1"></div>
            </div>

            <div className="divide-y divide-slate-50">
              <AnimatePresence>
                {lines.map((line) => (
                  <motion.div key={line.id} initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, scale:0.97 }}
                    className="grid grid-cols-12 gap-2 px-5 py-3 items-center group hover:bg-slate-50/50 transition-colors">
                    <div className="col-span-4">
                      <input value={line.desc} onChange={e => updateLine(line.id, 'desc', e.target.value)}
                        placeholder="Description of work or material…"
                        className="w-full text-sm text-slate-800 bg-transparent border-0 outline-none focus:bg-slate-100 rounded px-2 py-1 -ml-2 transition-colors placeholder-slate-300"/>
                    </div>
                    <div className="col-span-1">
                      <input type="number" value={line.qty} onChange={e => updateLine(line.id, 'qty', e.target.value)} min={0}
                        className="w-full text-sm text-center text-slate-700 bg-slate-100 border border-slate-200 rounded-lg py-1.5 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200"/>
                    </div>
                    <div className="col-span-2 relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                      <input type="number" value={line.cost} onChange={e => updateLine(line.id, 'cost', e.target.value)} min={0}
                        className="w-full text-sm text-right text-slate-500 bg-slate-100 border border-slate-200 rounded-lg py-1.5 pr-2 pl-5 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"/>
                    </div>
                    <div className="col-span-2 relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                      <input type="number" value={line.price} onChange={e => updateLine(line.id, 'price', e.target.value)} min={0}
                        className="w-full text-sm text-right font-semibold text-slate-800 bg-indigo-50 border border-indigo-200 rounded-lg py-1.5 pr-2 pl-5 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200"/>
                    </div>
                    <div className="col-span-2 text-right text-sm font-bold text-slate-800 pr-1">
                      {fmt$((Number(line.qty)||1) * (Number(line.price)||0))}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button onClick={() => removeLine(line.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Totals row */}
            <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 grid grid-cols-12 gap-2 text-sm">
              <div className="col-span-7 text-right text-slate-500 font-semibold pr-2">Subtotal (ex GST)</div>
              <div className="col-span-4 text-right font-bold text-slate-800">{fmt$(calc.subtotalPrice)}</div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <Textarea label="Internal Notes (not shown on document)" value={notes} onChange={e => setNotes(e.target.value)} rows={2}/>
          </div>
        </div>

        {/* Right: Live Analytics */}
        <div className="space-y-4">
          {/* Financial Summary */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-20"/>
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-violet-500 rounded-full blur-2xl opacity-20"/>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2"><Calculator size={13}/> Live Financials</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-slate-400 text-sm">Subtotal (Ex GST)</span>
                <span className="font-mono text-base font-bold">{fmt$(calc.subtotalPrice)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-slate-400 text-sm">GST (10%)</span>
                <span className="font-mono text-slate-300">{fmt$(calc.gst)}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-white font-bold text-lg">Total Due</span>
                <span className="font-mono text-3xl font-black bg-gradient-to-r from-indigo-300 to-violet-200 bg-clip-text text-transparent">{fmt$(calc.total)}</span>
              </div>
            </div>

            {depositPct > 0 && (
              <div className="mt-6 bg-black/30 rounded-xl p-4 border border-white/5">
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deposit ({depositPct}%)</span>
                  <span className="text-indigo-400 font-bold font-mono">{fmt$(calc.deposit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Balance</span>
                  <span className="text-slate-300 font-mono">{fmt$(calc.balance)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Margin Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Internal Profitability</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Est. Profit</div>
                <div className="text-lg font-black text-slate-800">{fmt$(calc.grossProfit)}</div>
              </div>
              <div className={`rounded-xl p-3 border ${calc.margin >= TARGET_MARGIN ? 'bg-emerald-50 border-emerald-100' : calc.margin >= 25 ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'}`}>
                <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${calc.margin >= TARGET_MARGIN ? 'text-emerald-600' : calc.margin >= 25 ? 'text-amber-600' : 'text-red-600'}`}>Margin</div>
                <div className={`text-2xl font-black ${calc.margin >= TARGET_MARGIN ? 'text-emerald-700' : calc.margin >= 25 ? 'text-amber-700' : 'text-red-700'}`}>{calc.margin.toFixed(1)}%</div>
              </div>
            </div>
            {/* Margin bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2">
              <motion.div initial={{ width:0 }} animate={{ width:`${Math.min(100, calc.margin)}%` }} transition={{ duration:0.5 }}
                className={`h-2 rounded-full ${calc.margin >= TARGET_MARGIN ? 'bg-emerald-500' : calc.margin >= 25 ? 'bg-amber-400' : 'bg-red-500'}`}/>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {calc.margin >= TARGET_MARGIN
                ? <><CheckCircle2 size={13} className="text-emerald-500"/><span className="text-emerald-600 font-semibold">Target margin achieved (≥{TARGET_MARGIN}%)</span></>
                : <><AlertCircle size={13} className="text-amber-500"/><span className="text-amber-600 font-semibold">Below target ({TARGET_MARGIN}%) — review pricing</span></>
              }
            </div>
          </div>

          {/* Per-line analysis */}
          {lines.filter(l => l.price > 0).length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Line Analysis</h3>
              <div className="space-y-2">
                {lines.filter(l => l.price > 0).map(l => {
                  const lineTotal = (Number(l.qty)||1) * (Number(l.price)||0);
                  const lineCost = (Number(l.qty)||1) * (Number(l.cost)||0);
                  const lm = lineTotal > 0 ? ((lineTotal - lineCost) / lineTotal) * 100 : 0;
                  return (
                    <div key={l.id} className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-600 truncate">{l.desc || 'Unnamed'}</div>
                        <div className="w-full bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
                          <div style={{ width:`${Math.min(100,lm)}%` }} className={`h-1 rounded-full ${lm >= TARGET_MARGIN ? 'bg-emerald-500' : 'bg-amber-400'}`}/>
                        </div>
                      </div>
                      <div className="text-xs font-bold text-slate-500 shrink-0 w-10 text-right">{lm.toFixed(0)}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
