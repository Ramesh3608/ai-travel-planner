import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import Navbar from '../components/Navbar';
import { api } from '../lib/api';

const INTEREST_OPTIONS = ['Food', 'Culture', 'Adventure', 'Shopping', 'Nature', 'Nightlife', 'Relaxation'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function NewTripForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    destination: '',
    durationDays: 5,
    budgetTier: 'Medium',
    interests: [],
    travelMonth: '',
  });
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  const toggleInterest = (interest) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.destination.trim()) {
      setError('Please enter a destination.');
      return;
    }

    setGenerating(true);
    try {
      const data = await api.post('/api/trips', {
        ...form,
        durationDays: Number(form.durationDays),
      });
      navigate(`/dashboard?tripId=${data.trip._id}`);
    } catch (err) {
      setError(err.message || 'Failed to generate itinerary. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <main>
      <Navbar />
      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="mb-1 text-2xl font-bold text-white">Plan a new trip</h1>
        <p className="mb-8 text-sm text-slate-400">
          Voyager will generate a full itinerary, budget, hotel picks, and a climate-aware
          packing list.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-ink-700 bg-ink-900/60 p-6">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Destination</label>
            <input
              type="text"
              required
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              placeholder="e.g. Kyoto, Japan"
              className="w-full rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Number of days</label>
              <input
                type="number"
                min={1}
                max={30}
                required
                value={form.durationDays}
                onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
                className="w-full rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">
                Travel month <span className="text-slate-600">(optional)</span>
              </label>
              <select
                value={form.travelMonth}
                onChange={(e) => setForm({ ...form, travelMonth: e.target.value })}
                className="w-full rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
              >
                <option value="">Not sure yet</option>
                {MONTHS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="-mt-3 text-xs text-slate-500">
            Pick a month and we&apos;ll pull real seasonal climate data to ground your packing list.
          </p>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Budget type</label>
            <div className="grid grid-cols-3 gap-2">
              {['Low', 'Medium', 'High'].map((tier) => (
                <button
                  type="button"
                  key={tier}
                  onClick={() => setForm({ ...form, budgetTier: tier })}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    form.budgetTier === tier
                      ? 'border-ember-500 bg-ember-500/10 text-ember-400'
                      : 'border-ink-700 text-slate-400 hover:border-ink-600'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">Interests</label>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest) => (
                <button
                  type="button"
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    form.interests.includes(interest)
                      ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                      : 'border-ink-700 text-slate-400 hover:border-ink-600'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={generating}
            className="w-full rounded-lg bg-ember-500 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-ember-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generating ? 'Generating your itinerary…' : 'Generate itinerary'}
          </button>
          {generating && (
            <p className="text-center text-xs text-slate-500">
              This calls the AI agent and can take 10–20 seconds.
            </p>
          )}
        </form>
      </div>
    </main>
  );
}

export default function NewTrip() {
  return (
    <ProtectedRoute>
      <NewTripForm />
    </ProtectedRoute>
  );
}
