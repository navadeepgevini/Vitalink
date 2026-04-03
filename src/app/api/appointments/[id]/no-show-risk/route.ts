import { NextResponse } from 'next/server';
import { calculateNoShowRisk } from '@/lib/noShowPredictor';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: _id } = await params;
    const { searchParams } = new URL(request.url);
    const patientUsername = searchParams.get('patient') || '';
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const time = searchParams.get('time') || '10:00 AM';
    const type = searchParams.get('type') || 'Virtual';
    const createdAt = searchParams.get('createdAt') || new Date().toISOString();

    const result = calculateNoShowRisk({ patientUsername, date, time, type, createdAt });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
