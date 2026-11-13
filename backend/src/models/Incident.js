import mongoose from 'mongoose';

const incidentHistorySchema = new mongoose.Schema({
  time: { type: String, default: 'Just now' },
  event: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const incidentSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Incident title is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['accident', 'breakdown', 'signal_fault', 'roadwork', 'debris', 'other'],
      default: 'accident',
    },
    typeName: {
      type: String,
      default: 'Incident',
    },
    severity: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
      default: 'MEDIUM',
      index: true,
    },
    sector: {
      type: String,
      required: [true, 'City sector is required'],
      index: true,
    },
    location: {
      type: String,
      required: [true, 'Location or cross-street is required'],
      trim: true,
    },
    coordinates: {
      x: { type: Number, default: 50 },
      y: { type: Number, default: 50 },
    },
    reportedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Reported', 'Acknowledged', 'Dispatched', 'Resolving', 'Resolved'],
      default: 'Reported',
      index: true,
    },
    lanesBlocked: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalLanes: {
      type: Number,
      default: 3,
      min: 1,
    },
    estimatedDelay: {
      type: String,
      default: '10 mins',
    },
    impactRadius: {
      type: String,
      default: '1.0 km',
    },
    assignedUnits: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      default: 'Incident logged in command system.',
    },
    actionRequired: {
      type: String,
      default: 'Monitor and coordinate traffic response.',
    },
    cameraFeedId: {
      type: String,
      default: null,
    },
    history: [incidentHistorySchema],
  },
  {
    timestamps: true,
  }
);

incidentSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export const Incident = mongoose.model('Incident', incidentSchema);

