import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Student } from '../../../../core/models/student.model';
import { StudentsService } from '../../../../core/services/students.service';
import { StudentCard } from '../../components/student-card/student-card';
import { PROGRAM_FILTER_OPTIONS, ProgramFilter } from '../../utils/program.util';

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
  protected readonly program = signal<ProgramFilter>('all');
  protected readonly searchQuery = signal('');

  protected readonly programOptions = PROGRAM_FILTER_OPTIONS;
  protected readonly filteredStudents = computed(() => {
    let list = this.students();
    const program = this.program();
    const query = this.searchQuery().trim().toLocaleLowerCase();

    if (program === 'summer') {
      list = list.filter((student) => student.is_summer_program);
    } else if (program === 'saturday') {
      list = list.filter((student) => student.is_saturday_program);
    } else if (program === 'unassigned') {
      list = list.filter((student) => student.is_unassigned_program);
    }

    if (!query) {
      return list;
    }

    return list.filter((student) =>
      student.full_name.toLocaleLowerCase().includes(query)
    );
  });

  protected setProgram(value: ProgramFilter): void {
    this.program.set(value);
  }

  protected onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
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
  }
}
