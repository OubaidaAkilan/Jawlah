import { Injectable, inject } from '@angular/core';
import { Student, StudentInsert, StudentUpdate } from '../models/student.model';
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
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  async getById(id: string): Promise<Student | null> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async create(student: StudentInsert): Promise<Student> {
    const { data, error } = await this.supabase
      .from(this.table)
      .insert(this.normalizePhones(student))
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, student: StudentUpdate): Promise<Student> {
    const { data, error } = await this.supabase
      .from(this.table)
      .update(this.normalizePhones(student))
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from(this.table).delete().eq('id', id);
    if (error) throw error;
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
