from pathlib import Path
p=Path('/home/ubuntu/sydneyautomationco-job-system/index.html')
s=p.read_text()
# Add fee defaults
s=s.replace("  stripePaymentLinkBase:'https://buy.stripe.com/5kQ00i8o96rQ72R6BQ00000',\n", "  stripePaymentLinkBase:'https://buy.stripe.com/5kQ00i8o96rQ72R6BQ00000',\n  stripeCardFeeRate:0.017, stripeCardFeeFixed:0.30, stripeCardSurchargeEnabled:true, stripeCardSurchargeEnd:'2026-10-01',\n", 1)
s=s.replace("   stripePaymentLinkBase: _storedCFG.stripePaymentLinkBase || 'https://buy.stripe.com/5kQ00i8o96rQ72R6BQ00000',\n", "   stripePaymentLinkBase: _storedCFG.stripePaymentLinkBase || 'https://buy.stripe.com/5kQ00i8o96rQ72R6BQ00000',\n   stripeCardFeeRate: _storedCFG.stripeCardFeeRate != null ? Number(_storedCFG.stripeCardFeeRate) : 0.017,\n   stripeCardFeeFixed: _storedCFG.stripeCardFeeFixed != null ? Number(_storedCFG.stripeCardFeeFixed) : 0.30,\n   stripeCardSurchargeEnabled: _storedCFG.stripeCardSurchargeEnabled !== false,\n   stripeCardSurchargeEnd: _storedCFG.stripeCardSurchargeEnd || '2026-10-01',\n", 1)
# Add helper before Stripe payment link section
anchor="// ─── STRIPE PAYMENT LINK ──────────────────────────────────────────────────────\nfunction stripePayUrl(jobId, refOverride){"
helper=r'''// ─── STRIPE CARD TOTAL ────────────────────────────────────────────────────────
// Gross-up so the card payment covers Stripe's percentage and fixed fee.
// Defaults reflect Stripe Australia online domestic-card pricing: 1.70% + A$0.30.
function stripeCardSurchargeActive(){
  return CFG.stripeCardSurchargeEnabled !== false && today() < (CFG.stripeCardSurchargeEnd || '2026-10-01');
}
function stripeCardTotal(baseAmount){
  const base=Math.max(0,Number(baseAmount)||0);
  const rate=Math.max(0,Number(CFG.stripeCardFeeRate!=null?CFG.stripeCardFeeRate:0.017));
  const fixed=Math.max(0,Number(CFG.stripeCardFeeFixed!=null?CFG.stripeCardFeeFixed:0.30));
  if(!stripeCardSurchargeActive()) return {base,fee:0,total:base,rate,fixed,active:false};
  const total=Math.round(((base+fixed)/(1-rate))*100)/100;
  return {base,fee:Math.round((total-base)*100)/100,total,rate,fixed,active:true};
}
function stripeCardSummaryHtml(baseAmount, compact=false){
  const x=stripeCardTotal(baseAmount);
  if(!x.active) return '';
  return `<div style="margin-top:10px;padding:${compact?'11px 13px':'14px 16px'};background:linear-gradient(135deg,#5b21b6,#7c3aed);border:1px solid #4c1d95;border-radius:8px;color:#fff;box-shadow:0 4px 12px rgba(91,33,182,0.22)">
    <div style="font-family:Barlow Condensed,sans-serif;font-size:${compact?'12px':'14px'};font-weight:800;text-transform:uppercase;letter-spacing:1px;margin-bottom:7px">Total if paying by card with Stripe</div>
    <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px">
      <span style="font-size:11px;color:#ede9fe">${fmt$(x.base)} invoice total + card processing fee (${fmt$(x.fee)})</span>
      <span style="font-family:Barlow Condensed,sans-serif;font-size:${compact?'21px':'24px'};font-weight:900;white-space:nowrap">${fmt$(x.total)}</span>
    </div>
  </div>`;
}

'''
if anchor not in s: raise SystemExit('stripe anchor missing')
s=s.replace(anchor,helper+anchor,1)
# Replace printed invoice existing calculation block
old="""        ${stripePayUrl(jobId, isDeposit?invNum:undefined) ? (()=>{
          const _stripeFee = Math.round(_totalInc * 0.017 * 100) / 100;
          const _stripeTotal = Math.round((_totalInc + _stripeFee) * 100) / 100;
          return `<div style="margin-top:10px;padding:14px 16px;background:linear-gradient(135deg,#5b21b6,#7c3aed);border:1px solid #4c1d95;border-radius:8px;color:#fff;box-shadow:0 4px 12px rgba(91,33,182,0.22)">
            <div style="font-family:Barlow Condensed,sans-serif;font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:1px;margin-bottom:7px">Total if paying by card with Stripe</div>
            <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px">
              <span style="font-size:11px;color:#ede9fe">${fmt$(_totalInc)} invoice total + 1.7% card fee (${fmt$(_stripeFee)})</span>
              <span style="font-family:Barlow Condensed,sans-serif;font-size:24px;font-weight:900;white-space:nowrap">${fmt$(_stripeTotal)}</span>
            </div>
          </div>`;
        })() : ''}"""
