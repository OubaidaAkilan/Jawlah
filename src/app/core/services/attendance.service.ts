import { Injectable, inject } from '@angular/core';
import {
  Attendance,
  AttendanceFilters,
  AttendanceInsert,
  AttendanceUpdate,
  AttendanceWithStudent,
} from '../models/attendance.model';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private readonly supabase = inject(SupabaseService).supabase;
  private readonly table = 'attendance';

  async getFiltered(filters: AttendanceFilters): Promise<AttendanceWithStudent[]> {
    let query = this.supabase
      .from(this.table)
      .select('*, students!inner(*)')
      .eq('students.is_delete', false)
      .eq('date', filters.date);

    if (filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.program === 'summer') {
      query = query.eq('students.is_summer_program', true);
    } else if (filters.program === 'saturday') {
      query = query.eq('students.is_saturday_program', true);
    } else if (filters.program === 'unassigned') {
      query = query.eq('students.is_unassigned_program', true);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as AttendanceWithStudent[];
  }

  async getByStudent(studentId: string): Promise<Attendance[]> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  async create(record: AttendanceInsert): Promise<Attendance> {
    const { data, error } = await this.supabase
      .from(this.table)
      .insert(this.normalizeRecord(record))
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, record: AttendanceUpdate): Promise<Attendance> {
    const { data, error } = await this.supabase
      .from(this.table)
      .update(this.normalizeRecord(record))
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private normalizeRecord<T extends Partial<AttendanceInsert>>(record: T): T {
    const normalized = { ...record };

    if (normalized.status && normalized.status !== 'absence') {
      normalized.absence_reason = null;
    }

    return normalized;
  }
}
