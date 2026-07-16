import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Input, Select, Textarea, Btn } from '../components/ui/Modal';
import Layout, { PageHeader } from '../components/layout/Layout';

export default function Settings() {
  const { config, updateConfig } = useStore();
  const [form, setForm] = useState({
    bizName: config.bizName,
    bizABN: config.bizABN,
    bizAddress: config.bizAddress,
    bizEmail: config.bizEmail,
    bizPhone: config.bizPhone,
    bizWebsite: config.bizWebsite,
    bizLicence: config.bizLicence,
    gstRegistered: config.gstRegistered,
    gstRate: config.gstRate,
    defaultDepositPct: config.defaultDepositPct,
    defaultPayTermsDays: config.defaultPayTermsDays,
    quoteValidDays: config.quoteValidDays,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? e.target.checked : value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      updateConfig(form);
      toast.success('Settings saved!');
    } catch (e) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        title="Settings"
        subtitle="Business details, GST registration & defaults"
        actions={
          <Btn onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : <><Save size={14}/> Save Settings</>}
          </Btn>
        }
      />

      <div className="p-6 space-y-6">
        {/* Business Details */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2">Business Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input label="Business Name" name="bizName" value={form.bizName} onChange={handleChange} />
            <Input label="ABN" name="bizABN" value={form.bizABN} onChange={handleChange} placeholder="12 345 678 901" />
            <Input label="Phone" name="bizPhone" value={form.bizPhone} onChange={handleChange} />
            <Input label="Email" name="bizEmail" type="email" value={form.bizEmail} onChange={handleChange} />
            <Input label="Website" name="bizWebsite" value={form.bizWebsite} onChange={handleChange} />
            <Input label="Licence No." name="bizLicence" value={form.bizLicence} onChange={handleChange} />
            <div className="md:col-span-2">
              <Textarea label="Address" name="bizAddress" value={form.bizAddress} onChange={handleChange} rows={2} />
            </div>
          </div>
        </motion.div>

        {/* GST Registration */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2">GST Registration</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3 flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <input
                type="checkbox"
                id="gstRegistered"
                name="gstRegistered"
                checked={form.gstRegistered}
                onChange={handleChange}
                className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="gstRegistered" className="font-semibold text-slate-800 cursor-pointer">
                Registered for GST
              </label>
              <span className={`ml-auto text-xs font-bold px-2 py-1 rounded-full ${form.gstRegistered ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {form.gstRegistered ? 'ACTIVE' : 'NOT REGISTERED'}
              </span>
            </div>
            <Select
              label="GST Rate (%)"
              name="gstRate"
              value={form.gstRate}
              onChange={handleChange}
              disabled={!form.gstRegistered}
            >
              <option value={10}>10% (Australia Standard)</option>
              <option value={0}>0% (GST-Free)</option>
            </Select>
            <div className="text-sm text-slate-500 pt-6 md:col-span-3">
              <AlertCircle size={14} className="inline-block mr-1 -mt-0.5" />
              When enabled, all new quotes and invoices will include GST at the specified rate.
              GST registration requires an ABN. The ATO threshold is $75,000 annual turnover.
            </div>
          </div>
        </motion.div>

        {/* Defaults */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2">Document Defaults</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input label="Default Deposit %" name="defaultDepositPct" type="number" min={0} max={100} value={form.defaultDepositPct} onChange={handleChange} />
            <Input label="Payment Terms (days)" name="defaultPayTermsDays" type="number" min={0} value={form.defaultPayTermsDays} onChange={handleChange} />
            <Input label="Quote Valid (days)" name="quoteValidDays" type="number" min={0} value={form.quoteValidDays} onChange={handleChange} />
          </div>
        </motion.div>

        {/* Preview */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
          <h3 className="font-bold text-slate-800 mb-4">Invoice / Quote Footer Preview</h3>
          <div className="bg-white border border-slate-200 rounded-xl p-4 font-mono text-sm text-slate-700 space-y-1">
            <div>{form.bizName}</div>
            <div>{form.bizAddress}</div>
            <div>ABN: {form.bizABN || '—'}</div>
            <div>Email: {form.bizEmail}</div>
            <div>Phone: {form.bizPhone}</div>
            <div className="pt-2 border-t border-slate-100">
              {form.gstRegistered
                ? `GST Registered · Charging ${form.gstRate}% GST on all taxable supplies`
                : <span className="text-amber-600">Not registered for GST — no GST charged</span>
              }
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}