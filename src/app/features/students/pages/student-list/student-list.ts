import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Student } from '../../../../core/models/student.model';
import { StudentsService } from '../../../../core/services/students.service';
import { StudentCard } from '../../components/student-card/student-card';

@Component({
  selector: 'app-student-list',
  imports: [RouterLink, StudentCard],
  templateUrl: './student-list.html',
  styleUrl: './student-list.scss',
})
export class StudentList implements OnInit {
  private readonly studentsService = inject(StudentsService);

  protected readonly students = signal<Student[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  async ngOnInit(): Promise<void> {
    try {
      const data = await this.studentsService.getAll();
      this.students.set(data);
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
