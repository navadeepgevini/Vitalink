import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/dataStore';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');

        const users = getUsers();
        
        // Remove passwords from response
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const safeUsers = users.map(({ password, ...u }) => u);

        if (role) {
            return NextResponse.json({ users: safeUsers.filter(u => u.role === role) });
        }

        return NextResponse.json({ users: safeUsers });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
