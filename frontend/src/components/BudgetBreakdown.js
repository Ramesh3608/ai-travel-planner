'use client';

const ROWS = [
  { key: 'accommodation', label: 'Accommodation' },
  { key: 'food', label: 'Food & Drink' },
  { key: 'activities', label: 'Activities' },
  { key: 'transport', label: 'Transport' },
];

export default function BudgetBreakdown({ budget }) {
  if (!budget) return null;

  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-900/60 p-6">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-400">
        Estimated Budget
      </h2>
      <div className="space-y-2.5">
        {ROWS.map((row) => (
          <div key={row.key} className="flex justify-between text-sm">
            <span className="text-slate-400">{row.label}</span>
            <span className="font-medium text-slate-200">${budget[row.key] ?? 0}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t border-ink-700 pt-3 text-base font-bold text-white">
          <span>Total</span>
          <span>${budget.total ?? 0}</span>
        </div>
      </div>
    </div>
  );
}
