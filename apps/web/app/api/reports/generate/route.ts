import { NextRequest, NextResponse } from 'next/server';
import { generateCSV, generateExcel, trackReportGeneration } from '../../../../lib/exports/reports';

export const runtime = 'nodejs';

const fetchReportData = async (type: string, filters: any = {}) => {
    return [
        { id: 1, type, status: 'active', ...filters },
        { id: 2, type, status: 'completed', ...filters },
    ];
};

export async function POST(req: NextRequest) {
    try {
        const { type, format, filters, userId = 'system' } = await req.json();

        if (!type || !format) {
            return NextResponse.json({ error: 'Missing type or format parameters' }, { status: 400 });
        }

        // PDF generation is temporarily disabled due to dependency issues
        // Only CSV and Excel formats are supported
        if (format === 'pdf') {
            return NextResponse.json(
                { error: 'PDF generation is temporarily unavailable. Please use CSV or Excel format.' },
                { status: 503 }
            );
        }

        const data = await fetchReportData(type, filters);
        let fileBuffer: Buffer | string = '';
        let contentType = '';
        let extension = '';

        if (format === 'csv') {
            fileBuffer = generateCSV(data);
            contentType = 'text/csv';
            extension = 'csv';
        } else if (format === 'excel') {
            fileBuffer = generateExcel(data);
            contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            extension = 'xlsx';
        } else {
            return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
        }

        await trackReportGeneration(userId, type, format, JSON.stringify(filters || {}));

        const body: BodyInit = Buffer.isBuffer(fileBuffer) ? new Uint8Array(fileBuffer) : fileBuffer;
        return new NextResponse(body, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${type}-report-${Date.now()}.${extension}"`,
            },
        });
    } catch (error: any) {
        console.error('Report Generation Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
