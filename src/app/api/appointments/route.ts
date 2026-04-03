import { NextResponse } from 'next/server';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { addAppointment, getAppointmentsByPatient, getAppointmentsByDoctor, getDoctors, UPLOAD_DIR, type Appointment } from '@/lib/dataStore';

// GET: Fetch appointments for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const role = searchParams.get('role');

    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    let appointments;
    if (role === 'admin') {
      // Admin gets all appointments
      const { getAppointments } = await import('@/lib/dataStore');
      appointments = getAppointments();
    } else if (role === 'doctor') {
      if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });
      appointments = getAppointmentsByDoctor(username);
    } else {
      if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });
      appointments = getAppointmentsByPatient(username);
    }

    return NextResponse.json({ appointments });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

// POST: Create a new appointment (with optional file upload)
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    const patientUsername = formData.get('patientUsername') as string;
    const patientName = formData.get('patientName') as string;
    const doctorUsername = formData.get('doctorUsername') as string;
    const doctorName = formData.get('doctorName') as string;
    const age = parseInt(formData.get('age') as string);
    const problem = formData.get('problem') as string;
    const type = formData.get('type') as Appointment['type'];
    const date = formData.get('date') as string;
    const time = formData.get('time') as string;
    const payment = formData.get('payment') as string;
    const reportFile = formData.get('report') as File | null;

    if (!patientUsername || !doctorUsername || !problem || !date) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    // Handle file upload (max 16MB)
    let reportFileName: string | undefined;
    if (reportFile && reportFile.size > 0) {
      if (reportFile.size > 16 * 1024 * 1024) {
        return NextResponse.json({ error: 'File too large. Max 16MB.' }, { status: 400 });
      }
      const ext = reportFile.name.split('.').pop();
      reportFileName = `report_${Date.now()}_${patientUsername}.${ext}`;
      const bytes = await reportFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      writeFileSync(join(UPLOAD_DIR, reportFileName), buffer);
    }

    const appointment: Appointment = {
      id: `appt_${Date.now()}`,
      patientUsername,
      patientName,
      doctorUsername,
      doctorName,
      age,
      problem,
      type: type || 'Virtual',
      date,
      time: time || '10:00 AM',
      status: 'Pending',
      reportFile: reportFileName,
      payment: payment || 'Pending',
      createdAt: new Date().toISOString(),
    };

    addAppointment(appointment);

    return NextResponse.json({ message: 'Appointment booked successfully', appointment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to book appointment', detail: error?.message }, { status: 500 });
  }
}
