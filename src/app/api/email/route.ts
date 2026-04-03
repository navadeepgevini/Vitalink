import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _body = await request.json();

    return NextResponse.json({ success: true, message: "Email sent successfully (Simulated)" });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to send email" }, { status: 500 });
  }
}
