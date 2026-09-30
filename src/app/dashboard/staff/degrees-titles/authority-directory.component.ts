import {Component, EventEmitter, Input, Output} from '@angular/core';
import {DatePipe, NgFor, NgIf} from '@angular/common';
import {Avatar} from 'primeng/avatar';
import {ButtonModule} from 'primeng/button';
import {StatusTagComponent} from '../../../core/components/status-tag.component';
import {DegreeGeneralAuthority, DegreeGeneralAuthorityRoleKey} from '../../../services/degrees-titles.service';
import {changeActionLabel, designateActionLabel, displayName, initials, maskDni, roleTitle} from './degree-general-data.util';

@Component({
  selector: 'app-authority-directory',
  imports: [Avatar, ButtonModule, DatePipe, NgFor, NgIf, StatusTagComponent],
  templateUrl: './authority-directory.component.html',
  styleUrl: './degree-general-data.shared.css',
})
export class AuthorityDirectoryComponent {
  @Input() roles: {role_key: DegreeGeneralAuthorityRoleKey; current: DegreeGeneralAuthority | null}[] = [];
  @Output() manage = new EventEmitter<DegreeGeneralAuthorityRoleKey>();

  readonly roleTitle = roleTitle;
  readonly changeActionLabel = changeActionLabel;
  readonly designateActionLabel = designateActionLabel;
  readonly displayName = displayName;
  readonly initials = initials;
  readonly maskDni = maskDni;
}
