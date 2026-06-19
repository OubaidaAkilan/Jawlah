import { Client, LocalAuth } from 'whatsapp-web.js';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export interface SendResult {
  studentId: string;
  nickname: string;
  phone: string;
  status: 'sent' | 'failed';
  error?: string;
}

function resolveChromeExecutable(): string {
  const fromEnv = process.env.CHROME_PATH?.trim();
  if (fromEnv && fs.existsSync(fromEnv)) {
    return fromEnv;
  }

  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(
      process.env.LOCALAPPDATA || '',
      'Google\\Chrome\\Application\\chrome.exe'
    ),
  ];

  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) {
    throw new Error(
      'Google Chrome not found. Install Chrome or set CHROME_PATH environment variable'
    );
  }

  return found;
}

function normalizeJordanJid(phoneRaw: string): string {
  let digits = phoneRaw.replace(/\D/g, '');

  if (digits.startsWith('962')) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);

  if (digits.length !== 9) {
    throw new Error(`رقم غير صالح: ${phoneRaw}`);
  }

  return `962${digits}@c.us`;
}

function sessionDir(): string {
  return path.join(process.cwd(), '.wwebjs_auth');
}

function clearSession(): void {
  const dir = sessionDir();
  if (fs.existsSync(dir)) {
    console.log('[jawlah-backend] Clearing stale WhatsApp session...');
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch { /* locked by another process */ }
  }
}

function killZombieChrome(): void {
  try {
    execSync('taskkill /F /IM chrome.exe /T 2>nul', { stdio: 'ignore' });
    console.log('[jawlah-backend] Killed zombie Chrome processes');
  } catch { /* no processes to kill */ }
}

export class WhatsAppService extends EventEmitter {
  private client: Client | null = null;
  private ready = false;
  private qrData: string | null = null;
  private connecting = false;

  async connect(): Promise<void> {
    if (this.connecting) return;
    this.connecting = true;

    killZombieChrome();

    const executablePath = resolveChromeExecutable();
    console.log(`[jawlah-backend] Using Chrome at: ${executablePath}`);

    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'jawlah',
        dataPath: path.join(process.cwd(), '.wwebjs_auth'),
      }),
      puppeteer: {
        headless: true,
        executablePath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-blink-features=AutomationControlled',
          '--disable-sync',
          '--no-default-browser-check',
        ],
      },
    });

    this.client.on('qr', (qr: string) => {
      this.qrData = qr;
      this.emit('qr', qr);
    });

    this.client.on('ready', () => {
      this.ready = true;
      this.connecting = false;
      this.emit('ready');
    });

    this.client.on('disconnected', (reason: string) => {
      this.ready = false;
      this.emit('disconnected', reason);
      setTimeout(() => this.reconnect(), 5000);
    });

    this.client.on('auth_failure', () => {
      this.ready = false;
      this.qrData = null;
      clearSession();
      this.emit('auth_failure');
    });

    try {
      await this.client.initialize();
    } catch (err) {
      this.connecting = false;
      throw err;
    }
  }

  private async reconnect(): Promise<void> {
    this.connecting = false;
    this.qrData = null;
    await this.connect();
  }

  async destroy(): Promise<void> {
    this.ready = false;
    this.qrData = null;
    this.connecting = false;
    if (this.client) {
      try {
        await this.client.destroy();
      } catch { /* ignore */ }
      this.client = null;
    }
  }

  isReady(): boolean {
    return this.ready;
  }

  getQrData(): string | null {
    return this.qrData;
  }

  private async sendSingle(
    phoneRaw: string,
    text: string
  ): Promise<void> {
    if (!this.client) throw new Error('WhatsApp client not initialized');

    const jid = normalizeJordanJid(phoneRaw);
    const phoneNumber = jid.replace('@c.us', '');

    const numberId = await this.client.getNumberId(phoneNumber);
    if (!numberId) {
      throw new Error('الرقم غير مسجل على واتساب');
    }

    const serialized =
      typeof numberId === 'string'
        ? numberId
        : (numberId as { _serialized: string })._serialized;

    const resolved = await this.client.getContactLidAndPhone([serialized]);
    const target = resolved[0]?.lid || resolved[0]?.pn || serialized;

    try {
      await this.client.sendMessage(target, text);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('No LID') || msg.includes('not connected')) {
        this.emit('disconnected', msg);
      }
      throw err;
    }
  }

  async sendMessages(
    students: { id: string; nickname: string; phone: string; personalizedMessage?: string }[],
    messageTemplate: string,
    options?: { delayBetween?: number; maxRetries?: number }
  ): Promise<SendResult[]> {
    const delay = options?.delayBetween ?? 45000;
    const maxRetries = options?.maxRetries ?? 1;
    const results: SendResult[] = [];

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const text = student.personalizedMessage ?? messageTemplate.replace(/\{\{nickname\}\}/g, student.nickname);
      let lastError: string | undefined;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            await new Promise((resolve) => setTimeout(resolve, 5000));
          }
          await this.sendSingle(student.phone, text);
          results.push({
            studentId: student.id,
            nickname: student.nickname,
            phone: student.phone,
            status: 'sent',
          });
          lastError = undefined;
          break;
        } catch (err) {
          lastError = err instanceof Error ? err.message : 'Unknown error';
          if (attempt < maxRetries) {
            console.log(
              `[jawlah-backend] Retry ${attempt + 1}/${maxRetries} for ${student.nickname || student.phone}: ${lastError}`
            );
          }
        }
      }

      if (lastError) {
        results.push({
          studentId: student.id,
          nickname: student.nickname,
          phone: student.phone,
          status: 'failed',
          error: lastError,
        });
      }

      if (i < students.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return results;
  }
}

export const whatsappService = new WhatsAppService();
