import { NextResponse } from 'next/server';
import { getEmergencyById, updateEmergency, getActiveEmergencyForDoctor, getFcmTokensForUsername } from '@/lib/dataStore';
import { sendPushToTokens } from '@/lib/firebase/admin';

// GET: Check emergency status (patient polling) or check for alerts (doctor polling)
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // If id is "check", this is a doctor polling for alerts
    if (id === 'check') {
      const { searchParams } = new URL(request.url);
      const doctorUsername = searchParams.get('doctor');
      if (!doctorUsername) return NextResponse.json({ alert: null });

      const alert = getActiveEmergencyForDoctor(doctorUsername);
      if (!alert) return NextResponse.json({ alert: null });

      // Check if alert has timed out (60s)
      if (alert.alertedAt) {
        const elapsed = Date.now() - new Date(alert.alertedAt).getTime();
        if (elapsed > 60000) {
          // Auto-decline and cascade
          const queue = [...alert.doctorQueue];
          queue[alert.currentDoctorIndex].status = 'declined';
          const nextIdx = alert.currentDoctorIndex + 1;
          if (nextIdx < queue.length) {
            queue[nextIdx].status = 'alerted';
            updateEmergency(alert.id, { doctorQueue: queue, currentDoctorIndex: nextIdx, alertedAt: new Date().toISOString() });
          } else {
            updateEmergency(alert.id, { status: 'declined_all', doctorQueue: queue });
          }
          return NextResponse.json({ alert: null });
        }
      }

      return NextResponse.json({
        alert: {
          id: alert.id,
          patientName: alert.patientName,
          lat: alert.lat,
          lng: alert.lng,
          bloodGroup: alert.bloodGroup,
          allergies: alert.allergies,
          vitals: alert.vitals,
          problem: alert.problem,
          distance: alert.doctorQueue[alert.currentDoctorIndex]?.distance,
          alertedAt: alert.alertedAt,
        },
      });
    }

    // Regular emergency status check (patient)
    const emergency = getEmergencyById(id);
    if (!emergency) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
      id: emergency.id,
      status: emergency.status,
      acceptedDoctor: emergency.acceptedDoctor,
      currentDoctorIndex: emergency.currentDoctorIndex,
      totalDoctors: emergency.doctorQueue.length,
      currentDoctor: emergency.doctorQueue[emergency.currentDoctorIndex],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

// POST: Doctor responds to emergency (accept/decline)
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { action, doctorUsername } = await request.json();
    const emergency = getEmergencyById(id);

    if (!emergency) return NextResponse.json({ error: 'Emergency not found' }, { status: 404 });

    const queue = [...emergency.doctorQueue];
    const currentIdx = emergency.currentDoctorIndex;

    if (action === 'accept') {
      queue[currentIdx].status = 'accepted';
      const doc = queue[currentIdx];
      const eta = Math.round(doc.distance * 3 + 2); // ~3 min per km + 2 min overhead

      updateEmergency(id, {
        status: 'accepted',
        doctorQueue: queue,
        acceptedDoctor: {
          username: doc.username,
          fullName: doc.fullName,
          specialty: doc.specialty,
          distance: doc.distance,
          eta,
          lat: doc.lat,
          lng: doc.lng,
        },
        acceptedAt: new Date().toISOString(),
      });

      // Push notification to the patient (best-effort).
      try {
        const tokens = getFcmTokensForUsername(emergency.patientUsername);
        if (tokens.length) {
          await sendPushToTokens({
            tokens,
            title: 'Emergency Accepted',
            body: `${doc.fullName} (${doc.specialty}) is on the way. ETA ~${eta} min.`,
            data: {
              type: 'emergency_accepted',
              emergencyId: id,
              doctorUsername: doc.username,
              eta: String(eta),
            },
          });
        }
      } catch (e) {
        // Never fail the accept-flow because of push issues.
        // eslint-disable-next-line no-console
        console.error('FCM notify failed:', e);
      }

      return NextResponse.json({ message: 'Emergency accepted', eta, doctor: doc });
    }

    if (action === 'decline') {
      queue[currentIdx].status = 'declined';
      const nextIdx = currentIdx + 1;

      if (nextIdx < queue.length) {
        queue[nextIdx].status = 'alerted';
        updateEmergency(id, {
          doctorQueue: queue,
          currentDoctorIndex: nextIdx,
          alertedAt: new Date().toISOString(),
        });
        return NextResponse.json({ message: 'Declined — alerting next doctor', nextDoctor: queue[nextIdx].fullName });
      } else {
        updateEmergency(id, { status: 'declined_all', doctorQueue: queue });
        return NextResponse.json({ message: 'All doctors declined', status: 'declined_all' });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
