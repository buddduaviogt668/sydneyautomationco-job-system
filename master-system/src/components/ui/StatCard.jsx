import { motion } from 'framer-motion';

export function StatCard({ label, value, sub, icon, accent = 'slate', trend, onClick, large }) {
  const accents = {
    slate: 'from-slate-800 to-slate-900',
    indigo: 'from-indigo-500 to-violet-600',
    emerald: 'from-emerald-500 to-teal-600',
    amber: 'from-amber-400 to-orange-500',
    red: 'from-red-500 to-rose-600',
    sky: 'from-sky-500 to-blue-600',
  };

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 12px 30px -8px rgba(0,0,0,0.1)' }}
      onClick={onClick}
      className={`bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col gap-3 ${onClick ? 'cursor-pointer' : ''} transition-shadow`}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</span>
        {icon && (
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${accents[accent]} flex items-center justify-center text-white shadow-sm`}>
            {icon}
          </div>
        )}
      </div>
      <div className={`font-black tracking-tight text-slate-900 ${large ? 'text-4xl' : 'text-2xl'}`}>{value}</div>
      {(sub || trend) && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {trend !== undefined && (
            <span className={`font-bold ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
          {sub && <span>{sub}</span>}
        </div>
      )}
    </motion.div>
  );
}
