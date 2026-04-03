import { NextResponse } from 'next/server';
import { generateZKPToken } from '@/lib/zkpSession';

export async function POST(request: Request) {
  try {
    const { userId, appointmentId } = await request.json();
    if (!userId || !appointmentId) {
      return NextResponse.json({ error: 'userId and appointmentId required' }, { status: 400 });
    }

    const session = generateZKPToken(userId, appointmentId);
    return NextResponse.json(session);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
