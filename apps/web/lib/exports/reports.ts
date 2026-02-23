import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';

export type ReportItem = Record<string, any>;

export const generateCSV = (data: ReportItem[]): string => Papa.unparse(data);

export const generateExcel = (data: ReportItem[]): Buffer => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

/**
 * Track report generation in analytics
 */
export const trackReportGeneration = async (
    userId: string,
    type: string,
    format: string,
    filterDescription: string
) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return;

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from('report_history').insert({
            user_id: userId,
            report_type: type,
            format,
            filters: filterDescription,
            generated_at: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Failed to track report generation:', error);
    }
};
