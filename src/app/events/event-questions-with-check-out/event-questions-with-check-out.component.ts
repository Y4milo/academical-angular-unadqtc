import {Component, OnInit} from '@angular/core';
import {ButtonDirective, ButtonIcon, ButtonLabel} from 'primeng/button';
import {Card} from 'primeng/card';
import {InputText} from 'primeng/inputtext';
import {CommonModule, KeyValuePipe} from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {AttendanceService} from '../../services/attendance.service';
import {StepsModule} from 'primeng/steps';
import {EventQuestion, QuestionOption, UserAnswer} from '../../models/events/event-question.model';
import {CheckboxModule} from 'primeng/checkbox';
import {ActivatedRoute} from '@angular/router';
import {RadioButtonModule} from 'primeng/radiobutton';
import {NotificationService} from '../../services/notification.service';
import {EventQuestionAnswerService} from '../../services/event-question-answer.service';

@Component({
  selector: 'app-event-questions-with-check-out',
  imports: [
    CommonModule,
    ButtonDirective,
    ReactiveFormsModule,
    Card,
    InputText,
    StepsModule,
    ReactiveFormsModule,
    FormsModule,
    CheckboxModule,
    ButtonIcon,
    RadioButtonModule,
  ],
  templateUrl: './event-questions-with-check-out.component.html',
  styleUrl: './event-questions-with-check-out.component.css'
})
export class EventQuestionsWithCheckOutComponent implements OnInit {

  steps = [
    {label: 'Buscar DNI'},
    {label: 'Preguntas de salida'}
  ];
  stepForm!: FormGroup;
  activeStep = 0;
  id_person: number = 0;
  errorMessage: string = '';
  eventDateId!: number;
  showNumberError = false;
  // En tu componente TypeScript
  answersList: {
    questionId: number;
    answer: string | string[]; // texto o lista de opciones seleccionadas
  }[] = [];

  hasValidationError: boolean = false;


  questions!: EventQuestion[];

  constructor(
    private attendanceService: AttendanceService,
    private eventQuestionAnswerService: EventQuestionAnswerService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    // Crear el FormGroup
    this.stepForm = this.fb.group({
      number: ['', Validators.required], // tu campo "number"
    });
    this.eventDateId = Number(this.route.snapshot.paramMap.get('id'));
    // Inicializar el formulario
    this.stepForm = this.fb.group({
      number: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]]
    });

    // Escuchar cambios para ocultar el error si el usuario escribe algo
    this.stepForm.get('number')?.valueChanges.subscribe(() => {
      const control = this.stepForm.get('number');

      // Si el campo tiene algún valor, ocultar el mensaje
      if (control?.value && control.value.length > 0) {
        this.showNumberError = false;
        this.errorMessage = '';
      }
    });
  }

  // Método para validar
  validateNumber(): void {
    const control = this.stepForm.get('number');
    this.showNumberError = !!(control?.invalid && control?.touched);

    if (control?.hasError('required')) {
      this.errorMessage = 'El número de documento es obligatorio.';
    } else if (control?.hasError('pattern')) {
      this.errorMessage = 'Debe ingresar un número de 8 dígitos.';
    } else {
      this.errorMessage = '';
    }
  }

  searchParticipant() {
    this.stepForm.markAllAsTouched();
    this.validateNumber();
    if (this.stepForm.invalid) return;

    const formData = new FormData();
    formData.append("number", this.stepForm.get('number')?.value);
    formData.append("event_date_id", this.eventDateId.toString());
    this.eventQuestionAnswerService.confirmParticipant(formData).subscribe({
      next: (particpantData) => {
        if (particpantData.status === "success") {
          this.showNumberError = false;
          const formData = new FormData();
          formData.append('id_event_date', this.route.snapshot.paramMap.get('id')!.toString())
          // formData.append('id_person', particpantData.payload.data)
          this.eventQuestionAnswerService.listQuestionsByEventDate(formData).subscribe({
            next: (res) => {
              if (res.status === "success") {
                this.activeStep = 1;
                this.questions = res.payload.data;
              }
              else {
                this.notificationService.notifyApiData(res);
              }
            }
          });
        }
        else {
          this.showNumberError = true;
          this.errorMessage = "Numero (ID) no registrado al evento"
        }
      }
    })
  }



  // 📝 Actualiza respuesta de texto libre
  updateOpenEndedAnswer(question: EventQuestion): void {
    question.invalid = false; // ✅ Elimina la señal visual al escribir

    const index = this.answersList.findIndex(a => a.questionId === question.id);
    const entry: UserAnswer = {
      questionId: question.id,
      answer: question.answer || ''
    };

    if (index > -1) {
      this.answersList[index] = entry;
    } else {
      this.answersList.push(entry);
    }
  }

  // ✅ Actualiza selección múltiple
  handleCheckboxChange(question: EventQuestion): void {
    const selectedOptions = question.question_schema.options
      .filter((opt: QuestionOption) => opt.selected)
      .map((opt: QuestionOption) => opt.text);

    question.invalid = selectedOptions.length === 0; // ✅ Elimina señal si hay selección

    const index = this.answersList.findIndex(a => a.questionId === question.id);
    const entry: UserAnswer = {
      questionId: question.id,
      answer: selectedOptions
    };

    if (index > -1) {
      if (selectedOptions.length === 0) {
        this.answersList.splice(index, 1);
      } else {
        this.answersList[index] = entry;
      }
    } else {
      this.answersList.push(entry);
    }
  }



  // 🔘 Actualiza selección única
  handleRadioChange(question: EventQuestion): void {
    question.invalid = false; // ✅ Elimina la señal visual al seleccionar

    const index = this.answersList.findIndex(a => a.questionId === question.id);
    const entry: UserAnswer = {
      questionId: question.id,
      answer: question.answer || ''
    };

    if (index > -1) {
      this.answersList[index] = entry;
    } else {
      this.answersList.push(entry);
    }

    question.question_schema.options.forEach(opt => {
      opt.selected = opt.text === question.answer;
    });
  }


  submitAnswers(): void {
    let hasUnanswered = false;

    this.questions.forEach(q => {
      if (q.question_schema.open_ended) {
        q.invalid = !q.answer || q.answer.trim() === '';
      } else if (q.question_schema.multiple_choice) {
        q.invalid = !q.question_schema.options.some(opt => opt.selected);
      } else {
        q.invalid = !q.answer || q.answer.trim() === '';
      }

      if (q.invalid) {
        hasUnanswered = true;
      }
    });

    if (hasUnanswered) {
      this.hasValidationError = true;
      this.notificationService.warning('⚠️ Advertencia', 'Hay preguntas sin responder.');
      return;
    }

    this.hasValidationError = false;
    console.log('✅ Todas las respuestas:', this.answersList);
  }
}
