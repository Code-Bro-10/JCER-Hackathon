import mongoose from 'mongoose';

const sectorSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    congestion: { type: Number, default: 30 },
    speed: { type: Number, default: 45 },
    vehicles: { type: Number, default: 20000 },
    status: { type: String, default: 'Optimal' },
    color: { type: String, default: '#10b981' },
    trend: { type: String, default: '0%' },
    criticalIntersections: { type: Number, default: 0 },
    flowRate: { type: Number, default: 2500 },
  },
  { timestamps: true }
);

sectorSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export const Sector = mongoose.model('Sector', sectorSchema);

