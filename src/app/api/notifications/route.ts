import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAME, verifyToken } from '@/lib/auth';
import { getFcmTokensForUsername, upsertFcmToken } from '@/lib/dataStore';
import { sendPushToTokens } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body as { action?: string };

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(COOKIE_NAME)?.value;
    if (!sessionToken) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await verifyToken(sessionToken);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    if (action === 'register-token') {
      const { token } = body as { token?: string };
      if (!token || typeof token !== 'string') {
        return NextResponse.json({ success: false, error: 'FCM token is required' }, { status: 400 });
      }

      upsertFcmToken(payload.username, token);
      return NextResponse.json({ success: true, message: 'FCM token registered' });
    }

    if (action === 'send') {
      const { toUsername, title, body: messageBody, data } = body as {
        toUsername?: string;
        title?: string;
        body?: string;
        data?: Record<string, string>;
      };

      if (!title || !messageBody) {
        return NextResponse.json({ success: false, error: 'title and body are required' }, { status: 400 });
      }

      const targetUsername = toUsername || payload.username;
      const tokens = getFcmTokensForUsername(targetUsername);

      const result = await sendPushToTokens({
        tokens,
        title,
        body: messageBody,
        data,
      });

      return NextResponse.json({ success: true, ...result, toUsername: targetUsername });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action. Use 'register-token' or 'send'." },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ success: false, error: "Failed to process notification request" }, { status: 500 });
  }
}
