import mongoose from 'mongoose';

const cameraSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    latitude: { type: Number, default: 15.8497 },
    longitude: { type: Number, default: 74.4977 },
    location: { type: String, default: 'Belagavi Central Corridor' },
    sector: { type: String, default: 'General Urban Sector' },
    sourceType: {
      type: String,
      default: 'demo_video',
    },
    streamUrl: { type: String, default: '' },
    rtspInternalUrl: { type: String, default: '' }, // Sensitive credentials stored on backend only
    snapshotUrl: { type: String, default: '' },
    attribution: { type: String, default: 'Public Smart Mobility Open Data' },
    usagePermissions: { type: String, default: 'Authorized Transit Telemetry' },
    status: {
      type: String,
      enum: ['ONLINE', 'OFFLINE', 'DEGRADED'],
      default: 'ONLINE',
    },
    lastChecked: { type: Date, default: Date.now },
    isEnabled: { type: Boolean, default: true },
    fps: { type: Number, default: 30 },
    bitrate: { type: String, default: '4.0 Mbps' },
    resolution: { type: String, default: '1080p 60fps' },
    detectedObjects: {
      cars: { type: Number, default: 0 },
      trucks: { type: Number, default: 0 },
      buses: { type: Number, default: 0 },
      pedestrians: { type: Number, default: 0 },
      cyclists: { type: Number, default: 0 },
      motorcycles: { type: Number, default: 0 },
      evs: { type: Number, default: 0 },
    },
    trafficDensity: { type: String, default: 'Optimal' },
    queueLengthMeters: { type: Number, default: 0 },
    stationaryVehiclesCount: { type: Number, default: 0 },
    aiAlert: { type: String, default: 'Normal flow, zero anomalies' },
    recentDetections: [
      {
        timestamp: { type: Date, default: Date.now },
        category: String,
        label: String,
        confidence: Number,
        vehicleCount: Number,
        queueLengthMeters: Number,
        evidenceFrame: String,
      },
    ],
  },
  { timestamps: true }
);

/**
 * Redact sensitive RTSP credentials before returning to client
 */
cameraSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  delete obj.rtspInternalUrl; // Never expose internal RTSP credentials

  // Redact any embedded passwords if streamUrl contains user:pass
  if (obj.streamUrl && obj.streamUrl.includes('@')) {
    obj.streamUrl = obj.streamUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
  }

  return obj;
};

export const Camera = mongoose.model('Camera', cameraSchema);
