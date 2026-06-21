import { useCallback, useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import Navbar from '../components/Navbar';
import TripCard from '../components/TripCard';
import BudgetBreakdown from '../components/BudgetBreakdown';
import HotelList from '../components/HotelList';
import PackingList from '../components/PackingList';
import VersionHistory from '../components/VersionHistory';
import ItineraryDay from '../components/ItineraryDay';
import { api } from '../lib/api';

function DashboardContent() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyDay, setBusyDay] = useState(null);
  const [reverting, setReverting] = useState(false);
  const [error, setError] = useState('');

  const loadTrips = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/trips');
      setTrips(data.trips);

      const requestedId = searchParams.get('tripId');
      const match = data.trips.find((t) => t._id === requestedId);
      setSelectedTrip(match || data.trips[0] || null);
    } catch (err) {
      setError(err.message || 'Failed to load your trips.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const selectTrip = (trip) => {
    setSelectedTrip(trip);
    setSearchParams({ tripId: trip._id });
  };

  const persistItinerary = async (updatedItinerary) => {
    const data = await api.put(`/api/trips/${selectedTrip._id}`, { itinerary: updatedItinerary });
    setSelectedTrip(data.trip);
    setTrips((prev) => prev.map((t) => (t._id === data.trip._id ? data.trip : t)));
  };

  const handleAddActivity = async (dayNumber, title) => {
    const updated = selectedTrip.itinerary.map((day) =>
      day.dayNumber === dayNumber
        ? {
            ...day,
            activities: [
              ...day.activities,
              { title, description: 'Added by traveler', estimatedCostUSD: 0, timeOfDay: 'Afternoon' },
            ],
          }
        : day
    );
    try {
      await persistItinerary(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveActivity = async (dayNumber, activityId, index) => {
    const updated = selectedTrip.itinerary.map((day) =>
      day.dayNumber === dayNumber
        ? {
            ...day,
            activities: day.activities.filter((a, i) => (activityId ? a._id !== activityId : i !== index)),
          }
        : day
    );
    try {
      await persistItinerary(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRegenerateDay = async (dayNumber, feedback) => {
    setBusyDay(dayNumber);
    setError('');
    try {
      const data = await api.post(`/api/trips/${selectedTrip._id}/regenerate-day`, {
        dayNumber,
        feedback,
      });
      setSelectedTrip(data.trip);
      setTrips((prev) => prev.map((t) => (t._id === data.trip._id ? data.trip : t)));
    } catch (err) {
      setError(err.message || 'Failed to regenerate that day.');
    } finally {
      setBusyDay(null);
    }
  };

  const handleRevertVersion = async (versionId) => {
    setReverting(true);
    setError('');
    try {
      const data = await api.post(`/api/trips/${selectedTrip._id}/revert/${versionId}`);
      setSelectedTrip(data.trip);
      setTrips((prev) => prev.map((t) => (t._id === data.trip._id ? data.trip : t)));
    } catch (err) {
      setError(err.message || 'Failed to revert.');
    } finally {
      setReverting(false);
    }
  };

  const handleTogglePacking = async (itemId) => {
    const updatedPacking = selectedTrip.packingList.map((item) =>
      item._id === itemId ? { ...item, isPacked: !item.isPacked } : item
    );
    try {
      const data = await api.put(`/api/trips/${selectedTrip._id}`, { packingList: updatedPacking });
      setSelectedTrip(data.trip);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-slate-400">
        <p className="animate-pulse">Loading your trips…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {error && (
        <p role="alert" className="mb-6 rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {error}
        </p>
      )}

      {trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-ink-700 bg-ink-900/60 py-24 text-center">
          <span className="mb-4 text-5xl">✈️</span>
          <p className="mb-4 text-slate-400">You haven&apos;t planned any trips yet.</p>
          <Link
            to="/dashboard/new"
            className="rounded-full bg-ember-500 px-5 py-2.5 text-sm font-semibold text-ink-950 hover:bg-ember-400"
          >
            Create your first trip
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-1">
            <div className="rounded-2xl border border-ink-700 bg-ink-900/60 p-5">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">
                Your Trips
              </h2>
              <div className="space-y-2.5">
                {trips.map((trip) => (
                  <TripCard
                    key={trip._id}
                    trip={trip}
                    active={selectedTrip?._id === trip._id}
                    onSelect={() => selectTrip(trip)}
                  />
                ))}
              </div>
            </div>

            {selectedTrip && <BudgetBreakdown budget={selectedTrip.estimatedBudget} />}
            {selectedTrip && <HotelList hotels={selectedTrip.hotels} />}
          </div>

          {selectedTrip && (
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-2xl border border-ink-700 bg-ink-900/60 p-6">
                <h1 className="mb-6 border-b border-ink-700 pb-4 text-2xl font-bold text-white">
                  {selectedTrip.destination}
                </h1>
                <div className="space-y-8">
                  {selectedTrip.itinerary.map((day) => (
                    <ItineraryDay
                      key={day.dayNumber}
                      day={day}
                      onAddActivity={handleAddActivity}
                      onRemoveActivity={handleRemoveActivity}
                      onRegenerate={handleRegenerateDay}
                      regenerating={busyDay === day.dayNumber}
                    />
                  ))}
                </div>
              </div>

              <PackingList trip={selectedTrip} onToggleItem={handleTogglePacking} />
              <VersionHistory
                versions={selectedTrip.versions}
                onRevert={handleRevertVersion}
                reverting={reverting}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DashboardPage() {
  return (
    <main>
      <Navbar />
      <DashboardContent />
    </main>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  );
}
