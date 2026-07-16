import { create } from 'zustand';

const KEYS = {
  jobs: 'sac:jobs',
  clients: 'sac:clients',
  supInvoices: 'sac:supInvoices',
  expenses: 'sac:expenses',
  config: 'sac:config',
  projects: 'sac:projects',
  recurring: 'sac:recurring',
  kmlog: 'sac:kmlog',
};

const load = (key, fallback = []) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
};

const save = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
};

const DEFAULT_CFG = {
  bizName: 'Sydney Automation Co.',
  bizABN: '',
  bizAddress: 'Sydney, NSW',
  bizEmail: 'info@sydneyautomation.com.au',
  bizPhone: '0400 000 000',
  bizWebsite: 'www.sydneyautomation.com.au',
  bizLicence: '',
  payGross: 0,
  superRate: 11.5,
  quoteValidDays: 30,
  defaultDepositPct: 50,
  defaultPayTermsDays: 7,
  gstRegistered: true,
  gstRate: 10,
};

export const useStore = create((set, get) => ({
  jobs: load(KEYS.jobs, []),
  clients: load(KEYS.clients, []),
  supInvoices: load(KEYS.supInvoices, []),
  expenses: load(KEYS.expenses, []),
  projects: load(KEYS.projects, []),
  recurring: load(KEYS.recurring, []),
  kmlog: load(KEYS.kmlog, []),
  config: { ...DEFAULT_CFG, ...load(KEYS.config, {}) },

  // Jobs
  addJob: (job) => set(s => {
    const jobs = [...s.jobs, job];
    save(KEYS.jobs, jobs);
    return { jobs };
  }),
  updateJob: (id, updates) => set(s => {
    const jobs = s.jobs.map(j => j.id === id ? { ...j, ...updates } : j);
    save(KEYS.jobs, jobs);
    return { jobs };
  }),
  deleteJob: (id) => set(s => {
    const jobs = s.jobs.filter(j => j.id !== id);
    save(KEYS.jobs, jobs);
    return { jobs };
  }),

  // Clients
  addClient: (client) => set(s => {
    const clients = [...s.clients, client];
    save(KEYS.clients, clients);
    return { clients };
  }),
  updateClient: (id, updates) => set(s => {
    const clients = s.clients.map(c => c.id === id ? { ...c, ...updates } : c);
    save(KEYS.clients, clients);
    return { clients };
  }),

  // Supplier Invoices
  addSupInvoice: (inv) => set(s => {
    const supInvoices = [...s.supInvoices, inv];
    save(KEYS.supInvoices, supInvoices);
    return { supInvoices };
  }),
  updateSupInvoice: (id, updates) => set(s => {
    const supInvoices = s.supInvoices.map(i => i.id === id ? { ...i, ...updates } : i);
    save(KEYS.supInvoices, supInvoices);
    return { supInvoices };
  }),
  deleteSupInvoice: (id) => set(s => {
    const supInvoices = s.supInvoices.filter(i => i.id !== id);
    save(KEYS.supInvoices, supInvoices);
    return { supInvoices };
  }),

  // Config
  updateConfig: (updates) => set(s => {
    const config = { ...s.config, ...updates };
    save(KEYS.config, config);
    return { config };
  }),

  // Expenses
  addExpense: (exp) => set(s => {
    const expenses = [...s.expenses, exp];
    save(KEYS.expenses, expenses);
    return { expenses };
  }),

  // Helpers
  getClient: (id) => get().clients.find(c => c.id === id) || null,
  getJob: (id) => get().jobs.find(j => j.id === id) || null,
}));
