import mongoose from 'mongoose';

const stationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  officersAvailable: { type: Number, default: 0 }
});

const Station = mongoose.model('Station', stationSchema);
export default Station;
