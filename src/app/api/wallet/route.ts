import { NextResponse } from 'next/server';
import { addWalletTransaction, getWalletBalance, getUserWalletTransactions } from '@/lib/dataStore';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });

  const balance = getWalletBalance(username);
  const transactions = getUserWalletTransactions(username);

  return NextResponse.json({ balance, transactions });
}

export async function POST(request: Request) {
  try {
    const { username, type, amount, reason, appointmentId } = await request.json();

    if (!username || !type || !amount || !reason) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    addWalletTransaction({
      id: `txn_${Date.now()}`,
      username,
      type,
      amount,
      reason,
      appointmentId,
      createdAt: new Date().toISOString(),
    });

    const newBalance = getWalletBalance(username);
    return NextResponse.json({ message: 'Transaction recorded', balance: newBalance });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
