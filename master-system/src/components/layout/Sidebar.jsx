import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Briefcase, FileText, Users, Receipt,
  TrendingUp, BarChart3, ShoppingCart, Settings, Wrench,
  MapPin, Zap, ChevronRight, AlertCircle, Clock, Star, Globe2
} from 'lucide-react';
import { useStore } from '../../store/useStore';

const NAV = [
  { label: 'OVERVIEW', items: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/calendar', icon: Clock, label: 'Calendar' },
  ]},
  { label: 'WORK', items: [
    { to: '/jobs', icon: Briefcase, label: 'Jobs', badgeKey: 'jobs' },
    { to: '/website-leads', icon: Globe2, label: 'Website Leads' },
    { to: '/quotes', icon: FileText, label: 'Quotes', badgeKey: 'quotes' },
    { to: '/invoices', icon: Receipt, label: 'Invoices', badgeKey: 'overdue' },
    { to: '/quote-builder', icon: Zap, label: 'Quote Builder', highlight: true },
  ]},
  { label: 'CLIENTS', items: [
    { to: '/clients', icon: Users, label: 'Clients' },
    { to: '/projects', icon: Star, label: 'Projects' },
  ]},
  { label: 'MONEY', items: [
    { to: '/financials', icon: TrendingUp, label: 'Financials' },
    { to: '/profitability', icon: BarChart3, label: 'Profitability' },
    { to: '/suppliers', icon: ShoppingCart, label: 'Suppliers', badgeKey: 'awaitPO' },
    { to: '/expenses', icon: MapPin, label: 'Expenses' },
  ]},
  { label: 'SETTINGS', items: [
    { to: '/settings', icon: Settings, label: 'Settings' },
  ]},
];

export default function Sidebar() {
  const { jobs } = useStore();
  const overdueCount = jobs.filter(j => j.status === 'overdue').length;
  const activeQuotes = jobs.filter(j => j.type === 'SAQ' && !['paid','lost'].includes(j.status)).length;
  const activeJobs = jobs.filter(j => !['paid','lost'].includes(j.status) && j.type !== 'SAQ').length;

  const getBadge = (key) => {
    if (key === 'overdue') return overdueCount > 0 ? overdueCount : null;
    if (key === 'quotes') return activeQuotes > 0 ? activeQuotes : null;
    if (key === 'jobs') return activeJobs > 0 ? activeJobs : null;
    return null;
  };

  return (
    <div className="w-64 h-screen bg-slate-900 flex flex-col fixed left-0 top-0 z-30 overflow-hidden">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-900/50 text-white font-black text-lg">S</div>
          <div>
            <div className="text-white font-bold text-sm tracking-wide leading-tight">Sydney Auto.</div>
            <div className="text-slate-500 text-[10px] font-mono tracking-widest uppercase">Master System</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV.map(section => (
          <div key={section.label}>
            <div className="text-[9px] font-black text-slate-600 tracking-[0.12em] uppercase px-3 mb-1.5">{section.label}</div>
            <div className="space-y-0.5">
              {section.items.map(item => {
                const badge = getBadge(item.badgeKey);
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                       ${isActive
                         ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                         : item.highlight
                           ? 'text-indigo-300 hover:bg-indigo-900/40 hover:text-indigo-200'
                           : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                       }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={16} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
                        <span className="flex-1 leading-none">{item.label}</span>
                        {badge && (
                          <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
                            {badge}
                          </span>
                        )}
                        {item.highlight && !badge && (
                          <Zap size={11} className="text-indigo-400" />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      {overdueCount > 0 && (
        <div className="px-4 py-3 border-t border-white/5">
          <div className="flex items-center gap-2 bg-red-950/60 border border-red-800/40 rounded-xl px-3 py-2.5">
            <AlertCircle size={14} className="text-red-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-red-300 text-xs font-bold">{overdueCount} overdue invoice{overdueCount > 1 ? 's' : ''}</div>
              <div className="text-red-500 text-[10px]">Requires attention</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
