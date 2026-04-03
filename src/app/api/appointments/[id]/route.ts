import { NextResponse } from 'next/server';
import { updateAppointmentStatus, type Appointment } from '@/lib/dataStore';

// PATCH: Update appointment status (Pending → Confirmed/Completed/Cancelled)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    const validStatuses: Appointment['status'][] = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be: Pending, Confirmed, Completed, or Cancelled' }, { status: 400 });
    }

    const updated = updateAppointmentStatus(id, status);
    if (!updated) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json({ message: `Status updated to ${status}` });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
