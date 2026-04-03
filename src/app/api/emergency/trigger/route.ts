import { NextResponse } from 'next/server';
import { getDoctors, addEmergency, type EmergencyAlert } from '@/lib/dataStore';

// Haversine formula to calculate distance between two GPS coordinates
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Generate random GPS near a point (for demo doctors)
function randomNearby(lat: number, lng: number, maxKm: number): { lat: number; lng: number } {
  const r = maxKm / 111.32; // approx degrees
  const angle = Math.random() * 2 * Math.PI;
  const dist = Math.random() * r;
  return { lat: lat + dist * Math.cos(angle), lng: lng + dist * Math.sin(angle) };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patientUsername, patientName, lat, lng, bloodGroup, allergies, vitals, problem } = body;

    if (!patientUsername || !lat || !lng) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const radiusKm = 5; // Search radius
    const doctors = getDoctors();

    // Assign random GPS to doctors and calculate distance
    const nearbyDoctors = doctors.map(doc => {
      const gps = randomNearby(lat, lng, radiusKm);
      const distance = haversineDistance(lat, lng, gps.lat, gps.lng);
      return {
        username: doc.username,
        fullName: doc.fullName,
        specialty: doc.specialty || 'General Medicine',
        distance: Math.round(distance * 100) / 100,
        lat: gps.lat,
        lng: gps.lng,
        status: 'pending' as 'pending' | 'alerted' | 'accepted' | 'declined',
      };
    }).sort((a, b) => a.distance - b.distance);

    // If no doctors, create demo doctors
    const doctorQueue = nearbyDoctors.length > 0 ? nearbyDoctors : [
      { username: 'dr_sharma', fullName: 'Dr. Priya Sharma', specialty: 'Cardiology', distance: 0.8, lat: lat + 0.005, lng: lng + 0.003, status: 'pending' as 'pending' | 'alerted' | 'accepted' | 'declined' },
      { username: 'dr_kumar', fullName: 'Dr. Arun Kumar', specialty: 'General Medicine', distance: 1.2, lat: lat - 0.008, lng: lng + 0.006, status: 'pending' as 'pending' | 'alerted' | 'accepted' | 'declined' },
      { username: 'dr_reddy', fullName: 'Dr. Meena Reddy', specialty: 'Emergency Medicine', distance: 1.9, lat: lat + 0.012, lng: lng - 0.009, status: 'pending' as 'pending' | 'alerted' | 'accepted' | 'declined' },
    ];

    // Alert the first doctor
    doctorQueue[0].status = 'alerted';

    const emergency: EmergencyAlert = {
      id: `emer_${Date.now()}`,
      patientUsername,
      patientName: patientName || 'Anonymous Patient',
      lat,
      lng,
      bloodGroup: bloodGroup || 'Unknown',
      allergies: allergies || [],
      vitals: vitals || { heartRate: 110, bp: '90/60', spo2: 94, temp: 38.2 },
      problem: problem || 'Emergency — details pending',
      status: 'alerted',
      doctorQueue,
      currentDoctorIndex: 0,
      alertedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    addEmergency(emergency);

    return NextResponse.json({
      emergencyId: emergency.id,
      status: 'alerted',
      doctorsFound: doctorQueue.length,
      nearestDoctor: {
        fullName: doctorQueue[0].fullName,
        specialty: doctorQueue[0].specialty,
        distance: doctorQueue[0].distance,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
