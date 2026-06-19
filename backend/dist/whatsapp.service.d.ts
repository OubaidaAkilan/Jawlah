import { EventEmitter } from 'events';
export interface SendResult {
    studentId: string;
    nickname: string;
    phone: string;
    status: 'sent' | 'failed';
    error?: string;
}
export declare class WhatsAppService extends EventEmitter {
    private client;
    private ready;
    private qrData;
    private connecting;
    connect(): Promise<void>;
    private reconnect;
    destroy(): Promise<void>;
    isReady(): boolean;
    getQrData(): string | null;
    private sendSingle;
    sendMessages(students: {
        id: string;
        nickname: string;
        phone: string;
        personalizedMessage?: string;
    }[], messageTemplate: string, options?: {
        delayBetween?: number;
        maxRetries?: number;
    }): Promise<SendResult[]>;
}
export declare const whatsappService: WhatsAppService;
