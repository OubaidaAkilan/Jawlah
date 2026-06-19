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

export interface VerifyLinkResponse {
  valid: boolean;
  student?: {
    full_name: string;
    nickname: string;
    program: string;
  };
  date?: string;
  text?: string;
  currentStatus?: string | null;
  currentAbsenceReason?: string | null;
  error?: string;
}

export interface ConfirmAttendanceRequest {
  studentId: string;
  date: string;
  text: string;
  sig: string;
  status: 'present' | 'absence';
  absenceReason?: string | null;
}

export interface ConfirmAttendanceResponse {
  success: boolean;
  status?: string;
  previousStatus?: string | null;
  absenceReason?: string | null;
  error?: string;
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

  async send(
    studentIds: string[],
    message: string,
    enableConfirmationLink?: boolean,
    date?: string,
    confirmationText?: string
  ): Promise<SendResponse> {
    const res = await fetch(`${this.apiUrl}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentIds,
        message,
        enableConfirmationLink,
        date,
        confirmationText,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? 'فشل الإرسال');
    }

    return res.json();
  }

  async verifyConfirmationLink(
    studentId: string,
    date: string,
    text: string,
    sig: string
  ): Promise<VerifyLinkResponse> {
    const res = await fetch(`${this.apiUrl}/attendance/verify-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, date, text, sig }),
    });

    return res.json();
  }

  async confirmAttendance(
    req: ConfirmAttendanceRequest
  ): Promise<ConfirmAttendanceResponse> {
    const res = await fetch(`${this.apiUrl}/attendance/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });

    return res.json();
  }
}
