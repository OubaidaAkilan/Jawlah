import { Router, Request, Response } from 'express';
import QRCode from 'qrcode';
import { supabase } from './supabase.client';
import { whatsappService } from './whatsapp.service';
import { generateConfirmationLink, verifyConfirmationToken } from './tokens';

export const router = Router();

router.get('/status', (_req: Request, res: Response) => {
  res.json({
    ready: whatsappService.isReady(),
    hasQr: !!whatsappService.getQrData(),
  });
});

router.get('/qr', async (_req: Request, res: Response) => {
  const qr = whatsappService.getQrData();
  if (!qr) {
    res.status(404).json({ error: 'QR not available yet. Connect first.' });
    return;
  }

  try {
    const qrImage = await QRCode.toDataURL(qr, { width: 300, margin: 2 });
    res.json({ qr: qrImage });
  } catch {
    res.status(500).json({ error: 'Failed to generate QR image' });
  }
});

router.post('/send', async (req: Request, res: Response) => {
  if (!whatsappService.isReady()) {
    res.status(400).json({ error: 'WhatsApp not connected. Scan QR first.' });
    return;
  }

  const { studentIds, message, date, confirmationText, enableConfirmationLink } = req.body as {
    studentIds?: string[];
    message?: string;
    date?: string;
    confirmationText?: string;
    enableConfirmationLink?: boolean;
  };

  if (!studentIds?.length || !message?.trim()) {
    res.status(400).json({ error: 'studentIds and message are required' });
    return;
  }

  const { data: students, error } = await supabase
    .from('students')
    .select('id, nickname, full_name, parent_phone_number')
    .in('id', studentIds)
    .eq('is_delete', false);

  if (error) {
    res.status(500).json({ error: 'Failed to fetch students', details: error });
    return;
  }

  if (!students.length) {
    res.status(404).json({ error: 'No students found' });
    return;
  }

  const recipients = students.map((s) => {
    const nickname = s.nickname || s.full_name.split(' ')[0];
    let personalizedMessage = message
      .replace(/\{\{nickname\}\}/g, nickname)
      .replace(/\{\{date\}\}/g, date || '');

    if (enableConfirmationLink && date) {
      let text = (confirmationText || '').trim() || 'نرجو تأكيد حضورك في البرنامج';
      text = text.replace(/\{\{nickname\}\}/g, nickname).replace(/\{\{date\}\}/g, date);
      const link = generateConfirmationLink(s.id, date, text);
      personalizedMessage = personalizedMessage.replace(/\{\{confirmation_link\}\}/g, link);
    }

    return {
      id: s.id,
      nickname,
      phone: s.parent_phone_number,
      personalizedMessage,
    };
  });

  const results = await whatsappService.sendMessages(recipients, message, {
    delayBetween: 45000,
  });

  const summary = {
    total: results.length,
    sent: results.filter((r) => r.status === 'sent').length,
    failed: results.filter((r) => r.status === 'failed').length,
    results,
  };

  res.json(summary);
});

router.post('/attendance/verify-link', async (req: Request, res: Response) => {
  const { studentId, date, text, sig } = req.body as {
    studentId?: string;
    date?: string;
    text?: string;
    sig?: string;
  };

  if (!studentId || !date || !sig) {
    res.status(400).json({ valid: false, error: 'Missing required fields' });
    return;
  }

  const textValue = text || '';
  if (!verifyConfirmationToken(studentId, date, textValue, sig)) {
    res.status(400).json({ valid: false, error: 'رابط غير صالح أو منتهي الصلاحية' });
    return;
  }

  const { data: student, error } = await supabase
    .from('students')
    .select('id, full_name, nickname, is_summer_program, is_saturday_program, is_unassigned_program')
    .eq('id', studentId)
    .eq('is_delete', false)
    .single();

  if (error || !student) {
    res.status(404).json({ valid: false, error: 'الطالب غير موجود' });
    return;
  }

  let program: string;
  if (student.is_summer_program) program = 'صيفي';
  else if (student.is_saturday_program) program = 'سبت';
  else program = 'غير مسجل';

  const { data: existing } = await supabase
    .from('attendance')
    .select('status, absence_reason')
    .eq('student_id', studentId)
    .eq('date', date)
    .single();

  res.json({
    valid: true,
    student: {
      full_name: student.full_name,
      nickname: student.nickname || student.full_name.split(' ')[0],
      program,
    },
    date,
    text: textValue,
    currentStatus: existing?.status || null,
    currentAbsenceReason: existing?.absence_reason || null,
  });
});

router.post('/attendance/confirm', async (req: Request, res: Response) => {
  const { studentId, date, text, sig, status, absenceReason } = req.body as {
    studentId?: string;
    date?: string;
    text?: string;
    sig?: string;
    status?: string;
    absenceReason?: string | null;
  };

  if (!studentId || !date || !sig || !status) {
    res.status(400).json({ success: false, error: 'Missing required fields' });
    return;
  }

  if (status !== 'present' && status !== 'absence') {
    res.status(400).json({ success: false, error: 'Invalid status' });
    return;
  }

  const textValue = text || '';
  if (!verifyConfirmationToken(studentId, date, textValue, sig)) {
    res.status(400).json({ success: false, error: 'رابط غير صالح أو منتهي الصلاحية' });
    return;
  }

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('is_delete', false)
    .single();

  if (studentError || !student) {
    res.status(404).json({ success: false, error: 'الطالب غير موجود' });
    return;
  }

  const { data: existing } = await supabase
    .from('attendance')
    .select('id, status')
    .eq('student_id', studentId)
    .eq('date', date)
    .single();

  const previousStatus = existing?.status || null;

  const record = {
    student_id: studentId,
    date,
    status,
    absence_reason: status === 'absence' ? (absenceReason || null) : null,
  };

  if (existing) {
    const { error: updateError } = await supabase
      .from('attendance')
      .update(record)
      .eq('id', existing.id);

    if (updateError) {
      res.status(500).json({ success: false, error: 'فشل تحديث الحضور' });
      return;
    }
  } else {
    const { error: insertError } = await supabase
      .from('attendance')
      .insert(record);

    if (insertError) {
      res.status(500).json({ success: false, error: 'فشل تسجيل الحضور' });
      return;
    }
  }

  res.json({
    success: true,
    status,
    previousStatus,
    absenceReason: record.absence_reason,
  });
});
