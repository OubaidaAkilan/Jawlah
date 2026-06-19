import crypto from 'crypto';
const SECRET = process.env.ATTENDANCE_SECRET;
const APP_URL = (process.env.APP_URL || 'http://localhost:4200').replace(/\/+$/, '');
function getSecret() {
    if (!SECRET)
        throw new Error('ATTENDANCE_SECRET environment variable is required');
    return SECRET;
}
export function generateConfirmationLink(studentId, date, adminText) {
    const secret = getSecret();
    const data = `${studentId}|${date}|${adminText}`;
    const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
    const params = new URLSearchParams({
        student: studentId,
        date,
        text: adminText,
        sig,
    });
    return `${APP_URL}/attendance/confirm?${params.toString()}`;
}
export function verifyConfirmationToken(studentId, date, adminText, sig) {
    const secret = getSecret();
    const data = `${studentId}|${date}|${adminText}`;
    const expected = crypto.createHmac('sha256', secret).update(data).digest('base64url');
    if (sig.length !== expected.length)
        return false;
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}
