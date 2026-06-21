const Trip = require('../models/Trip');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getClimateContext } = require('../services/weatherService');
const {
  callGemini,
  buildTripPrompt,
  buildRegenerateDayPrompt,
} = require('../services/geminiService');

/**
 * Every query in this file is scoped with { userId: req.user.id }. This is
 * the single most important line of code in the assessment's "strict data
 * isolation" requirement: even if a user guesses or brute-forces another
 * user's trip ObjectId, the query simply returns nothing because the
 * compound filter never matches a document they don't own.
 */
async function findOwnedTrip(tripId, userId) {
  const trip = await Trip.findOne({ _id: tripId, userId });
  if (!trip) {
    throw new ApiError(404, 'Trip not found.');
  }
  return trip;
}

// @route POST /api/trips
const generateTrip = asyncHandler(async (req, res) => {
  const { destination, durationDays, budgetTier, interests, travelMonth } = req.body;

  if (!destination || !durationDays || !budgetTier) {
    throw new ApiError(400, 'destination, durationDays and budgetTier are required.');
  }
  if (durationDays < 1 || durationDays > 30) {
    throw new ApiError(400, 'durationDays must be between 1 and 30.');
  }

  const climateContext = await getClimateContext(destination, travelMonth);

  const prompt = buildTripPrompt({
    destination,
    durationDays,
    budgetTier,
    interests: interests || [],
    climateContext,
    travelMonth,
  });

  const generated = await callGemini(prompt);

  const trip = await Trip.create({
    userId: req.user.id,
    destination,
    durationDays,
    budgetTier,
    interests: interests || [],
    travelMonth: travelMonth || '',
    itinerary: generated.itinerary || [],
    hotels: generated.hotels || [],
    estimatedBudget: generated.estimatedBudget || {},
    packingList: generated.packingList || [],
    climateContext,
    versions: [
      {
        label: 'Initial generation',
        itinerary: generated.itinerary || [],
        estimatedBudget: generated.estimatedBudget || {},
      },
    ],
  });

  res.status(201).json({ success: true, trip });
});

// @route GET /api/trips
const getTrips = asyncHandler(async (req, res) => {
  const trips = await Trip.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, trips });
});

// @route GET /api/trips/:id
const getTrip = asyncHandler(async (req, res) => {
  const trip = await findOwnedTrip(req.params.id, req.user.id);
  res.status(200).json({ success: true, trip });
});

// @route PUT /api/trips/:id
// Generic partial update used by the frontend for: add activity, remove
// activity, toggle packing item. Only a known whitelist of fields can be
// mutated this way to prevent a client from overwriting userId etc.
const updateTrip = asyncHandler(async (req, res) => {
  const trip = await findOwnedTrip(req.params.id, req.user.id);

  const allowedFields = ['itinerary', 'packingList', 'hotels'];
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      trip[field] = req.body[field];
    }
  }

  await trip.save();
  res.status(200).json({ success: true, trip });
});

// @route DELETE /api/trips/:id
const deleteTrip = asyncHandler(async (req, res) => {
  const trip = await findOwnedTrip(req.params.id, req.user.id);
  await trip.deleteOne();
  res.status(200).json({ success: true, message: 'Trip deleted.' });
});

// @route POST /api/trips/:id/regenerate-day
// Creative feature (part 2): every regeneration is archived as a version
// before being applied, so a user who dislikes the new Day 3 can revert.
const regenerateDay = asyncHandler(async (req, res) => {
  const { dayNumber, feedback } = req.body;
  if (!dayNumber || !feedback) {
    throw new ApiError(400, 'dayNumber and feedback are required.');
  }

  const trip = await findOwnedTrip(req.params.id, req.user.id);

  const prompt = buildRegenerateDayPrompt({
    destination: trip.destination,
    budgetTier: trip.budgetTier,
    interests: trip.interests,
    dayNumber,
    durationDays: trip.durationDays,
    feedback,
    climateContext: trip.climateContext,
  });

  const newDay = await callGemini(prompt);

  // Archive current state before mutating
  trip.versions.push({
    label: `Before regenerating Day ${dayNumber}`,
    itinerary: trip.itinerary,
    estimatedBudget: trip.estimatedBudget,
  });

  trip.itinerary = trip.itinerary.map((day) =>
    day.dayNumber === Number(dayNumber)
      ? { dayNumber: newDay.dayNumber, theme: newDay.theme || '', activities: newDay.activities || [] }
      : day
  );

  await trip.save();
  res.status(200).json({ success: true, trip });
});

// @route POST /api/trips/:id/revert/:versionId
const revertToVersion = asyncHandler(async (req, res) => {
  const trip = await findOwnedTrip(req.params.id, req.user.id);
  const version = trip.versions.id(req.params.versionId);
  if (!version) {
    throw new ApiError(404, 'Version not found.');
  }

  // Archive the current state too, so reverting is itself reversible
  trip.versions.push({
    label: 'Before manual revert',
    itinerary: trip.itinerary,
    estimatedBudget: trip.estimatedBudget,
  });

  trip.itinerary = version.itinerary;
  if (version.estimatedBudget) trip.estimatedBudget = version.estimatedBudget;

  await trip.save();
  res.status(200).json({ success: true, trip });
});

module.exports = {
  generateTrip,
  getTrips,
  getTrip,
  updateTrip,
  deleteTrip,
  regenerateDay,
  revertToVersion,
};