new="""        ${stripePayUrl(jobId, isDeposit?invNum:undefined) ? stripeCardSummaryHtml(_totalInc) : ''}"""
if old not in s: raise SystemExit('printed stripe block missing')
s=s.replace(old,new,1)
# Add editor card total directly under orange total
old="""          <div style="text-align:right;font-size:17px;font-weight:900;color:#0e1f3d;padding:12px 16px;background:#0e1f3d;border-radius:8px;color:#fff;display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.7)">Invoice Total</span>
            <span style="color:#f07020">$<span id="il-total">${invLineTotalInc(j, lineTotal).toFixed(2)}</span></span>
          </div>
        </div>"""
new="""          <div style="text-align:right;font-size:17px;font-weight:900;color:#0e1f3d;padding:12px 16px;background:#0e1f3d;border-radius:8px;color:#fff;display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.7)">Invoice Total</span>
            <span style="color:#f07020">$<span id="il-total">${invLineTotalInc(j, lineTotal).toFixed(2)}</span></span>
          </div>
          <div id="il-card-total">${CFG.stripePaymentLinkBase ? stripeCardSummaryHtml(lineTotalInc(j,lineTotal), true) : ''}</div>
        </div>"""
if old not in s: raise SystemExit('editor total block missing')
s=s.replace(old,new,1)
# Refresh card total in live line edit
old="""      const totalEl = document.getElementById('il-total');
      if(totalEl) totalEl.textContent = invLineTotalInc(j, j.invoiceLines.reduce((s,l)=>s+(l.qty*l.unit),0)).toFixed(2);
    }
    save();"""
new="""      const currentTotal = invLineTotalInc(j, j.invoiceLines.reduce((s,l)=>s+(l.qty*l.unit),0));
      const totalEl = document.getElementById('il-total');
      if(totalEl) totalEl.textContent = currentTotal.toFixed(2);
      const cardEl = document.getElementById('il-card-total');
      if(cardEl) cardEl.innerHTML = CFG.stripePaymentLinkBase ? stripeCardSummaryHtml(currentTotal, true) : '';
    }
    save();"""
if old not in s: raise SystemExit('editor recalc block missing')
s=s.replace(old,new,1)
# Add controls to Stripe settings panel
old="""          <input id="cfg-stripePaymentLinkBase" type="url" value="${CFG.stripePaymentLinkBase||''}" placeholder="https://buy.stripe.com/your-link" style="width:100%;padding:8px 10px;border:1px solid #cbd5e1;border-radius:7px;font-size:12px;color:#0f172a;background:#fff;box-sizing:border-box">
          <div style="font-size:11px;color:#94a3b8;margin-top:6px">Stripe Dashboard &rarr; Payment Links &rarr; Create link &rarr; copy URL</div>"""
new="""          <input id="cfg-stripePaymentLinkBase" type="url" value="${CFG.stripePaymentLinkBase||''}" placeholder="https://buy.stripe.com/your-link" style="width:100%;padding:8px 10px;border:1px solid #cbd5e1;border-radius:7px;font-size:12px;color:#0f172a;background:#fff;box-sizing:border-box">
          <div style="font-size:11px;color:#94a3b8;margin-top:6px">Stripe Dashboard &rarr; Payment Links &rarr; Create link &rarr; copy URL</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px">
            <div><label style="display:block;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:4px">Domestic card rate</label><input id="cfg-stripeCardFeeRate" type="number" min="0" max="0.2" step="0.0001" value="${Number(CFG.stripeCardFeeRate!=null?CFG.stripeCardFeeRate:0.017)}" style="width:100%;padding:8px 10px;border:1px solid #cbd5e1;border-radius:7px;font-size:12px;box-sizing:border-box"><div style="font-size:10px;color:#94a3b8;margin-top:3px">Enter 0.017 for 1.70%</div></div>
            <div><label style="display:block;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:4px">Fixed fee (A$)</label><input id="cfg-stripeCardFeeFixed" type="number" min="0" step="0.01" value="${Number(CFG.stripeCardFeeFixed!=null?CFG.stripeCardFeeFixed:0.30).toFixed(2)}" style="width:100%;padding:8px 10px;border:1px solid #cbd5e1;border-radius:7px;font-size:12px;box-sizing:border-box"></div>
          </div>
          <div style="font-size:11px;color:#92400e;background:#fff7ed;border:1px solid #fed7aa;border-radius:7px;padding:8px 10px;margin-top:10px">Card totals are grossed up to cover the configured Stripe processing cost. Review your Stripe statement and Australian card-surcharge rules before relying on this amount.</div>"""
if old not in s: raise SystemExit('settings stripe block missing')
s=s.replace(old,new,1)
# Persist settings
old="""  intKeys.forEach(k => { const v = g('cfg-'+k); if(v !== null) CFG[k] = v; });

  // Business identity"""
new="""  intKeys.forEach(k => { const v = g('cfg-'+k); if(v !== null) CFG[k] = v; });
  const stripeRate = gn('cfg-stripeCardFeeRate');
  const stripeFixed = gn('cfg-stripeCardFeeFixed');
  if(stripeRate !== null && stripeRate >= 0) CFG.stripeCardFeeRate = stripeRate;
  if(stripeFixed !== null && stripeFixed >= 0) CFG.stripeCardFeeFixed = stripeFixed;

  // Business identity"""
if old not in s: raise SystemExit('settings save anchor missing')
s=s.replace(old,new,1)
p.write_text(s)
print('stripe card total upgrade added')
