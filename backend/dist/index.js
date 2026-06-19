import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { router } from './routes';
import { whatsappService } from './whatsapp.service';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const app = express();
app.use(cors({ origin: ['http://localhost:4200'] }));
app.use(express.json());
app.use('/api', router);
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
app.listen(PORT, () => {
    console.log(`[jawlah-backend] Server running on http://localhost:${PORT}`);
    console.log(`[jawlah-backend] WhatsApp connecting...`);
    whatsappService.connect().catch((err) => {
        console.error('[jawlah-backend] Failed to start WhatsApp:', err);
    });
});
whatsappService.on('qr', () => {
    console.log('[jawlah-backend] QR code available. GET /api/qr to view.');
});
whatsappService.on('ready', () => {
    console.log('[jawlah-backend] WhatsApp connected and ready.');
});
whatsappService.on('disconnected', (reason) => {
    console.log('[jawlah-backend] WhatsApp disconnected:', reason);
});
whatsappService.on('auth_failure', () => {
    console.error('[jawlah-backend] WhatsApp auth failed. QR expired or invalid.');
});
