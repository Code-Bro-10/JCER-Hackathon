import mongoose from 'mongoose';

const emergencyDispatchSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    unitCode: {
      type: String,
      required: true,
      trim: true,
    },
    unitType: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: 'Active En Route',
    },
    origin: {
      type: String,
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    corridorName: {
      type: String,
      default: 'Emergency Green Corridor',
    },
    currentSpeed: {
      type: Number,
      default: 70,
    },
    distanceRemainingKm: {
      type: Number,
      default: 5.0,
    },
    etaMinutes: {
      type: Number,
      default: 4.0,
    },
    signalsPreempted: {
      type: Number,
      default: 0,
    },
    signalsTotal: {
      type: Number,
      default: 6,
    },
    timeSavedMinutes: {
      type: Number,
      default: 5.0,
    },
    priorityLevel: {
      type: String,
      enum: ['CODE RED', 'CODE AMBER', 'STANDBY'],
      default: 'CODE RED',
    },
    routeWaypoints: {
      type: [String],
      default: [],
    },
    activeSince: {
      type: String,
      default: 'Just now',
    },
  },
  {
    timestamps: true,
  }
);

emergencyDispatchSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export const EmergencyDispatch = mongoose.model('EmergencyDispatch', emergencyDispatchSchema);

