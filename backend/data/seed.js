import mongoose from 'mongoose';
import Officer from '../models/Officer.js';
import Station from '../models/Station.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env relative to this file so it works from any execution working directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/patrol';

const officersData = [
  { name: 'Alpha-01', location: { lat: 16.3065, lng: 80.4365 }, status: 'free' },
  { name: 'Bravo-02', location: { lat: 16.3115, lng: 80.4340 }, status: 'free' },
  { name: 'Charlie-03', location: { lat: 16.3080, lng: 80.4410 }, status: 'free' },
  { name: 'Delta-04', location: { lat: 16.3155, lng: 80.4215 }, status: 'free' },
  { name: 'Echo-05', location: { lat: 16.2950, lng: 80.4520 }, status: 'free' },
  { name: 'Foxtrot-06', location: { lat: 16.2910, lng: 80.4120 }, status: 'free' },
  { name: 'Gamma-07', location: { lat: 16.3310, lng: 80.4160 }, status: 'free' },
  { name: 'Hotel-08', location: { lat: 16.3360, lng: 80.4880 }, status: 'free' },
  { name: 'India-09', location: { lat: 16.3230, lng: 80.4190 }, status: 'free' },
  { name: 'Juliet-10', location: { lat: 16.3005, lng: 80.4445 }, status: 'free' },
  { name: 'Kilo-11', location: { lat: 16.3015, lng: 80.4395 }, status: 'free' },
  { name: 'Lima-12', location: { lat: 16.2975, lng: 80.4230 }, status: 'free' },
  { name: 'Mike-13', location: { lat: 16.3125, lng: 80.4085 }, status: 'free' },
  { name: 'November-14', location: { lat: 16.3000, lng: 80.4490 }, status: 'free' },
  { name: 'Oscar-15', location: { lat: 16.2905, lng: 80.4615 }, status: 'free' },
  { name: 'Papa-16', location: { lat: 16.2810, lng: 80.3720 }, status: 'free' },
  { name: 'Quebec-17', location: { lat: 16.3210, lng: 80.4010 }, status: 'free' },
  { name: 'Romeo-18', location: { lat: 16.3260, lng: 80.4420 }, status: 'free' },
  { name: 'Sierra-19', location: { lat: 16.3045, lng: 80.4265 }, status: 'free' },
  { name: 'Tango-20', location: { lat: 16.3030, lng: 80.4470 }, status: 'free' }
];

async function seed() {
  try {
    console.log('Connecting to DB at:', MONGO_URI.replace(/\/\/.*@/, '//<credentials>@'));
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB...');

    await Officer.deleteMany();
    console.log('Cleared existing officers...');

    await Officer.insertMany(officersData);
    console.log(`Inserted ${officersData.length} mock officers in Guntur surroundings!`);

    // Seed Stations as well
    const stationsPath = path.join(__dirname, 'stations.json');
    if (fs.existsSync(stationsPath)) {
      const stationsData = JSON.parse(fs.readFileSync(stationsPath, 'utf8'));
      await Station.deleteMany();
      await Station.insertMany(stationsData);
      console.log(`Inserted ${stationsData.length} stations in Guntur!`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding DB:', error);
    process.exit(1);
  }
}

seed();
