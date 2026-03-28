import mongoose from 'mongoose';
import Officer from '../models/Officer.js';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/patrol';

const officersData = [
  { name: 'Alpha-01', location: { lat: 14.675, lng: 77.585 }, status: 'free' },
  { name: 'Bravo-02', location: { lat: 14.689, lng: 77.592 }, status: 'free' },
  { name: 'Charlie-03', location: { lat: 14.671, lng: 77.601 }, status: 'free' },
  { name: 'Delta-04', location: { lat: 14.665, lng: 77.575 }, status: 'free' },
  { name: 'Echo-05', location: { lat: 14.698, lng: 77.580 }, status: 'free' },
  { name: 'Foxtrot-06', location: { lat: 14.660, lng: 77.590 }, status: 'free' },
  { name: 'Gamma-07', location: { lat: 14.685, lng: 77.570 }, status: 'free' },
  { name: 'Hotel-08', location: { lat: 14.695, lng: 77.605 }, status: 'free' },
  { name: 'India-09', location: { lat: 14.670, lng: 77.565 }, status: 'free' },
  { name: 'Juliet-10', location: { lat: 14.682, lng: 77.610 }, status: 'free' },
  { name: 'Kilo-11', location: { lat: 14.692, lng: 77.560 }, status: 'free' },
  { name: 'Lima-12', location: { lat: 14.668, lng: 77.615 }, status: 'free' },
  { name: 'Mike-13', location: { lat: 14.678, lng: 77.555 }, status: 'free' },
  { name: 'November-14', location: { lat: 14.655, lng: 77.595 }, status: 'free' },
  { name: 'Oscar-15', location: { lat: 14.662, lng: 77.605 }, status: 'free' },
  { name: 'Papa-16', location: { lat: 14.688, lng: 77.550 }, status: 'free' },
  { name: 'Quebec-17', location: { lat: 14.696, lng: 77.565 }, status: 'free' },
  { name: 'Romeo-18', location: { lat: 14.658, lng: 77.580 }, status: 'free' },
  { name: 'Sierra-19', location: { lat: 14.672, lng: 77.590 }, status: 'free' },
  { name: 'Tango-20', location: { lat: 14.684, lng: 77.585 }, status: 'free' },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB...');
    
    await Officer.deleteMany();
    console.log('Cleared existing officers...');
    
    await Officer.insertMany(officersData);
    console.log(`Inserted ${officersData.length} mock officers! Huge Fleet Generated!`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding DB:', error);
    process.exit(1);
  }
}

seed();
