'use client';

import { useState } from 'react';

const TIME_COLORS = {
  Morning: 'bg-amber-500/10 text-amber-400',
  Afternoon: 'bg-sky-500/10 text-sky-400',
  Evening: 'bg-indigo-500/10 text-indigo-400',
};

export default function ItineraryDay({ day, onAddActivity, onRemoveActivity, onRegenerate, regenerating }) {
  const [newActivity, setNewActivity] = useState('');
  const [showRegenerate, setShowRegenerate] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleAdd = () => {
    if (!newActivity.trim()) return;
    onAddActivity(day.dayNumber, newActivity.trim());
    setNewActivity('');
  };

  const handleRegenerate = () => {
    if (!feedback.trim()) return;
    onRegenerate(day.dayNumber, feedback.trim());
    setFeedback('');
    setShowRegenerate(false);
  };

  return (
    <div className="relative border-l-2 border-ember-500/40 pl-6">
      <div className="absolute -left-[7px] top-1 h-3.5 w-3.5 rounded-full border-4 border-ink-950 bg-ember-500" />

      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Day {day.dayNumber}</h3>
          {day.theme && <p className="text-xs text-slate-500">{day.theme}</p>}
        </div>
        <button
          onClick={() => setShowRegenerate((s) => !s)}
          disabled={regenerating}
          className="rounded-full border border-ink-700 px-3 py-1 text-xs font-medium text-slate-300 transition hover:border-sky-500/50 hover:text-sky-400 disabled:opacity-50"
        >
          {regenerating ? 'Regenerating…' : '↻ Regenerate day'}
        </button>
      </div>

      {showRegenerate && (
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder='e.g. "More outdoor activities, less shopping"'
            className="w-full rounded-lg border border-ink-700 bg-ink-950 px-3 py-1.5 text-xs text-white outline-none focus:border-sky-500"
          />
          <button
            onClick={handleRegenerate}
            className="shrink-0 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-ink-950 hover:bg-sky-400"
          >
            Apply
          </button>
        </div>
      )}

      <div className="mb-3 space-y-2.5">
        {day.activities.map((activity, idx) => (
          <div
            key={activity._id || idx}
            className="group rounded-xl border border-ink-700 bg-ink-900/60 p-3.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{activity.title}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TIME_COLORS[activity.timeOfDay] || 'bg-ink-700 text-slate-300'}`}>
                    {activity.timeOfDay}
                  </span>
                </div>
                {activity.description && (
                  <p className="mt-1 text-xs text-slate-400">{activity.description}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs font-medium text-slate-400">${activity.estimatedCostUSD || 0}</span>
                <button
                  onClick={() => onRemoveActivity(day.dayNumber, activity._id, idx)}
                  aria-label={`Remove ${activity.title}`}
                  className="text-slate-600 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newActivity}
          onChange={(e) => setNewActivity(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add an activity…"
          className="w-full max-w-xs rounded-lg border border-ink-700 bg-ink-950 px-3 py-1.5 text-xs text-white outline-none focus:border-ember-500"
        />
        <button
          onClick={handleAdd}
          className="rounded-lg bg-ink-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-ink-700/70"
        >
          Add
        </button>
      </div>
    </div>
  );
}
