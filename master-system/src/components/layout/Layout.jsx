import Sidebar from './Sidebar';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="min-h-screen"
        >
          {children}
        </motion.div>
      </main>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: '#0f172a', color: '#f8fafc', borderRadius: '12px', fontSize: '13px', fontWeight: 500, border: '1px solid rgba(255,255,255,0.08)' },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, children }) {
  return (
    <div className="px-8 py-6 border-b border-slate-200 bg-white sticky top-0 z-20">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
