import {Component, OnInit} from '@angular/core';
import {Button, ButtonDirective} from 'primeng/button';
import {InputText} from 'primeng/inputtext';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {NotificationService} from '../../services/notification.service';
import {ParticipantService} from '../../services/participant.service';
import {Event} from '../../models/events/event';
import {environment} from '../../../environments/environment';
import {Card} from 'primeng/card';
import { Tag } from 'primeng/tag';
import {NgClass} from '@angular/common';
import {DataView} from 'primeng/dataview';
import {Dictionary} from '../../models/dictionary.model';
import {TooltipModule} from 'primeng/tooltip';

@Component({
  selector: 'app-event-download-certificate',
  imports: [
    ButtonDirective,
    InputText,
    ReactiveFormsModule,
    Card,
    NgClass,
    Button,
    DataView,
    TooltipModule,
    Tag,
  ],
  templateUrl: './event-download-certificate.component.html',
  styleUrl: './event-download-certificate.component.css'
})
export class EventDownloadCertificateComponent implements OnInit{
  form!: FormGroup;
  full_name = '';
  event_data: { event: Event; participant_type: Dictionary; }[] = [];
  loading = false;
  apiUrlPublic = environment.apiUrlPublic;
  participant_color: { [key: string]: string } = {
    'attendee': 'text-attendee',
    'speaker': 'text-speaker',
    'collaborator': 'text-collaborator',
  };

  mode_color: { [key: string]: string } = {
    'onsite': 'bg-orange-400',
    'virtual': 'bg-cyan-500',
    'hybrid': 'bg-indigo-500',
  };

  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private participantService: ParticipantService,
    ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      number: ['', [Validators.required, Validators.maxLength(10)]],
    });
  }

  onSubmit(): void {
    this.event_data = [];
    if (this.form.invalid) {
      this.notificationService.warning(
        'Campos incompletos',
        'Por favor, complete todos los campos obligatorios.'
      );
      return;
    }

    this.loading = true;
    const { number } = this.form.value;

    this.participantService.getParticipatedEvents(number).subscribe({
      next: dataResponse => {
        const response = dataResponse.payload;
        if (dataResponse.status === 'success') {
          this.event_data = response.data.events;
          this.full_name = response.data.person.full_name;
        }
        this.notificationService.notifyApiData(dataResponse)
      },
      error: (err) => {
        this.notificationService.notifyApiData(err);
      }
    });
  }

  protected downloadCertificate(slug: any) {

  }

  protected getModeColor(item: string|undefined) {
    return item? this.mode_color[item] : 'bg-green-500';
  }

  protected getParticipantColor(item: string|undefined) {
    return item ? this.participant_color[item] : 'text-default';
  }
}
