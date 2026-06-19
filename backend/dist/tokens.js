import crypto from 'crypto';
import { supabase } from './supabase.client';
const APP_URL = (process.env.APP_URL || 'http://localhost:4200').replace(/\/+$/, '');
function generateShortToken() {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const bytes = crypto.randomBytes(6);
    let token = '';
    for (let i = 0; i < 6; i++) {
        token += chars[bytes[i] % 62];
    }
    return token;
}
export async function generateConfirmationLink(studentId, date, adminText) {
    let token;
    let attempts = 0;
    do {
        token = generateShortToken();
        const { data: existing } = await supabase
            .from('confirmation_tokens')
            .select('token')
            .eq('token', token)
            .single();
        if (!existing)
            break;
        attempts++;
    } while (attempts < 5);
    const { error } = await supabase.from('confirmation_tokens').insert({
        token,
        student_id: studentId,
        date,
        admin_text: adminText,
    });
    if (error)
        throw new Error('Failed to store confirmation token');
    return `${APP_URL}/c/${token}`;
}
export async function lookupConfirmationToken(token) {
    const { data, error } = await supabase
        .from('confirmation_tokens')
        .select('student_id, date, admin_text')
        .eq('token', token)
        .single();
    if (error || !data)
        return null;
    return {
        studentId: data.student_id,
        date: data.date,
        adminText: data.admin_text,
    };
}
