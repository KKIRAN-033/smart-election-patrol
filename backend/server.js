import express from 'express';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

import Officer from './models/Officer.js';
import Incident from './models/Incident.js';
import Station from './models/Station.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH']
  }
});

import http from 'http';

app.use(cors());
app.use(express.json());

// Native polyfill for fetching specific Route length natively without hitting Table limits
const getRouteDistance = (lat1, lon1, lat2, lon2) => new Promise((resolve) => {
  const url = `http://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
  http.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.routes && json.routes[0]) {
           resolve(json.routes[0].distance); // Output precisely physical meters
        } else {
           resolve(Infinity);
        }
      } catch (e) {
        resolve(Infinity);
      }
    });
  }).on('error', () => resolve(Infinity));
});

// Math utils for Haversine distance tracking (returns km)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Proxied Route for OSRM — tries multiple servers for maximum reliability
// This is the backbone that makes police cars follow REAL ROADS like Google Maps!
const OSRM_SERVERS = [
  'http://router.project-osrm.org',
  'http://routing.openstreetmap.de/routed-car'
];

const fetchOSRM = (url) => new Promise((resolve, reject) => {
  const request = http.get(url, { timeout: 8000 }, (response) => {
    let data = '';
    response.on('data', chunk => data += chunk);
    response.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.routes && json.routes[0]) {
          resolve(json);
        } else {
          reject(new Error('No routes found'));
        }
      } catch (e) {
        reject(new Error('Parse error'));
      }
    });
  });
  request.on('error', reject);
  request.on('timeout', () => { request.destroy(); reject(new Error('Timeout')); });
});

app.get('/route', async (req, res) => {
  const { startLat, startLng, endLat, endLng } = req.query;
  if (!startLat || !startLng || !endLat || !endLng) {
    return res.status(400).json({ error: 'Missing coordinates' });
  }

  for (const server of OSRM_SERVERS) {
    try {
      const url = `${server}/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
      const json = await fetchOSRM(url);
      return res.json(json); // Success! Return road route instantly
    } catch (e) {
      console.warn(`[Route Proxy] ${server} failed:`, e.message);
    }
  }

  res.status(502).json({ error: 'All OSRM routing servers failed' });
});

// Routes
app.get('/personnel', async (req, res) => {
  try {
    const officers = await Officer.find();
    res.json(officers);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching personnel' });
  }
});

// Accepts live patrol tracking updates so dispatching relies on real real-time positions
app.patch('/officer/:id/location', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (!lat || !lng) return res.status(400).send();
    // Update silently without triggering socket blasts to keep network quiet
    await Officer.findByIdAndUpdate(req.params.id, { location: { lat, lng } });
    res.status(200).send();
  } catch (error) {
    res.status(500).send();
  }
});

app.get('/stations', async (req, res) => {
  try {
    const stations = await Station.find();
    res.json(stations);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching stations' });
  }
});

app.post('/station', async (req, res) => {
  const { name, location } = req.body;
  if (!location || !location.lat || !location.lng) return res.status(400).json({ error: 'Valid location required' });
  try {
    const newStation = new Station({
      name: name || 'Police Booth',
      location: location,
      officersAvailable: 1
    });
    await newStation.save();
    io.emit('station_created', newStation);
    res.status(201).json(newStation);
  } catch (error) {
    res.status(500).json({ error: 'Error creating station' });
  }
});

app.delete('/station/:id', async (req, res) => {
  try {
    await Station.findByIdAndDelete(req.params.id);
    io.emit('station_deleted', req.params.id);
    res.json({ message: 'Station deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting station' });
  }
});



app.get('/incidents', async (req, res) => {
  try {
    // Only fetch incidents that are pending or active. Wipes old radar blips.
    const incidents = await Incident.find({ status: { $ne: 'resolved' } }).populate('assignedOfficer');
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching incidents' });
  }
});

app.post('/incident', async (req, res) => {
  const { location, incidentType, severityLevel } = req.body;
  if (!location || !location.lat || !location.lng) {
    return res.status(400).json({ error: 'Valid location required' });
  }

  try {
    // 1. Create the incident
    const newIncident = new Incident({
      location: location,
      incidentType: incidentType || 'Suspicious Activity',
      severityLevel: severityLevel || 'High',
      status: 'pending'
    });
    
    // 2. Find nearest free officer
    const freeOfficers = await Officer.find({ status: 'free' });
    if (freeOfficers.length === 0) {
      await newIncident.save();
      io.emit('incident_created', newIncident);
      return res.status(201).json({ message: 'Incident created, no officers available', incident: newIncident });
    }

      // Pre-sort by straight-line to select the most reasonable candidates
      let candidateOfficers = freeOfficers.map(off => ({
         officer: off,
         straightDist: calculateDistance(location.lat, location.lng, off.location.lat, off.location.lng)
      })).sort((a, b) => a.straightDist - b.straightDist);

      // Instantly pick the closest officer without waiting for external Road APIs!
      let nearestOfficer = candidateOfficers[0].officer;

      // 3. Assign automatically
    newIncident.assignedOfficer = nearestOfficer._id;
    newIncident.status = 'active';
    await newIncident.save();

    nearestOfficer.status = 'busy';
    await nearestOfficer.save();

    const populatedIncident = await Incident.findById(newIncident._id).populate('assignedOfficer');

    // 4. Send real-time alert
    io.emit('incident_assigned', populatedIncident);
    io.emit('officer_updated', nearestOfficer);

    res.status(201).json(populatedIncident);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating incident' });
  }
});

app.patch('/incident/status', async (req, res) => {
  const { incidentId, status } = req.body;
  if (!incidentId || !status) return res.status(400).json({ error: 'Missing required fields' });

  try {
    const incident = await Incident.findById(incidentId);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    
    incident.status = status;
    await incident.save();

    let officerUpdated = null;
    if (status === 'resolved' && incident.assignedOfficer) {
      const officer = await Officer.findById(incident.assignedOfficer);
      if (officer) {
        // Assume officer reached the location, update their location
        officer.location = incident.location;
        officer.status = 'free';
        await officer.save();
        officerUpdated = officer;
        io.emit('officer_updated', officer);
      }
    }

    const populatedIncident = await Incident.findById(incidentId).populate('assignedOfficer');
    io.emit('incident_updated', populatedIncident);

    res.json({ incident: populatedIncident, officer: officerUpdated });
  } catch (error) {
    res.status(500).json({ error: 'Error updating incident' });
  }
});



// Socket Connections
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Custom Live GPS Tracking Event
  // When a connected police app emits 'live_police_location', broadcast it immediately to all other connected peers
  socket.on('live_police_location', (data) => {
    // Include the socket.id so the frontend can track individual devices
    socket.broadcast.emit('live_police_location_update', { id: socket.id, lat: data.lat, lng: data.lng, status: data.status });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Notify all clients to remove this device's marker from their maps
    io.emit('live_police_disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

// Need to safely connect without crashing if MongoDB isn't ready
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patrol')
  .then(() => {
    console.log('Connected to MongoDB');
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error. Please configure MONGODB_URI in .env');
    console.error('Stack:', err);
    // Continue running to show backend exists but DB fails
    httpServer.listen(PORT, () => {
        console.log(`HTTP Server running on port ${PORT} with DB disconnected...`);
    });
  });
