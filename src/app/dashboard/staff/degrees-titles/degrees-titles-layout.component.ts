import {Component, OnInit} from '@angular/core';
import {StaffRoleLayoutComponent} from '../shared/staff-role-layout/staff-role-layout.component';
import {DegreesTitlesService} from '../../../services/degrees-titles.service';
import {TestModeBannerComponent} from '../../../core/components/test-mode-banner.component';
import {SupportRequestService} from '../../../services/support-request.service';

@Component({
  selector: 'app-degrees-titles-layout',
  imports: [StaffRoleLayoutComponent, TestModeBannerComponent],
  template: `<app-staff-role-layout><app-test-mode-banner layout-banner [hidden]="!testMode" area="Grados y Títulos" [recipient]="testRecipient"></app-test-mode-banner></app-staff-role-layout>`,
})
export class DegreesTitlesLayoutComponent implements OnInit {
  testMode = false;
  testRecipient: string | null = null;
  constructor(private service: DegreesTitlesService, private supportService: SupportRequestService) {}
  ngOnInit(): void {
    this.supportService.configuration().subscribe({next: response => {
      this.testMode = response.payload.data.test_mode;
    }});
    this.service.getRecordCatalogs().subscribe({next: response => {
      this.testMode = response.data.mail_delivery.test_mode;
      this.testRecipient = response.data.mail_delivery.test_recipient;
    }});
  }
}
