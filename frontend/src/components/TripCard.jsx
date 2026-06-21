export default function TripCard({ trip, active, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-xl border p-4 text-left transition ${
        active
          ? 'border-ember-500 bg-ember-500/10'
          : 'border-ink-700 bg-ink-900/60 hover:border-ink-600'
      }`}
    >
      <p className="font-bold text-white">{trip.destination}</p>
      <p className="mt-0.5 text-xs text-slate-400">
        {trip.durationDays} days • {trip.budgetTier} budget
        {trip.travelMonth ? ` • ${trip.travelMonth}` : ''}
      </p>
    </button>
  );
}
