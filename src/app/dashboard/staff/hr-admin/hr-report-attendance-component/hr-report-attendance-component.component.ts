import {Component, OnInit} from '@angular/core';
import {DictionaryService} from '../../../../services/dictionary.service';
import {Dictionary} from '../../../../models/dictionary.model';
import {NotificationService} from '../../../../services/notification.service';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {ButtonDirective} from 'primeng/button';
import {AttendanceService} from '../../../../services/attendance.service';
import {STATUS} from '../../../../core/constants/status';
import {NOTIFICATION_MESSAGE} from '../../../../core/constants/notification_message';
import {Select} from 'primeng/select';

@Component({
  selector: 'app-hr-report-attendance-component',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ButtonDirective,
    Select,
  ],
  templateUrl: './hr-report-attendance-component.component.html',
  styleUrl: './hr-report-attendance-component.component.css'
})
export class HrReportAttendanceComponentComponent implements OnInit {
  employmentAgreementOptions: Dictionary[] = [];
  yearOptions: Dictionary[] = [];
  monthOptions: Dictionary[] = [];
  reportForm!: FormGroup;

  allMonths: Dictionary[] = [
    { id: 1, label: 'Enero' },
    { id: 2, label: 'Febrero' },
    { id: 3, label: 'Marzo' },
    { id: 4, label: 'Abril' },
    { id: 5, label: 'Mayo' },
    { id: 6, label: 'Junio' },
    { id: 7, label: 'Julio' },
    { id: 8, label: 'Agosto' },
    { id: 9, label: 'Septiembre' },
    { id: 10, label: 'Octubre' },
    { id: 11, label: 'Noviembre' },
    { id: 12, label: 'Diciembre' },
  ];


  constructor(
    private dictionaryService: DictionaryService,
    private notificationService: NotificationService,
    private attendanceService: AttendanceService,
    private fb: FormBuilder,
  ) {  }


  ngOnInit() {
    // Crear formulario
    this.reportForm = this.fb.group({
      id_employment_agreement: [null, Validators.required],
      id_month: [null, Validators.required],
      id_year: [null, Validators.required],
    });

    // Cargar régimen laboral
    this.dictionaryService.getEmploymentAgreement().subscribe({
      next: list => {
        if (list.status === STATUS.success) {
          this.employmentAgreementOptions = list.payload.data.map((item: Dictionary) => ({
            id: item.id,
            label: item.label
          }));
        } else {
          this.notificationService.notifyApiData(list);
        }
      },
      error: (e) => {
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      }
    });

    // Cargar años
    this.generateYears();

    // Actualizar meses cuando cambie el año
    this.reportForm.get('id_year')?.valueChanges.subscribe(year => {
      this.updateMonthOptions(year);
    });
  }

  get form() {
    return this.reportForm.controls;
  }

  // Genera años desde 2022 hasta el actual
  generateYears() {
    const currentYear = new Date().getFullYear();

    this.yearOptions = Array.from(
      { length: currentYear - 2022 + 1 },
      (_, i) => ({
        id: 2022 + i,
        label: (2022 + i).toString()
      })
    );

    // Seleccionar año actual
    this.reportForm.patchValue({ id_year: currentYear });

    // Generar meses iniciales según el año
    this.updateMonthOptions(currentYear);
  }

  // Actualiza lista de meses según el año elegido
  updateMonthOptions(selectedYear: number) {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    if (selectedYear === currentYear) {
      this.monthOptions = this.allMonths.filter(m => m.id <= currentMonth);
      this.reportForm.patchValue({ id_month: currentMonth }); // asignar mes actual
    } else {
      this.monthOptions = [...this.allMonths];
      this.reportForm.patchValue({ id_month: null }); // resetear
    }
  }

  downloadReportExcel(){
    if (this.reportForm.invalid) {
      this.notificationService.warning(
        'Formulario incompleto',
        'Debe seleccionar todos los campos.'
      );
      this.reportForm.markAllAsTouched();
      return;
    }

    const formValues = this.reportForm.value;

    const formData = new FormData();
    formData.append('id_employment_agreement', formValues.id_employment_agreement);
    formData.append('id_month', formValues.id_month);
    formData.append('id_year', formValues.id_year);

    this.attendanceService.downloadConsolidatedExcel(formData).subscribe({
      next: async (blob) => {
        try {
          const text = await (blob as Blob).text(); // 👈 le decimos a TS que es Blob
          const parsed = JSON.parse(text);
          // if (isApiResponse<any>(parsed)) {
          //   this.notificationService.warning(parsed.response.title, parsed.response.message);
          //   console.log(parsed.response.payload);
          // }
        }
        catch {
          const url = window.URL.createObjectURL(blob as Blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'consolidado_personal.xlsx';
          a.click();
          window.URL.revokeObjectURL(url);
        }
      },
      error: (e) => {
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      }
    });
  }

}
