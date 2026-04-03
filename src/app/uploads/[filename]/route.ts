import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { UPLOAD_DIR } from '@/lib/dataStore';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ filename: string }> }
) {
    try {
        const { filename } = await params;
        const filePath = join(UPLOAD_DIR, filename);

        if (!existsSync(filePath)) {
            return new NextResponse('File not found', { status: 404 });
        }

        const fileBuffer = readFileSync(filePath);
        
        // Determine content type based on extension
        const ext = filename.split('.').pop()?.toLowerCase();
        let contentType = 'application/octet-stream';
        
        if (ext === 'pdf') contentType = 'application/pdf';
        else if (['jpg', 'jpeg'].includes(ext!)) contentType = 'image/jpeg';
        else if (ext === 'png') contentType = 'image/png';
        else if (ext === 'gif') contentType = 'image/gif';

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `inline; filename="${filename}"`,
            },
        });
    } catch (error: any) {
        return new NextResponse(`Error serving file: ${error.message}`, { status: 500 });
    }
}
