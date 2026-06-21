export default function HotelList({ hotels }) {
  if (!hotels?.length) return null;

  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-900/60 p-6">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-400">
        Recommended Hotels
      </h2>
      <div className="space-y-3">
        {hotels.map((hotel, idx) => (
          <div key={hotel._id || idx} className="rounded-xl border border-ink-700 bg-ink-950 p-3.5">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-white">{hotel.name}</p>
              <span className="shrink-0 rounded-full bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-400">
                {hotel.tier}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
              <span>${hotel.estimatedCostNightUSD}/night</span>
              {hotel.rating && <span>⭐ {hotel.rating}</span>}
            </div>
            {hotel.notes && <p className="mt-1.5 text-xs text-slate-500">{hotel.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
