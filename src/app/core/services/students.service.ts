import { Injectable, inject } from '@angular/core';
import { CallResponseStatus, Student, StudentInsert, StudentUpdate } from '../models/student.model';
import { normalizeJordanPhone } from '../utils/phone.util';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class StudentsService {
  private readonly supabase = inject(SupabaseService).supabase;
  private readonly table = 'students';

  async getAll(): Promise<Student[]> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('*')
      .eq('is_delete', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map((student) => this.normalizeStudent(student));
  }

  async getById(id: string): Promise<Student | null> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .eq('is_delete', false)
      .maybeSingle();

    if (error) throw error;
    return data ? this.normalizeStudent(data) : null;
  }

  async create(student: StudentInsert): Promise<Student> {
    const { data, error } = await this.supabase
      .from(this.table)
      .insert(this.normalizePhones(student))
      .select()
      .single();

    if (error) throw error;
    return this.normalizeStudent(data);
  }

  async update(id: string, student: StudentUpdate): Promise<Student> {
    const { data, error } = await this.supabase
      .from(this.table)
      .update(this.normalizePhones(student))
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.normalizeStudent(data);
  }

  async updateCallStatus(id: string, status: CallResponseStatus): Promise<Student> {
    const { data, error } = await this.supabase
      .from(this.table)
      .update({ responded_to_call_status: status })
      .eq('id', id)
      .eq('is_delete', false)
      .select()
      .single();

    if (error) throw error;
    return this.normalizeStudent(data);
  }

  async resetAllCallStatus(): Promise<void> {
    const { error } = await this.supabase
      .from(this.table)
      .update({ responded_to_call_status: 'not_contacted' })
      .eq('is_delete', false);

    if (error) throw error;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.table)
      .update({ is_delete: true })
      .eq('id', id);

    if (error) throw error;
  }

  private normalizeStudent(student: Student): Student {
    return {
      ...student,
      responded_to_call_status: student.responded_to_call_status ?? 'not_contacted',
    };
  }

  private normalizePhones<T extends Partial<StudentInsert>>(student: T): T {
    const normalized = { ...student };

    if ('student_phone_number' in normalized) {
      normalized.student_phone_number = normalizeJordanPhone(
        normalized.student_phone_number
      );
    }

    if ('parent_phone_number' in normalized && normalized.parent_phone_number) {
      normalized.parent_phone_number = normalizeJordanPhone(
        normalized.parent_phone_number
      )!;
    }

    return normalized;
  }
}
