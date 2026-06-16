import { Injectable } from '@angular/core';

export interface SendResult {
  studentId: string;
  nickname: string;
  phone: string;
  status: 'sent' | 'failed';
  error?: string;
}

export interface SendResponse {
  total: number;
  sent: number;
  failed: number;
  results: SendResult[];
}

@Injectable({ providedIn: 'root' })
export class MessagingService {
  private readonly apiUrl = 'http://localhost:3001/api';

  async checkStatus(): Promise<{ ready: boolean; hasQr: boolean }> {
    const res = await fetch(`${this.apiUrl}/status`);
    return res.json();
  }

  async getQr(): Promise<{ qr: string }> {
    const res = await fetch(`${this.apiUrl}/qr`);
    return res.json();
  }

  async send(studentIds: string[], message: string): Promise<SendResponse> {
    const res = await fetch(`${this.apiUrl}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentIds, message }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? 'فشل الإرسال');
    }

    return res.json();
  }
}
