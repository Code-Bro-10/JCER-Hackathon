import mongoose from 'mongoose';

const intersectionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sector: {
      type: String,
      required: true,
      index: true,
    },
    currentPhase: {
      type: String,
      default: 'North-South Green',
    },
    phaseColor: {
      type: String,
      enum: ['green', 'amber', 'red'],
      default: 'green',
    },
    secondsRemaining: {
      type: Number,
      default: 45,
    },
    totalCycle: {
      type: Number,
      default: 60,
    },
    mode: {
      type: String,
      enum: ['AI Adaptive', 'Semi-Autonomous', 'Manual Override', 'Emergency Priority Locked'],
      default: 'AI Adaptive',
    },
    efficiencyScore: {
      type: Number,
      default: 90,
      min: 0,
      max: 100,
    },
    queueNorth: {
      type: Number,
      default: 0,
    },
    queueSouth: {
      type: Number,
      default: 0,
    },
    queueEast: {
      type: Number,
      default: 0,
    },
    queueWest: {
      type: Number,
      default: 0,
    },
    cameraConnected: {
      type: Boolean,
      default: true,
    },
    lastOptimized: {
      type: String,
      default: 'Just now',
    },
    recommendation: {
      type: String,
      default: 'Phase balance optimal.',
    },
  },
  {
    timestamps: true,
  }
);

intersectionSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export const Intersection = mongoose.model('Intersection', intersectionSchema);

