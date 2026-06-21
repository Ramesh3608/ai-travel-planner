const CATEGORY_ORDER = ['Documents', 'Clothing', 'Gear', 'Other'];

export default function PackingList({ trip, onToggleItem }) {
  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    items: (trip.packingList || []).filter((item) => item.category === category),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-900/60 p-6">
      <h2 className="text-lg font-bold text-white">🧳 Climate-Aware Packing Assistant</h2>
      <p className="mb-4 mt-1 text-xs text-slate-400">
        {trip.climateContext?.source === 'open-meteo' && trip.climateContext?.summary
          ? trip.climateContext.summary
          : 'Estimated from the AI agent\u2019s general knowledge (no verified climate data found for this destination).'}
      </p>

      {grouped.length === 0 ? (
        <p className="text-sm text-slate-500">No packing list generated yet.</p>
      ) : (
        <div className="space-y-5">
          {grouped.map((group) => (
            <div key={group.category}>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                {group.category}
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {group.items.map((item) => (
                  <label
                    key={item._id}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm transition hover:border-ink-600"
                  >
                    <input
                      type="checkbox"
                      checked={item.isPacked}
                      onChange={() => onToggleItem(item._id)}
                      className="h-4 w-4 rounded accent-ember-500"
                    />
                    <span className={item.isPacked ? 'text-slate-500 line-through' : 'text-slate-200'}>
                      {item.item}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
