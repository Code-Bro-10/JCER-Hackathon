import mongoose from 'mongoose';

const hourlyCurveSchema = new mongoose.Schema({
  hour: { type: String, required: true },
  actual: { type: Number, default: null },
  predicted: { type: Number, required: true },
  aiOptimized: { type: Number, required: true },
  capacity: { type: Number, default: 55000 },
  congestion: { type: Number, required: true },
  speed: { type: Number, required: true },
});

const bottleneckSchema = new mongoose.Schema({
  id: { type: String, required: true },
  intersection: { type: String, required: true },
  sector: { type: String, required: true },
  riskScore: { type: Number, required: true },
  peakHour: { type: String, required: true },
  currentVCRatio: { type: Number, required: true },
  predictedQueueMeters: { type: Number, required: true },
  impact: { type: String, required: true },
  mitigationStrategy: { type: String, required: true },
});

const predictionDatasetSchema = new mongoose.Schema(
  {
    horizon: { type: String, default: '24h' },
    hourlyCurves: [hourlyCurveSchema],
    bottlenecks: [bottleneckSchema],
    modelMetadata: {
      name: { type: String, default: 'UrbanSpatialGraph-v4 (LSTM + GNN)' },
      confidence: { type: Number, default: 96.4 },
      dataPointsTrained: { type: String, default: '48.2M sensor hours' },
      latencyMs: { type: Number, default: 14 },
    },
  },
  { timestamps: true }
);

predictionDatasetSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export const PredictionDataset = mongoose.model('PredictionDataset', predictionDatasetSchema);

