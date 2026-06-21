const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    estimatedCostUSD: { type: Number, default: 0, min: 0 },
    timeOfDay: {
      type: String,
      enum: ['Morning', 'Afternoon', 'Evening'],
      default: 'Morning',
    },
  },
  { _id: true }
);

const ItineraryDaySchema = new mongoose.Schema(
  {
    dayNumber: { type: Number, required: true },
    theme: { type: String, default: '' },
    activities: [ActivitySchema],
  },
  { _id: false }
);

const HotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    tier: { type: String, default: '' },
    estimatedCostNightUSD: { type: Number, default: 0 },
    rating: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { _id: true }
);

const PackingItemSchema = new mongoose.Schema(
  {
    item: { type: String, required: true },
    category: {
      type: String,
      enum: ['Documents', 'Clothing', 'Gear', 'Other'],
      default: 'Other',
    },
    isPacked: { type: Boolean, default: false },
  },
  { _id: true }
);

const BudgetSchema = new mongoose.Schema(
  {
    transport: { type: Number, default: 0 },
    accommodation: { type: Number, default: 0 },
    food: { type: Number, default: 0 },
    activities: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false }
);

// Snapshot of the itinerary at a point in time. Powers the "Version History /
// Time Travel" creative feature: every AI generation or day-regeneration is
// archived so the user can compare or revert instead of losing a good plan.
const ItineraryVersionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true }, // e.g. "Initial generation", "Regenerated Day 3"
    itinerary: { type: [ItineraryDaySchema], default: [] },
    estimatedBudget: { type: BudgetSchema, default: () => ({}) },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const TripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    destination: { type: String, required: true, trim: true },
    durationDays: { type: Number, required: true, min: 1, max: 30 },
    budgetTier: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      required: true,
    },
    interests: [{ type: String }],
    travelMonth: { type: String, default: '' }, // optional, e.g. "July" - powers climate lookup

    itinerary: { type: [ItineraryDaySchema], default: [] },
    estimatedBudget: { type: BudgetSchema, default: () => ({}) },
    hotels: { type: [HotelSchema], default: [] },
    packingList: { type: [PackingItemSchema], default: [] },

    climateContext: {
      summary: { type: String, default: '' },
      avgHighC: { type: Number, default: null },
      avgLowC: { type: Number, default: null },
      precipitationMm: { type: Number, default: null },
      source: { type: String, default: '' }, // "open-meteo" | "llm-estimate"
    },

    versions: { type: [ItineraryVersionSchema], default: [] },
  },
  { timestamps: true }
);

TripSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Trip', TripSchema);
