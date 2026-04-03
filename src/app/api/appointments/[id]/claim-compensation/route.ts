import { NextResponse } from 'next/server';
import { addWalletTransaction, getWalletBalance } from '@/lib/dataStore';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { patientUsername, delayMinutes } = await request.json();

    if (!patientUsername) {
      return NextResponse.json({ error: 'Patient username required' }, { status: 400 });
    }

    const delay = delayMinutes || 15;
    if (delay < 10) {
      return NextResponse.json({ error: 'Delay must be at least 10 minutes to claim' }, { status: 400 });
    }

    // Credit ₹200 to patient wallet
    const compensationAmount = 200;
    addWalletTransaction({
      id: `comp_${Date.now()}`,
      username: patientUsername,
      type: 'credit',
      amount: compensationAmount,
      reason: `Wait-time compensation: ${delay} min delay on appointment ${id}`,
      appointmentId: id,
      createdAt: new Date().toISOString(),
    });

    const newBalance = getWalletBalance(patientUsername);

    return NextResponse.json({
      message: `₹${compensationAmount} credited to your VitaLink Wallet`,
      amount: compensationAmount,
      balance: newBalance,
      appointmentId: id,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
