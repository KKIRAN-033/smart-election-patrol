import mongoose from 'mongoose';

const officerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  status: {
    type: String,
    enum: ['free', 'busy'],
    default: 'free'
  }
}, { timestamps: true });

export default mongoose.model('Officer', officerSchema);
