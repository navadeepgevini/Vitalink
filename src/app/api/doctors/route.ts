import { NextResponse } from 'next/server';
import { getDoctors } from '@/lib/dataStore';

export async function GET() {
  try {
    const doctors = getDoctors().map(d => ({
      username: d.username,
      fullName: d.fullName,
      specialty: d.specialty,
    }));
    return NextResponse.json({ doctors });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
