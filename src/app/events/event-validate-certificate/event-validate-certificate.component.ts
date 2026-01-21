import {Component, OnInit} from '@angular/core';
import {Button} from "primeng/button";
import {Card} from "primeng/card";
import {DataView} from "primeng/dataview";
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {Tag} from "primeng/tag";
import {TooltipModule} from "primeng/tooltip";
import {NgClass} from '@angular/common';
import {Event} from '../../models/events/event';
import {Dictionary} from '../../models/dictionary.model';
import {environment} from '../../../environments/environment';
import {NotificationService} from '../../services/notification.service';
import {ParticipantService} from '../../services/participant.service';
import {EventService} from '../../services/event.service';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-event-validate-certificate',
    imports: [
      ReactiveFormsModule,
      Card,
      NgClass,
      Button,
      DataView,
      TooltipModule,
      Tag,
    ],
  templateUrl: './event-validate-certificate.component.html',
  styleUrl: './event-validate-certificate.component.css'
})
export class EventValidateCertificateComponent implements OnInit{
  form!: FormGroup;
  url_banner: string = '';
  flag_slug: number = 0;
  full_name = '';
  event_data: { event: Event; participant_type: Dictionary; }[] = [];
  apiUrlPublic = environment.apiUrlPublic;
  participant_color: { [key: string]: string } = {
    'attendee': 'text-yellow-500',
    'speaker': 'text-cyan-500',
    'collaborator': 'text-orange-400',
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
    private eventService: EventService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.initForm();
    // const token = this.route.snapshot.paramMap.get('token')!;
    const token = 'kanchay-2025';
    this.eventService.getEventBasicDataBySlug(token).subscribe({
      next: eventResponse => {
        if (eventResponse.status === 'success') {
          this.flag_slug = 2;
          const event = eventResponse.payload.data as Event;
          this.url_banner = this.apiUrlPublic + '/' + event.url_banner!;
        }
        else {
          this.flag_slug = 1;
        }
      },
      error: (err) => {
        this.notificationService.notifyApiData(err);
        console.log(err);
      }
    });

  }

  private initForm(): void {
    this.form = this.fb.group({
      number: ['', [Validators.required, Validators.maxLength(10)]],
    });
  }

  protected getModeColor(item: string|undefined) {
    return item? this.mode_color[item] : 'bg-green-500';
  }

  protected getParticipantColor(item: string|undefined) {
    const color = item? this.participant_color[item] : 'text-green-500';
    console.log(color);
    return color;
  }
}
