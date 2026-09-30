import {Component, OnInit} from '@angular/core';
import {NgFor, NgIf} from '@angular/common';
import {SkeletonModule} from 'primeng/skeleton';
import {
  DegreeGeneralAuthority,
  DegreeGeneralAuthorityDictionaryRef,
  DegreeGeneralAuthorityRoleKey,
  DegreesTitlesService,
} from '../../../services/degrees-titles.service';
import {NotificationService} from '../../../services/notification.service';
import {AuthorityDirectoryComponent} from './authority-directory.component';
import {AuthorityManagementComponent} from './authority-management.component';

@Component({
  selector: 'app-degree-general-data',
  imports: [AuthorityDirectoryComponent, AuthorityManagementComponent, NgFor, NgIf, SkeletonModule],
  templateUrl: './degree-general-data.component.html',
  styleUrl: './degree-general-data.component.css',
})
export class DegreeGeneralDataComponent implements OnInit {
  roles: {role_key: DegreeGeneralAuthorityRoleKey; current: DegreeGeneralAuthority | null}[] = [];
  professionalPrefixes: DegreeGeneralAuthorityDictionaryRef[] = [];
  loading = false;

  activeRoleKey: DegreeGeneralAuthorityRoleKey | null = null;

  constructor(private readonly service: DegreesTitlesService, private readonly notifications: NotificationService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.service.getGeneralData().subscribe({
      next: response => {
        this.loading = false;
        this.roles = response.data.roles;
        this.professionalPrefixes = response.data.professional_prefixes;
      },
      error: error => {
        this.loading = false;
        this.notifications.notifyApiData(error);
      },
    });
  }

  manage(roleKey: DegreeGeneralAuthorityRoleKey): void {
    this.activeRoleKey = roleKey;
  }

  backToDirectory(): void {
    this.activeRoleKey = null;
    this.load();
  }
}
