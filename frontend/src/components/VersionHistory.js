'use client';

export default function VersionHistory({ versions, onRevert, reverting }) {
  if (!versions?.length) return null;

  const ordered = [...versions].reverse(); // newest first

  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-900/60 p-6">
      <h2 className="text-lg font-bold text-white">🕓 Itinerary Time Machine</h2>
      <p className="mb-4 mt-1 text-xs text-slate-400">
        Every regeneration is saved automatically. Didn&apos;t like the new Day 3? Roll it back.
      </p>

      <div className="space-y-2.5">
        {ordered.map((version) => (
          <div
            key={version._id}
            className="flex items-center justify-between rounded-lg border border-ink-700 bg-ink-950 px-3.5 py-2.5"
          >
            <div>
              <p className="text-sm font-medium text-slate-200">{version.label}</p>
              <p className="text-xs text-slate-500">
                {new Date(version.createdAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => onRevert(version._id)}
              disabled={reverting}
              className="shrink-0 rounded-full border border-ink-700 px-3 py-1 text-xs font-medium text-slate-300 transition hover:border-ember-500/50 hover:text-ember-400 disabled:opacity-50"
            >
              Restore
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
