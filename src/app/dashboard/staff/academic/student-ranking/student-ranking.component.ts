import {Component, OnInit} from '@angular/core';
import {ButtonDirective} from 'primeng/button';
import {Card} from 'primeng/card';
import {LucideAngularModule} from 'lucide-angular';
import {TableModule} from 'primeng/table';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {InputText} from 'primeng/inputtext';
import {StudentRaking} from '../../../../models/student-ranking.model';
import {StudentService} from '../../../../services/student.service';
import {NotificationService} from '../../../../services/notification.service';
import {DictionaryService} from '../../../../services/dictionary.service';
import {Dictionary} from '../../../../models/dictionary.model';
import {DropdownModule} from 'primeng/dropdown';

@Component({
  selector: 'app-student-ranking',
  imports: [
    ButtonDirective,
    Card,
    LucideAngularModule,
    TableModule,
    FormsModule,
    InputText,
    DropdownModule,
    ReactiveFormsModule,
  ],
  templateUrl: './student-ranking.component.html',
  styleUrl: './student-ranking.component.css'
})
export class StudentRankingComponent implements OnInit {
  student_code: string = "";
  topStudentRankingOptions: Dictionary[] = [];
  show_ranking: boolean = false;
  student!: StudentRaking;
  reportForm!: FormGroup;

  constructor(
    private dictionaryService: DictionaryService,
    private studentService: StudentService,
    private notificationService: NotificationService,
    private fb: FormBuilder,
  ) {}
  ngOnInit() {
    this.reportForm = this.fb.group({
      student: [null, Validators.required],
      top_student_ranking: [null, Validators.required],
    });
    // Cargar régimen laboral
    this.dictionaryService.getTopStudentRanking().subscribe({
      next: list => {
        if (list.status === 'success') {
          this.topStudentRankingOptions = list.payload.data.map((item: Dictionary) => ({
            id: item.id,
            value: item.value,
            label: item.label
          }));
        } else {
          this.notificationService.notifyApiData(list);
        }
      }
    });
  }


  loadRanking() {
    if (this.reportForm.invalid) {
      this.notificationService.warning(
        'Formulario incompleto',
        'Debe seleccionar todos los campos.'
      );
      this.reportForm.markAllAsTouched();
      return;
    }
    const formValues = this.reportForm.value;

    // const formData = new FormData();
    // formData.append('student', formValues.student);
    // formData.append('ranking', formValues.top_student_ranking);
    const formData = {
      'student': formValues.student,
      'ranking': formValues.top_student_ranking
    };

    this.studentService.getStudentRanking(formData).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.show_ranking = true;
          this.student = res.payload.data;
        } else {
          this.notificationService.notifyApiData(res);
        }
      },
      error: (error) => {
        console.log(error);
        this.notificationService.error('Error', 'Ocurrió un problema al cargar los registros.');
      },
    });
  }
}
