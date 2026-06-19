import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Student } from '../../../../core/models/student.model';
import { StudentsService } from '../../../../core/services/students.service';
import { MessagingService, SendResult } from '../../../../core/services/messaging.service';
import { StudentAvatar } from '../../components/student-avatar/student-avatar';
import {
  CALL_STATUS_FILTER_OPTIONS,
  CallStatusFilter,
  resolveCallStatus,
} from '../../utils/call-status.util';
import { PROGRAM_FILTER_OPTIONS, ProgramFilter } from '../../utils/program.util';
import { todayDateString } from '../../utils/attendance.util';

@Component({
  selector: 'app-send-message',
  imports: [RouterLink, FormsModule, StudentAvatar],
  templateUrl: './send-message.html',
  styleUrl: './send-message.scss',
})
export class SendMessage implements OnInit, OnDestroy {
  private readonly studentsService = inject(StudentsService);
  private readonly messagingService = inject(MessagingService);

  protected readonly students = signal<Student[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  protected readonly program = signal<ProgramFilter>('all');
  protected readonly callStatus = signal<CallStatusFilter>('all');
  protected readonly searchQuery = signal('');

  protected readonly selectedIds = signal<Set<string>>(new Set());
  protected readonly messageText = signal('');
  protected readonly sending = signal(false);
  protected readonly sendProgress = signal('');
  protected readonly results = signal<SendResult[] | null>(null);
  protected readonly sendError = signal<string | null>(null);

  protected readonly enableConfirmationLink = signal(false);
  protected readonly attendanceDate = signal(todayDateString());
  protected readonly confirmationText = signal('نرجو تأكيد حضورك في البرنامج');

  protected readonly whatsappStatus = signal<'loading' | 'qr' | 'connected' | 'error'>('loading');
  protected readonly qrImage = signal<string | null>(null);
  protected readonly statusMessage = signal('جارٍ الاتصال بخادم واتساب...');
  private pollingTimer: ReturnType<typeof setInterval> | null = null;

  protected readonly programOptions = PROGRAM_FILTER_OPTIONS;
  protected readonly callStatusOptions = CALL_STATUS_FILTER_OPTIONS;
  protected readonly nicknameToken = '{{nickname}}';
  protected readonly confirmationLinkToken = '{{confirmation_link}}';
  protected readonly dateToken = '{{date}}';
  protected readonly textareaPlaceholder = 'مرحباً {{nickname}}، نذكرك بموعد برنامج يوم {{date}}...';

  protected readonly filteredStudents = computed(() => {
    let list = this.students();
    const p = this.program();
    const cs = this.callStatus();
    const q = this.searchQuery().trim().toLocaleLowerCase();

    if (p === 'summer') list = list.filter((s) => s.is_summer_program);
    else if (p === 'saturday') list = list.filter((s) => s.is_saturday_program);
    else if (p === 'unassigned') list = list.filter((s) => s.is_unassigned_program);

    if (cs !== 'all') list = list.filter((s) => resolveCallStatus(s.responded_to_call_status) === cs);

    if (q) list = list.filter((s) => s.full_name.toLocaleLowerCase().includes(q));

    return list;
  });

  protected readonly selectedCount = computed(() => this.selectedIds().size);
  protected readonly filteredCount = computed(() => this.filteredStudents().length);

  protected readonly allSelected = computed(() => {
    const filtered = this.filteredStudents();
    return filtered.length > 0 && filtered.every((s) => this.selectedIds().has(s.id));
  });

  protected readonly previews = computed(() => {
    const msg = this.messageText();
    const date = this.attendanceDate();
    if (!msg) return [];

    return this.filteredStudents()
      .filter((s) => this.selectedIds().has(s.id))
      .map((s) => ({
        name: s.full_name,
        text: msg
          .replace(/\{\{nickname\}\}/g, s.nickname || s.full_name.split(' ')[0])
          .replace(/\{\{date\}\}/g, date)
          .replace(/\{\{confirmation_link\}\}/g, '[رابط التأكيد]'),
      }));
  });

  setProgram(value: ProgramFilter): void {
    this.program.set(value);
  }

  setCallStatus(value: CallStatusFilter): void {
    this.callStatus.set(value);
  }

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  onMessageInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement | null;
    if (target) this.messageText.set(target.value);
  }

  toggleConfirmationLink(): void {
    this.enableConfirmationLink.update((v) => !v);
  }

  onDateInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    if (target) this.attendanceDate.set(target.value);
  }

  onConfirmationTextInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement | null;
    if (target) this.confirmationText.set(target.value);
  }

  toggleStudent(id: string): void {
    this.selectedIds.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  toggleAll(): void {
    this.selectedIds.update((set) => {
      if (this.allSelected()) {
        const next = new Set(set);
        for (const s of this.filteredStudents()) next.delete(s.id);
        return next;
      } else {
        const next = new Set(set);
        for (const s of this.filteredStudents()) next.add(s.id);
        return next;
      }
    });
  }

  async send(): Promise<void> {
    const ids = Array.from(this.selectedIds());
    const msg = this.messageText().trim();

    if (!ids.length || !msg) return;

    this.sending.set(true);
    this.sendProgress.set('جارٍ الإرسال...');
    this.sendError.set(null);
    this.results.set(null);

    try {
      const response = await this.messagingService.send(
        ids,
        msg,
        this.enableConfirmationLink(),
        this.attendanceDate(),
        this.confirmationText()
      );
      this.results.set(response.results);
      this.sendProgress.set(`تم: ${response.sent} رسالة، فشل: ${response.failed}`);
    } catch (err) {
      this.sendError.set(err instanceof Error ? err.message : 'فشل الإرسال');
    } finally {
      this.sending.set(false);
    }
  }

  async ngOnInit(): Promise<void> {
    try {
      const data = await this.studentsService.getAll();
      this.students.set(data);
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
    await this.initWhatsApp();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  async initWhatsApp(): Promise<void> {
    this.whatsappStatus.set('loading');
    this.statusMessage.set('جارٍ الاتصال بخادم واتساب...');
    this.qrImage.set(null);

    try {
      const status = await this.messagingService.checkStatus();

      if (status.ready) {
        this.whatsappStatus.set('connected');
        return;
      }

      if (status.hasQr) {
        const { qr } = await this.messagingService.getQr();
        this.qrImage.set(qr);
        this.whatsappStatus.set('qr');
        this.statusMessage.set('امسح رمز QR باستخدام واتساب');
      }

      this.startPolling();
    } catch {
      this.whatsappStatus.set('error');
      this.statusMessage.set('تعذر الاتصال بالسيرفر. تأكد من تشغيل الخادم.');
    }
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollingTimer = setInterval(async () => {
      try {
        const status = await this.messagingService.checkStatus();
        if (status.ready) {
          this.whatsappStatus.set('connected');
          this.stopPolling();
          return;
        }
        if (status.hasQr && !this.qrImage()) {
          const { qr } = await this.messagingService.getQr();
          this.qrImage.set(qr);
          this.whatsappStatus.set('qr');
        }
      } catch {
        this.whatsappStatus.set('error');
        this.statusMessage.set('فقد الاتصال بالسيرفر');
      }
    }, 3000);
  }

  private stopPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  retryConnection(): void {
    void this.initWhatsApp();
  }
}
