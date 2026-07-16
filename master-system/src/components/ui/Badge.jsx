import { statusColor, statusLabel } from '../../utils/format';

export function Badge({ status, size = 'sm' }) {
  const c = statusColor(status);
  const sz = size === 'xs' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${c.bg} ${c.text} ${c.border} ${sz}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {statusLabel(status)}
    </span>
  );
}

export function Tag({ children, color = 'slate' }) {
  const colors = {
    slate: 'bg-slate-100 text-slate-600',
    indigo: 'bg-indigo-50 text-indigo-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    violet: 'bg-violet-50 text-violet-700',
  };
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${colors[color] || colors.slate}`}>
      {children}
    </span>
  );
}
