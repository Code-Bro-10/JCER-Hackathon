import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['SIGNAL_OVERRIDE', 'EMERGENCY_PREEMPTION', 'INCIDENT_MUTATION', 'AUTH', 'SYSTEM'],
      required: true,
      index: true,
    },
    actor: {
      userId: { type: String, default: 'SYSTEM' },
      email: { type: String, default: 'system@trafficai.gov' },
      role: { type: String, default: 'system' },
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

auditLogSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);

