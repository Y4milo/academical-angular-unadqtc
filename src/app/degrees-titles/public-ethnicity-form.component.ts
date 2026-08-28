import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {NgFor, NgIf} from '@angular/common';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {CheckboxModule} from 'primeng/checkbox';
import {RadioButtonModule} from 'primeng/radiobutton';
import {Select} from 'primeng/select';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {MessageModule} from 'primeng/message';
import {TooltipModule} from 'primeng/tooltip';
import {DegreesTitlesService, PublicEthnicityForm} from '../services/degrees-titles.service';
import {STATUS} from '../core/constants/api-status.constants';

@Component({
  selector: 'app-public-ethnicity-form', standalone: true,
  imports: [FormsModule, NgFor, NgIf, ButtonModule, CardModule, CheckboxModule, RadioButtonModule, Select, ProgressSpinnerModule, MessageModule, TooltipModule],
  templateUrl: './public-ethnicity-form.component.html', styleUrl: './public-ethnicity-form.component.css',
})
export class PublicEthnicityFormComponent implements OnInit, OnDestroy {
  @ViewChild('ethnicQuestion') ethnicQuestion?: ElementRef<HTMLElement>;
  @ViewChild('languageQuestion') languageQuestion?: ElementRef<HTMLElement>;
  @ViewChild('declarationQuestion') declarationQuestion?: ElementRef<HTMLElement>;
  @ViewChild('formMessage') formMessage?: ElementRef<HTMLElement>;

  themeMode: 'light' | 'dark' = 'light';
  invalidField: 'ethnic' | 'ethnic-detail' | 'language' | 'language-detail' | 'declaration' | '' = '';
  private readonly deviceTheme = window.matchMedia('(prefers-color-scheme: dark)');
  private readonly deviceThemeChanged = (event: MediaQueryListEvent): void => {
    this.themeMode = event.matches ? 'dark' : 'light';
    this.applyTheme();
  };
  token = '';
  data: PublicEthnicityForm | null = null;
  loading = true;
  saving = false;
  completed = false;
  error = '';
  form = {VAR_ETNICA: '', DET_ETNICO: null as string | null, LENGUA_IND: '', DET_LENGUA: null as string | null, declaration: false};

  constructor(private route: ActivatedRoute, private service: DegreesTitlesService) {}

  ngOnInit(): void {
    this.themeMode = this.deviceTheme.matches ? 'dark' : 'light';
    this.applyTheme();
    this.deviceTheme.addEventListener('change', this.deviceThemeChanged);
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    this.service.getPublicEthnicityForm(this.token).subscribe({
      next: response => { this.data = response.data; this.completed = response.data.submitted; this.loading = false; },
      error: error => { this.loading = false; this.error = error?.error?.message ?? 'El enlace no existe o ya venció.'; },
    });
  }

  toggleTheme(): void {
    this.themeMode = this.themeMode === 'dark' ? 'light' : 'dark';
    this.applyTheme();
  }

  ngOnDestroy(): void {
    this.deviceTheme.removeEventListener('change', this.deviceThemeChanged);
  }

  private applyTheme(): void {
    document.documentElement.classList.toggle('app-dark', this.themeMode === 'dark');
  }

  ethnicChanged(): void {
    if (this.form.VAR_ETNICA !== 'a') this.form.DET_ETNICO = null;
    if (this.invalidField === 'ethnic') this.invalidField = '';
  }
  languageChanged(): void {
    if (this.form.LENGUA_IND !== 'a') this.form.DET_LENGUA = null;
    if (this.invalidField === 'language') this.invalidField = '';
  }

  submit(): void {
    this.error = '';
    this.invalidField = this.firstInvalidField();
    if (this.invalidField) {
      this.error = this.validationMessage(this.invalidField);
      setTimeout(() => this.focusInvalidField());
      return;
    }
    this.saving = true;
    this.service.submitPublicEthnicityForm(this.token, this.form).subscribe({
      next: response => { this.saving = false; if (response.status === STATUS.success) this.completed = true; else this.error = 'No se pudo guardar la información.'; },
      error: error => { this.saving = false; this.error = error?.error?.message ?? 'No se pudo guardar la información.'; },
    });
  }

  private firstInvalidField(): typeof this.invalidField {
    if (!this.form.VAR_ETNICA) return 'ethnic';
    if (this.form.VAR_ETNICA === 'a' && !this.form.DET_ETNICO) return 'ethnic-detail';
    if (!this.form.LENGUA_IND) return 'language';
    if (this.form.LENGUA_IND === 'a' && !this.form.DET_LENGUA) return 'language-detail';
    if (!this.form.declaration) return 'declaration';
    return '';
  }

  private validationMessage(field: typeof this.invalidField): string {
    const messages: Record<Exclude<typeof field, ''>, string> = {
      ethnic: 'Seleccione una opción sobre su pertenencia étnica.',
      'ethnic-detail': 'Seleccione el pueblo indígena u originario correspondiente.',
      language: 'Indique si habla alguna lengua indígena u originaria.',
      'language-detail': 'Seleccione la lengua indígena u originaria correspondiente.',
      declaration: 'Confirme que la información proporcionada es verdadera antes de enviarla.',
    };
    return field ? messages[field] : '';
  }

  private focusInvalidField(): void {
    const target = this.invalidField.startsWith('ethnic')
      ? this.ethnicQuestion?.nativeElement
      : this.invalidField.startsWith('language')
        ? this.languageQuestion?.nativeElement
        : this.declarationQuestion?.nativeElement;
    if (!target) return;
    target.scrollIntoView({behavior: 'smooth', block: 'center'});
    const selector = this.invalidField.endsWith('detail') ? '.p-select' : 'input';
    (target.querySelector<HTMLElement>(selector) ?? target).focus({preventScroll: true});
  }
}
