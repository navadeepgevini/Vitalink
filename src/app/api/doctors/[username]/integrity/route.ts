import { NextResponse } from 'next/server';
import { calculateIntegrityScore } from '@/lib/integrityScore';
import { upsertIntegrity, getIntegrityForDoctor } from '@/lib/dataStore';

export async function GET(request: Request, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params;

    // Calculate fresh score
    const score = calculateIntegrityScore(username);
    upsertIntegrity(score);

    return NextResponse.json(score);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
