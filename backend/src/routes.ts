import { Router, Request, Response } from 'express';
import QRCode from 'qrcode';
import { supabase } from './supabase.client';
import { whatsappService } from './whatsapp.service';

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

  const { studentIds, message } = req.body as {
    studentIds?: string[];
    message?: string;
  };

  if (!studentIds?.length || !message?.trim()) {
    res.status(400).json({ error: 'studentIds and message are required' });
    return;
  }

  const { data: students, error } = await supabase
    .from('students')
    .select('id, nickname, parent_phone_number')
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

  const recipients = students.map((s) => ({
    id: s.id,
    nickname: s.nickname || s.id.slice(0, 6),
    phone: s.parent_phone_number,
  }));

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
