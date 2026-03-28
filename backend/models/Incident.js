import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema({
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  incidentType: {
    type: String,
    enum: ['Booth Capture', 'Violence', 'EVM Tampering', 'Suspicious Activity'],
    required: true,
    default: 'Suspicious Activity'
  },
  severityLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    required: true,
    default: 'High'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'resolved'],
    default: 'pending'
  },
  assignedOfficer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Officer',
    default: null
  }
}, { timestamps: true });

export default mongoose.model('Incident', incidentSchema);
