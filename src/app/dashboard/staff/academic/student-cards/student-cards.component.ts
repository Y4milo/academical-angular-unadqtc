import {Component, HostListener, NgZone, OnDestroy, OnInit, ViewChild, inject} from '@angular/core';
import {StudentCard} from '../../../../models/student/student-card.model';
import {AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators} from '@angular/forms';
import {TableModule} from 'primeng/table';
import {StudentCardService} from '../../../../services/student-card.service';
import {NotificationService} from '../../../../services/notification.service';
import {CardModule} from 'primeng/card';
import {TabViewModule} from 'primeng/tabview';
import {ButtonModule} from 'primeng/button';
import {BadgeModule} from 'primeng/badge';
import {TooltipModule} from 'primeng/tooltip';
import {MultiSelect, MultiSelectModule} from 'primeng/multiselect';
import {OverlayPanel, OverlayPanelModule} from 'primeng/overlaypanel';
import {DictionaryService} from '../../../../services/dictionary.service';
import {Dictionary} from '../../../../models/dictionary.model';
import {PopoverModule} from 'primeng/popover';
import {FileUpload, FileUploadModule} from 'primeng/fileupload';
import {ApiData} from '../../../../models/api/api-data.model';
import {STATUS} from '../../../../core/constants/api-status.constants';
import {NOTIFICATION_MESSAGE} from '../../../../core/constants/app-messages.constants';
import {DialogModule} from 'primeng/dialog';
import {CheckboxModule} from 'primeng/checkbox';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {HttpResponse} from '@angular/common/http';
import {StudentFileType} from '../../../../core/constants/api/student-card-api.constants';
import {InputTextModule} from 'primeng/inputtext';
import {Select} from 'primeng/select';
import {CommonModule} from '@angular/common';
import {TagModule} from 'primeng/tag';
import {ImageModule} from 'primeng/image';
import {ToolbarModule} from 'primeng/toolbar';
import {validatePhotoCardStudent} from '../../../../helper/helper.util';
import {StepsModule} from 'primeng/steps';
import {AppLucideIconComponent} from '../../../../core/components/lucide-icon/lucide-icon.component';
import {finalize} from 'rxjs';
import {SkeletonModule} from 'primeng/skeleton';
import {MenuModule, Menu} from 'primeng/menu';
import {PaginatorModule, PaginatorState} from 'primeng/paginator';
import {DrawerModule} from 'primeng/drawer';
import {ProgressBarModule} from 'primeng/progressbar';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';
import {SelectButtonModule} from 'primeng/selectbutton';
import {MessageModule} from 'primeng/message';
import {MenuItem} from 'primeng/api';

@Component({
  selector: 'app-student-cards',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    CardModule,
    TabViewModule,
    ButtonModule,
    BadgeModule,
    TooltipModule,
    MultiSelectModule,
    OverlayPanelModule,
    PopoverModule,
    FileUploadModule,
    DialogModule,
    CheckboxModule,
    InputTextModule,
    Select,
    TagModule,
    SkeletonModule,
    MenuModule,
    PaginatorModule,
    DrawerModule,
    ProgressBarModule,
    IconFieldModule,
    InputIconModule,
    SelectButtonModule,
    MessageModule,
    ImageModule,
    ToolbarModule,
    StepsModule,
    AppLucideIconComponent,
  ],
  templateUrl: './student-cards.component.html',
  styleUrl: './student-cards.component.css'
})
export class StudentCardsComponent implements OnInit, OnDestroy {
  pendingStudents: StudentCard[] = [];
  validatedStudents: StudentCard[] = [];
  unmatchedStudent: StudentCard[] = [];
  flaggedStudents: StudentCard[] = [];
  activeTabIndex = 0;
  fallbackPhotoUrl = 'img/card-img.png';
  photoPreviewUrls: Record<number, string> = {};
  statusStudentCardOptions: Dictionary[] = [];
  statusStudentCardDniOptions: Dictionary[] = [];
  selectedFlags: Dictionary[] = [];
  selectedPhotoFlags: Dictionary[] = [];
  selectedDniFlags: Dictionary[] = [];
  selectedFlaggedCard?: StudentCard;
  showSelectError: boolean = false;
  previewUrl: string = 'img/card-img.png';
  selectedUploadCard!: StudentCard;
  reviewDialogVisible = false;
  reviewStudent?: StudentCard;
  reviewDniObjectUrl?: string;
  reviewDniSafeUrl?: SafeResourceUrl;
  reviewDniIsPdf = false;
  suneduPhotoValidated = false;
  identityConfirmed = false;
  isReviewSubmitting = false;
  uploadingReviewFileType?: StudentFileType;
  editDialogVisible = false;
  editStudent?: StudentCard;
  editStudentForm!: FormGroup;
  isEditSubmitting = false;
  isManualRegistrationEdit = false;
  downloadActionInProgress = false;
  activeDownloadAction?: 'pdf' | 'excel' | 'photos';
  manualRegistrationStep = 0;
  manualRegistrationSteps = [
    {label: 'Datos'},
    {label: 'Foto y DNI'},
  ];
  manualRegistrationPhotoFile?: File;
  manualRegistrationDniFile?: File;
  manualRegistrationPhotoPreviewUrl = 'img/card-img.png';
  manualRegistrationUsesPreviousPhoto = false;
  manualRegistrationDniPreviewUrl?: string;
  manualRegistrationDniSafeUrl?: SafeResourceUrl;
  manualRegistrationDniIsPdf = false;
  manualRegistrationPhotoApproved = false;
  manualRegistrationIdentityConfirmed = false;
  campusOptions: Dictionary[] = [];
  idTypeOptions: Dictionary[] = [];
  genderOptions: Dictionary[] = [];
  semesterOptions: Dictionary[] = [];
  selectedSemesterId?: number;
  isLoadingSemesters = false;
  // ---- Filtros comunes a las cuatro listas
  searchText = '';
  campusFilter: string | null = null;
  fileFilter: 'no-photo' | 'no-dni' | null = null;
  readonly fileFilterOptions = [
    {label: 'Falta foto', value: 'no-photo'},
    {label: 'Falta DNI', value: 'no-dni'},
  ];
  private campusOptionsCache: {key: string; value: string[]} = {key: '', value: []};
  private readonly filterCache = new WeakMap<StudentCard[], {key: string; result: StudentCard[]}>();

  // ---- Paginación de las listas en tarjetas
  private readonly ngZone = inject(NgZone);
  readonly pageSizes = [12, 24, 48];
  readonly validatedPageSizes = [25, 50, 100];
  pages: Record<'pending' | 'flagged' | 'unmatched' | 'validated', {first: number; rows: number}> = {
    pending: {first: 0, rows: 12},
    flagged: {first: 0, rows: 12},
    unmatched: {first: 0, rows: 12},
    validated: {first: 0, rows: 25},
  };

  // ---- Lista de validados: orden, densidad y detalle
  validatedSort: {field: 'name' | 'campus' | 'validated'; order: 1 | -1} = {field: 'name', order: 1};
  readonly validatedSortOptions = [
    {label: 'Apellidos A–Z', value: 'name:1'},
    {label: 'Apellidos Z–A', value: 'name:-1'},
    {label: 'Sede', value: 'campus:1'},
    {label: 'Validación más reciente', value: 'validated:-1'},
    {label: 'Validación más antigua', value: 'validated:1'},
  ];
  readonly densityOptions = [
    {label: 'Cómoda', value: 'comfortable'},
    {label: 'Compacta', value: 'compact'},
  ];
  validatedDensity: 'comfortable' | 'compact' = 'comfortable';
  detailVisible = false;
  detailStudent?: StudentCard;
  isPhone = typeof window !== 'undefined' && window.innerWidth <= 640;
  /** Con poco ancho la lista de validados pasa de tabla a tarjetas (la tabla obligaría a desplazarse de lado). */
  validatedAsCards = typeof window !== 'undefined' && window.innerWidth <= 1150;
  private readonly sortCache = new WeakMap<StudentCard[], {key: string; result: StudentCard[]}>();

  // ---- Menú de acciones por fila
  @ViewChild('rowMenu') private rowMenu?: Menu;
  rowMenuItems: MenuItem[] = [];

  // ---- Cola de revisión: los estudiantes visibles de la lista desde la que se abrió la revisión
  private reviewQueue: StudentCard[] = [];

  /** Cada lista (pendientes, validados, observados, sin registro) carga por separado: mientras tanto se muestran esqueletos. */
  loadingLists = {pending: false, validated: false, flagged: false, unmatched: false};
  private loadingPhotoIds = new Set<number>();
  /** Fotos cuya imagen no cargó: se muestra el recuadro neutro en lugar del texto alternativo. */
  private brokenPhotoIds = new Set<number>();
  private observationsMultiSelectTimer?: ReturnType<typeof setTimeout>;
  constructor(
    private studentCardService: StudentCardService,
    private dictionaryService: DictionaryService,
    private notificationService: NotificationService,
    private sanitizer: DomSanitizer,
    private fb: FormBuilder,
  ) { }

  ngOnInit(): void {
    this.initEditStudentForm();
    this.loadEditFormDictionaries();
    this.loadSemesters();
    this.dictionaryService.listStudentCardFlags().subscribe({
      next: studentCardFlagsData => {
        if (studentCardFlagsData.status === STATUS.success) {
          const flaggedList = studentCardFlagsData.payload!.data;
          this.statusStudentCardOptions = flaggedList.map((item: Dictionary) => ({
            id: item.id,
            value: item.value,
            label: item.label,
          }));
        } else {
          this.notificationService.notifyApiData(studentCardFlagsData)
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
    this.dictionaryService.listStudentCardDniFlags().subscribe({
      next: studentCardDniFlagsData => {
        if (studentCardDniFlagsData.status === STATUS.success) {
          const flaggedList = studentCardDniFlagsData.payload!.data;
          this.statusStudentCardDniOptions = flaggedList.map((item: Dictionary) => ({
            id: item.id,
            value: item.value,
            label: item.label,
          }));
        } else {
          this.notificationService.notifyApiData(studentCardDniFlagsData)
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

  get selectedSemester(): Dictionary | undefined {
    return this.semesterOptions.find(semester => semester.id === this.selectedSemesterId);
  }

  /** Fixed notice while the semester list leaves the screen without a current semester; a toast would vanish in seconds. */
  get semesterNotice(): {severity: 'warn' | 'info'; text: string} | null {
    if (!this.semestersLoaded) {
      return null;
    }

    if (!this.semesterOptions.length) {
      return {severity: 'warn', text: 'No existen semestres. Registre un semestre antes de consultar la gestión de carnés.'};
    }

    if (!this.semesterOptions.some(semester => semester.is_current)) {
      return {
        severity: 'info',
        text: `No existe un semestre vigente. Se muestra ${this.selectedSemester?.label ?? 'el semestre más reciente'} en modo de consulta.`,
      };
    }

    return null;
  }

  get isHistoricalSemester(): boolean {
    return !!this.selectedSemester && !this.selectedSemester.is_current;
  }

  semestersLoaded = false;

  loadSemesters(): void {
    this.isLoadingSemesters = true;
    // Las listas dependen del semestre: mientras este carga también se muestran sus esqueletos.
    this.loadingLists = {pending: true, validated: true, flagged: true, unmatched: true};
    this.dictionaryService.getSemesters()
      .pipe(finalize(() => {
        this.isLoadingSemesters = false;
        // Si no hubo semestre (error o ninguno registrado) no se pidió ninguna lista: se quitan los esqueletos.
        if (!this.selectedSemesterId) {
          this.loadingLists = {pending: false, validated: false, flagged: false, unmatched: false};
        }
      }))
      .subscribe({
        next: response => {
          if (response.status !== STATUS.success) {
            this.notificationService.notifyApiData(response);
            return;
          }

          this.semesterOptions = response.payload.data ?? [];
          this.semestersLoaded = true;
          if (!this.semesterOptions.length) {
            return;
          }

          const storedId = Number(sessionStorage.getItem('student-cards-semester-id'));
          const storedSemester = this.semesterOptions.find(item => item.id === storedId);
          const currentSemester = this.semesterOptions.find(item => item.is_current);
          this.selectedSemesterId = (currentSemester ?? storedSemester ?? this.semesterOptions[0]).id;
          sessionStorage.setItem('student-cards-semester-id', String(this.selectedSemesterId));

          this.loadSemesterLists();
        },
        error: error => this.notificationService.notifyApiData(error),
      });
  }

  onSemesterChange(): void {
    if (!this.selectedSemesterId) {
      return;
    }

    sessionStorage.setItem('student-cards-semester-id', String(this.selectedSemesterId));
    this.loadSemesterLists();
  }

  private loadSemesterLists(): void {
    const semesterId = this.selectedSemesterId;
    if (!semesterId) {
      return;
    }

    this.pendingStudents = [];
    this.unmatchedStudent = [];
    this.validatedStudents = [];
    this.flaggedStudents = [];
    this.activeTabIndex = 0;

    this.loadingLists = {pending: true, validated: true, flagged: true, unmatched: true};

    this.studentCardService.listPendingStudentCards(semesterId).pipe(finalize(() => this.loadingLists.pending = false)).subscribe({
      next: response => {
        if (response.status === STATUS.success) {
          this.pendingStudents = response.payload.data;
          this.loadStudentPhotoPreviews(this.pendingStudents);
          this.selectHistoricalTabWithData();
        } else this.notificationService.notifyApiData(response);
      },
      error: error => this.notificationService.notifyApiData(error),
    });
    this.studentCardService.listUnmatchedStudentCards(semesterId).pipe(finalize(() => this.loadingLists.unmatched = false)).subscribe({
      next: response => {
        if (response.status === STATUS.success) {
          this.unmatchedStudent = response.payload.data;
          this.selectHistoricalTabWithData();
        }
        else this.notificationService.notifyApiData(response);
      },
      error: error => this.notificationService.notifyApiData(error),
    });
    this.studentCardService.listValidatedStudentCards(semesterId).pipe(finalize(() => this.loadingLists.validated = false)).subscribe({
      next: response => {
        if (response.status === STATUS.success) {
          this.validatedStudents = response.payload.data;
          this.loadStudentPhotoPreviews(this.validatedStudents);
          this.selectHistoricalTabWithData();
        } else this.notificationService.notifyApiData(response);
      },
      error: error => this.notificationService.notifyApiData(error),
    });
    this.studentCardService.listFlaggedStudentCards(semesterId).pipe(finalize(() => this.loadingLists.flagged = false)).subscribe({
      next: response => {
        if (response.status === STATUS.success) {
          this.flaggedStudents = response.payload.data;
          this.loadStudentPhotoPreviews(this.flaggedStudents);
          this.selectHistoricalTabWithData();
        } else this.notificationService.notifyApiData(response);
      },
      error: error => this.notificationService.notifyApiData(error),
    });
  }

  private selectHistoricalTabWithData(): void {
    if (!this.isHistoricalSemester) {
      return;
    }

    const firstPopulatedTab = [
      this.pendingStudents,
      this.validatedStudents,
      this.flaggedStudents,
      this.unmatchedStudent,
    ].findIndex(items => items.length > 0);

    if (firstPopulatedTab >= 0) {
      this.activeTabIndex = firstPopulatedTab;
    }
  }

  ngOnDestroy(): void {
    Object.values(this.photoPreviewUrls).forEach(url => URL.revokeObjectURL(url));
    this.photoPreviewUrls = {};
    this.revokeReviewDniUrl();
    this.revokeManualRegistrationPreviews();
    this.clearObservationPanelTimer();
  }

  private initEditStudentForm(): void {
    this.editStudentForm = this.fb.group({
      id_type: [null, Validators.required],
      code: ['', [Validators.required, Validators.maxLength(15), Validators.pattern(/^[0-9]+$/)]],
      number: [{value: '', disabled: true}],
      names: ['', [Validators.required, Validators.maxLength(100)]],
      father_last_name: ['', [Validators.required, Validators.maxLength(100)]],
      mother_last_name: ['', [Validators.required, Validators.maxLength(100)]],
      check_digit: [null, [Validators.required, Validators.min(0), Validators.max(9), Validators.pattern(/^[0-9]$/)]],
      gender: [null, Validators.required],
      email: ['', [Validators.required, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/)]],
      cellphone: ['', [Validators.required, Validators.maxLength(9), Validators.pattern(/^[0-9]+$/)]],
      address: ['', Validators.required],
      campus: [null, Validators.required],
    }, {validators: this.codeMustDifferFromDocumentValidator()});
  }

  get editForm() {
    return this.editStudentForm.controls;
  }

  hasEditCodeDocumentConflict(): boolean {
    return this.editStudentForm.hasError('codeMatchesDocument')
      && (this.editForm['code'].dirty || this.editForm['code'].touched);
  }

  private loadEditFormDictionaries(): void {
    this.dictionaryService.getGenderList().subscribe({
      next: data => {
        if (data.status === STATUS.success) {
          this.genderOptions = data.payload!.data.map(g => ({id: g.id, value: g.value, label: g.label}));
        }
      },
      error: e => console.error(e),
    });

    this.dictionaryService.getCampusList().subscribe({
      next: data => {
        if (data.status === STATUS.success) {
          this.campusOptions = data.payload!.data.map(c => ({id: c.id, value: c.value, label: c.label}));
        }
      },
      error: e => console.error(e),
    });

    this.dictionaryService.getIdTypeList().subscribe({
      next: data => {
        if (data.status === STATUS.success) {
          this.idTypeOptions = data.payload!.data.map(type => ({
            id: type.id,
            value: type.value,
            label: `${type.value} - ${type.label}`,
          }));
        }
      },
      error: e => console.error(e),
    });
  }

  /** La foto se está descargando: se muestra un esqueleto del mismo tamaño en lugar del hueco. */
  isPhotoLoading(student: StudentCard): boolean {
    return !!student?.id && !this.photoPreviewUrls[student.id] && this.loadingPhotoIds.has(student.id);
  }

  /** Hay una foto para mostrar: la descargada o la de un semestre anterior. */
  hasStudentPhoto(student: StudentCard): boolean {
    return !this.brokenPhotoIds.has(student.id) && !!(this.photoPreviewUrls[student.id] ?? student.previous_photo_url);
  }

  getStudentPhotoUrl(student: StudentCard): string {
    return this.photoPreviewUrls[student.id] ?? student.previous_photo_url ?? this.fallbackPhotoUrl;
  }

  onStudentPhotoError(student: StudentCard): void {
    this.brokenPhotoIds.add(student.id);
    this.revokeStudentPhotoPreview(student.id);
  }

  private loadStudentPhotoPreviews(students: StudentCard[]): void {
    students.forEach(student => this.loadStudentPhotoPreview(student));
  }

  private loadStudentPhotoPreview(student: StudentCard): void {
    if (!student?.id || this.photoPreviewUrls[student.id] || this.loadingPhotoIds.has(student.id)) {
      return;
    }

    this.loadingPhotoIds.add(student.id);

    this.studentCardService.downloadAcademicStudentFile(student.id, 'photo').subscribe({
      next: async (response) => {
        const blob = response.body;

        if (!blob || blob.type.includes('json') || blob.type.includes('text')) {
          await this.logBlobError(blob, student.id);
          return;
        }

        this.setStudentPhotoPreview(student.id, URL.createObjectURL(blob));
      },
      error: (e) => {
        this.loadingPhotoIds.delete(student.id);
        console.error(e);
      },
      complete: () => {
        this.loadingPhotoIds.delete(student.id);
      }
    });
  }

  private setStudentPhotoPreview(studentId: number, url: string): void {
    this.revokeStudentPhotoPreview(studentId);
    this.photoPreviewUrls[studentId] = url;
  }

  private revokeStudentPhotoPreview(studentId: number): void {
    const previousUrl = this.photoPreviewUrls[studentId];

    if (previousUrl) {
      URL.revokeObjectURL(previousUrl);
      delete this.photoPreviewUrls[studentId];
    }
  }

  private async logBlobError(blob: Blob | null, studentId: number): Promise<void> {
    if (!blob) {
      console.warn(`Student file ${studentId} was not returned by the API`);
      return;
    }

    try {
      console.warn(`Student file ${studentId} was not returned as a previewable file`, await blob.text());
    } catch (e) {
      console.error(e);
    }
  }


  // ================= Indicadores, filtros y menú de acciones =================

  /** Los indicadores de arriba hacen de pestañas: el orden coincide con el de los paneles del `p-tabView`. */
  get kpiCards(): Array<{index: number; list: 'pending' | 'validated' | 'flagged' | 'unmatched'; label: string; icon: string; tone: string; count: number; hint: string}> {
    return [
      {index: 0, list: 'pending', label: 'Pendientes de validar', icon: 'pi pi-clock', tone: 'info', count: this.pendingStudents.length, hint: 'Requieren su revisión'},
      {index: 1, list: 'validated', label: 'Validados', icon: 'pi pi-check-circle', tone: 'success', count: this.validatedStudents.length, hint: ''},
      {index: 2, list: 'flagged', label: 'Observados', icon: 'pi pi-exclamation-triangle', tone: 'warn', count: this.flaggedStudents.length, hint: 'Esperan corrección'},
      {index: 3, list: 'unmatched', label: 'Sin registro', icon: 'pi pi-user-minus', tone: 'danger', count: this.unmatchedStudent.length, hint: 'No subieron foto ni DNI'},
    ];
  }

  get validatedPercent(): number {
    const total = this.pendingStudents.length + this.validatedStudents.length + this.flaggedStudents.length + this.unmatchedStudent.length;
    return total === 0 ? 0 : Math.round((this.validatedStudents.length / total) * 100);
  }

  /** Las sedes que aparecen en las listas. Se recuerda según el tamaño de las listas para no crear un arreglo nuevo en cada ciclo. */
  get campusFilterOptions(): string[] {
    const key = [this.pendingStudents.length, this.validatedStudents.length, this.flaggedStudents.length, this.unmatchedStudent.length].join('|');

    if (this.campusOptionsCache.key !== key) {
      const labels = [...this.pendingStudents, ...this.validatedStudents, ...this.flaggedStudents, ...this.unmatchedStudent]
        .map(student => this.getCampusLabel(student))
        .filter(label => !!label);
      this.campusOptionsCache = {key, value: Array.from(new Set(labels)).sort((a, b) => a.localeCompare(b))};
    }

    return this.campusOptionsCache.value;
  }

  /** La lista con los filtros (texto, sede y archivos) aplicados. Se recuerda para no crear un arreglo nuevo en cada ciclo de detección. */
  filtered(list: StudentCard[]): StudentCard[] {
    const text = this.searchText.trim().toLowerCase();
    const key = `${list.length}|${text}|${this.campusFilter}|${this.fileFilter}`;
    const cached = this.filterCache.get(list);

    if (cached?.key === key) {
      return cached.result;
    }

    const result = (!text && !this.campusFilter && !this.fileFilter)
      ? list
      : list.filter(student =>
        (!text || [student.fullName, student.code, student.number, student.id_student, student.cellphone].some(value => String(value ?? '').toLowerCase().includes(text)))
        && (!this.campusFilter || this.getCampusLabel(student) === this.campusFilter)
        && (this.fileFilter !== 'no-photo' || !student.photo)
        && (this.fileFilter !== 'no-dni' || !student.dni));

    this.filterCache.set(list, {key, result});
    return result;
  }

  get hasActiveFilters(): boolean {
    return !!this.searchText.trim() || !!this.campusFilter || !!this.fileFilter;
  }

  /** Cualquier cambio de filtro vuelve a la primera página de cada lista. */
  resetPages(): void {
    for (const page of Object.values(this.pages)) {
      page.first = 0;
    }
  }

  clearCardFilters(): void {
    this.searchText = '';
    this.campusFilter = null;
    this.fileFilter = null;
    this.resetPages();
  }

  /** La página que se muestra de una lista (ya con los filtros aplicados). */
  pageOf(key: 'pending' | 'flagged' | 'unmatched' | 'validated', list: StudentCard[]): StudentCard[] {
    const all = key === 'validated' ? this.sortedValidated(this.filtered(list)) : this.filtered(list);
    const page = this.pages[key];
    const first = page.first >= all.length ? 0 : page.first;
    return all.slice(first, first + page.rows);
  }

  /** Los botones del paginador dentro de las pestañas no disparan la detección de cambios por sí solos: se entra a la zona de Angular. */
  pageFirst(key: string): number {
    return this.pages[key as keyof typeof this.pages].first;
  }

  pageRows(key: string): number {
    return this.pages[key as keyof typeof this.pages].rows;
  }

  onPage(key: string, event: PaginatorState): void {
    const page = key as keyof typeof this.pages;

    this.ngZone.run(() => {
      this.pages[page] = {first: event.first ?? 0, rows: event.rows ?? this.pages[page].rows};
    });
  }

  openRowMenu(event: Event, student: StudentCard, kind: 'pending' | 'flagged' | 'validated'): void {
    const items: MenuItem[] = [];

    if (kind !== 'validated') {
      items.push({label: 'Editar datos del estudiante', icon: 'pi pi-pencil', command: () => this.openEditStudentDialog(student)});
    }
    if (kind === 'pending') {
      items.push({label: 'Descargar foto', icon: 'pi pi-download', command: () => this.downloadStudentPhoto(student)});
    }
    if (kind !== 'pending') {
      items.push({label: kind === 'validated' ? 'Volver a pendiente' : 'Excluir estudiante', icon: kind === 'validated' ? 'pi pi-undo' : 'pi pi-times', command: () => this.pendingCardStudent(student, kind)});
    }

    this.rowMenuItems = items;
    this.rowMenu?.toggle(event);
  }


  // ================= Lista de validados =================

  get totalStudents(): number {
    return this.pendingStudents.length + this.validatedStudents.length + this.flaggedStudents.length + this.unmatchedStudent.length;
  }

  get validatedSortKey(): string {
    return `${this.validatedSort.field}:${this.validatedSort.order}`;
  }

  set validatedSortKey(value: string) {
    const [field, order] = value.split(':');
    this.validatedSort = {field: field as 'name' | 'campus' | 'validated', order: order === '-1' ? -1 : 1};
    this.pages.validated.first = 0;
  }

  /** Un clic en el encabezado ordena por esa columna; otro clic invierte el orden. */
  sortValidatedBy(field: 'name' | 'campus' | 'validated'): void {
    const order = this.validatedSort.field === field && this.validatedSort.order === 1 ? -1 : 1;
    this.validatedSort = {field, order};
    this.pages.validated.first = 0;
  }

  ariaSort(field: 'name' | 'campus' | 'validated'): 'ascending' | 'descending' | 'none' {
    if (this.validatedSort.field !== field) {
      return 'none';
    }
    return this.validatedSort.order === 1 ? 'ascending' : 'descending';
  }

  sortIcon(field: 'name' | 'campus' | 'validated'): string {
    if (this.validatedSort.field !== field) {
      return 'pi pi-sort-alt sc-sort-idle';
    }
    return this.validatedSort.order === 1 ? 'pi pi-sort-amount-up-alt' : 'pi pi-sort-amount-down';
  }

  /** La lista de validados ya filtrada, en el orden elegido. Se recuerda para no ordenar en cada ciclo de detección. */
  private sortedValidated(list: StudentCard[]): StudentCard[] {
    const key = `${list.length}|${this.validatedSortKey}|${list[0]?.id}|${list[list.length - 1]?.id}`;
    const cached = this.sortCache.get(list);

    if (cached?.key === key) {
      return cached.result;
    }

    const {field, order} = this.validatedSort;
    const collator = new Intl.Collator('es', {sensitivity: 'base', numeric: true});
    const text = (student: StudentCard): string => field === 'campus' ? this.getCampusLabel(student) : this.surnameFirst(student);
    const result = [...list].sort((a, b) => {
      const primary = field === 'validated'
        ? (a.validated_at ?? '').localeCompare(b.validated_at ?? '')
        : collator.compare(text(a), text(b));
      return (primary || collator.compare(this.surnameFirst(a), this.surnameFirst(b))) * order;
    });

    this.sortCache.set(list, {key, result});
    return result;
  }

  /** «APELLIDO PATERNO MATERNO, NOMBRES»; si faltan los apellidos, el nombre completo tal como viene. */
  surnameFirst(student: StudentCard): string {
    const surnames = [student.father_last_name, student.mother_last_name].filter(Boolean).join(' ').trim();
    return surnames && student.names ? `${surnames}, ${student.names}` : student.fullName;
  }

  /** «2026-05-12» → «12/05/2026». */
  displayDate(value?: string | null): string {
    const [year, month, day] = (value ?? '').split('-');
    return year && month && day ? `${day}/${month}/${year}` : '—';
  }

  openValidatedDetail(student: StudentCard): void {
    this.detailStudent = student;
    this.detailVisible = true;
    this.loadReviewDni(student);
  }

  closeValidatedDetail(): void {
    this.detailVisible = false;
    this.detailStudent = undefined;
    this.revokeReviewDniUrl();
  }

  downloadStudentDni(student: StudentCard): void {
    this.downloadStudentFile(student, 'dni');
  }

  returnToPending(student: StudentCard): void {
    this.pendingCardStudent(student, 'validated');
    this.closeValidatedDetail();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.isPhone = window.innerWidth <= 640;
    this.validatedAsCards = window.innerWidth <= 1150;
  }

  // ================= Navegación de la revisión =================

  get reviewPosition(): number {
    return this.reviewQueue.findIndex(item => item.id === this.reviewStudent?.id) + 1;
  }

  get reviewTotal(): number {
    return this.reviewQueue.length;
  }

  get hasPrevReview(): boolean {
    return this.reviewPosition > 1;
  }

  get hasNextReview(): boolean {
    return this.reviewPosition > 0 && this.reviewPosition < this.reviewQueue.length;
  }

  goToReview(delta: number): void {
    const target = this.reviewQueue[this.reviewPosition - 1 + delta];
    if (target) {
      this.openReviewDialog(target, this.reviewQueue);
    }
  }

  /** Tras validar u observar se pasa al siguiente estudiante de la cola (o al anterior si era el último); si no queda ninguno, se cierra. */
  private advanceReview(done: StudentCard): void {
    const index = this.reviewQueue.findIndex(item => item.id === done.id);
    const remaining = this.reviewQueue.filter(item => item.id !== done.id);
    const next = remaining[index] ?? remaining[index - 1];

    this.reviewQueue = remaining;

    if (next) {
      this.openReviewDialog(next, remaining);
    } else {
      this.closeReviewDialog();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onReviewKeydown(event: KeyboardEvent): void {
    if (!this.reviewDialogVisible || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    const active = document.activeElement;
    const typing = active instanceof HTMLElement && active.matches('input, textarea, select, [contenteditable="true"], .p-multiselect, .p-select');

    if (typing || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) {
      return;
    }

    event.preventDefault();
    this.goToReview(event.key === 'ArrowLeft' ? -1 : 1);
  }

  openReviewDialog(student: StudentCard, queue?: StudentCard[]): void {
    this.reviewQueue = [...(queue ?? this.reviewQueueFor(student))];
    this.reviewStudent = student;
    this.reviewValidationProblems = [];
    this.reviewFileError = '';
    this.reviewDialogVisible = true;
    this.selectedFlags = [];
    this.selectedPhotoFlags = [];
    this.selectedDniFlags = [];
    this.showSelectError = false;
    this.suneduPhotoValidated = student.photo?.status?.value === 'approved';
    this.identityConfirmed = student.dni?.status?.value === 'approved';
    this.loadReviewDni(student);
  }

  /** La cola de la revisión es la lista (con sus filtros) desde la que se abrió: pendientes u observados. */
  private reviewQueueFor(student: StudentCard): StudentCard[] {
    const lists = [this.pendingStudents, this.flaggedStudents];
    const source = lists.find(list => list.some(item => item.id === student.id));
    return source ? this.filtered(source) : [student];
  }

  closeReviewDialog(): void {
    this.reviewDialogVisible = false;
    this.reviewValidationProblems = [];
    this.reviewFileError = '';
    this.reviewStudent = undefined;
    this.reviewQueue = [];
    this.selectedFlags = [];
    this.selectedPhotoFlags = [];
    this.selectedDniFlags = [];
    this.showSelectError = false;
    this.suneduPhotoValidated = false;
    this.identityConfirmed = false;
    this.revokeReviewDniUrl();
  }

  openEditStudentDialog(student: StudentCard): void {
    this.isManualRegistrationEdit = false;
    this.editStudent = student;
    this.editDialogVisible = true;
    this.editStudentForm.reset({
      id_type: student.id_type?.id ?? null,
      code: student.code ?? '',
      number: student.number || student.id_student || '',
      names: student.names || this.getNamePart(student.fullName, 0),
      father_last_name: student.father_last_name || this.getNamePart(student.fullName, 1),
      mother_last_name: student.mother_last_name || this.getNamePart(student.fullName, 2),
      check_digit: student.check_digit ?? null,
      gender: student.gender?.id ?? null,
      email: student.email ?? '',
      cellphone: student.cellphone ?? '',
      address: student.address ?? '',
      campus: student.campus?.id ?? null,
    });
  }

  openManualRegistrationDialog(student: StudentCard): void {
    this.isManualRegistrationEdit = true;
    this.manualRegistrationStep = 0;
    this.manualRegistrationFilesAttempted = false;
    this.editStudent = student;
    this.editDialogVisible = true;
    this.revokeManualRegistrationPreviews();
    this.manualRegistrationPhotoFile = undefined;
    this.manualRegistrationDniFile = undefined;
    this.manualRegistrationPhotoPreviewUrl = student.previous_photo_url ?? 'img/card-img.png';
    this.manualRegistrationUsesPreviousPhoto = !!student.previous_photo_url;
    this.manualRegistrationPhotoApproved = false;
    this.manualRegistrationIdentityConfirmed = false;
    this.editStudentForm.reset({
      id_type: student.id_type?.id ?? null,
      code: student.code ?? '',
      number: student.number || student.id_student || '',
      names: student.names || this.getNamePart(student.fullName, 0),
      father_last_name: student.father_last_name || this.getNamePart(student.fullName, 1),
      mother_last_name: student.mother_last_name || this.getNamePart(student.fullName, 2),
      check_digit: student.check_digit ?? null,
      gender: student.gender?.id ?? null,
      email: student.email ?? '',
      cellphone: student.cellphone ?? '',
      address: student.address ?? '',
      campus: student.campus?.id ?? null,
    });
  }

  closeEditStudentDialog(): void {
    this.editDialogVisible = false;
    this.editStudent = undefined;
    this.isEditSubmitting = false;
    this.isManualRegistrationEdit = false;
    this.manualRegistrationStep = 0;
    this.manualRegistrationFilesAttempted = false;
    this.revokeManualRegistrationPreviews();
    this.manualRegistrationPhotoFile = undefined;
    this.manualRegistrationDniFile = undefined;
    this.manualRegistrationUsesPreviousPhoto = false;
    this.manualRegistrationPhotoApproved = false;
    this.manualRegistrationIdentityConfirmed = false;
    this.editStudentForm.reset();
  }

  saveEditStudent(): void {
    if (!this.editStudent) {
      return;
    }

    if (this.editStudentForm.invalid) {
      Object.values(this.editStudentForm.controls).forEach(control => {
        control.markAsTouched();
        control.updateValueAndValidity();
      });
      return;
    }

    const formValues = this.editStudentForm.getRawValue();
    this.isEditSubmitting = true;

    if (this.isManualRegistrationEdit) {
      this.saveManualRegistration(formValues);
      return;
    }

    this.studentCardService.updateAcademicStudentBasicInfo({
      id: this.editStudent.id,
      id_type: formValues.id_type,
      code: formValues.code,
      names: formValues.names,
      father_last_name: formValues.father_last_name,
      mother_last_name: formValues.mother_last_name,
      check_digit: formValues.check_digit,
      email: formValues.email,
      cellphone: formValues.cellphone,
      address: formValues.address,
      campus: formValues.campus,
      gender: formValues.gender,
    }).subscribe({
      next: data => {
        if (data.status === STATUS.success) {
          this.applyStudentBasicInfoUpdate(this.editStudent!, data.payload.data);
          this.closeEditStudentDialog();
        }
        this.notificationService.notifyApiData(data);
      },
      error: e => {
        this.isEditSubmitting = false;
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      },
      complete: () => {
        this.isEditSubmitting = false;
      }
    });
  }

  private applyStudentBasicInfoUpdate(student: StudentCard, updated: StudentCard): void {
    student.code = updated.code;
    student.number = updated.number;
    student.id_student = updated.number || student.id_student;
    student.fullName = updated.fullName || student.fullName;
    student.names = updated.names ?? student.names;
    student.father_last_name = updated.father_last_name ?? student.father_last_name;
    student.mother_last_name = updated.mother_last_name ?? student.mother_last_name;
    student.campus = updated.campus;
    student.cellphone = updated.cellphone;
    student.email = updated.email;
    student.address = updated.address;
    student.check_digit = updated.check_digit;
    student.id_type = updated.id_type;
    student.gender = updated.gender;
  }

  getCampusLabel(student: StudentCard): string {
    const campus = student.campus as unknown;

    if (typeof campus === 'string') {
      return campus;
    }

    return student.campus?.label ?? 'Sin sede';
  }

  hasMissingCampus(student: StudentCard): boolean {
    return this.getCampusLabel(student).trim().toLowerCase() === 'sin sede';
  }

  isCodeSameAsDocument(student: StudentCard): boolean {
    const code = student.code?.trim();
    const documentNumber = (student.number || student.id_student)?.trim();

    return !!code && !!documentNumber && code === documentNumber;
  }

  private codeMustDifferFromDocumentValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const code = control.get('code')?.value?.toString().trim();
      const documentNumber = control.get('number')?.value?.toString().trim();

      return code && documentNumber && code === documentNumber
        ? {codeMatchesDocument: true}
        : null;
    };
  }

  getFileStatusLabel(student: StudentCard, type: StudentFileType): string {
    if (!student[type]) {
      return 'No existe archivo';
    }

    return student[type]?.status?.label ?? 'Pendiente';
  }

  getFileStatusSeverity(student: StudentCard, type: StudentFileType): 'success' | 'warn' | 'danger' | 'secondary' {
    if (!student[type]) {
      return 'danger';
    }

    switch (student[type]?.status?.value) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'pending':
        return 'warn';
      default:
        return 'secondary';
    }
  }

  getFileStatusIcon(student: StudentCard, type: StudentFileType): string {
    if (!student[type]) {
      return 'pi pi-lock';
    }

    switch (student[type]?.status?.value) {
      case 'approved':
        return 'pi pi-check-circle';
      case 'rejected':
        return 'pi pi-times-circle';
      case 'pending':
        return 'pi pi-clock';
      default:
        return 'pi pi-minus-circle';
    }
  }

  getStudentFileFlags(student: StudentCard, type: StudentFileType): any[] {
    if (type === 'photo') {
      return student.photo_flags ?? student.photo?.flags ?? student.list_flags ?? [];
    }

    return student.dni_flags ?? student.dni?.flags ?? [];
  }

  isManualRegistration(student: StudentCard): boolean {
    return !!student.manual_registration;
  }

  nextManualRegistrationStep(): void {
    if (this.editStudentForm.invalid) {
      Object.values(this.editStudentForm.controls).forEach(control => {
        control.markAsTouched();
        control.updateValueAndValidity();
      });

      return;
    }

    this.manualRegistrationStep = 1;
  }

  /** Files still missing in step 2 of the manual registration; shown under each upload after a failed submit. */
  get manualRegistrationFileProblems(): {photo: string; dni: string} {
    if (!this.manualRegistrationFilesAttempted) {
      return {photo: '', dni: ''};
    }

    return {
      photo: this.manualRegistrationPhotoFile || this.manualRegistrationUsesPreviousPhoto ? '' : 'Suba la foto del carné.',
      dni: this.manualRegistrationDniFile ? '' : 'Suba el DNI.',
    };
  }

  previousManualRegistrationStep(): void {
    this.manualRegistrationStep = 0;
    this.manualRegistrationFilesAttempted = false;
  }

  manualRegistrationFilesAttempted = false;
  reviewValidationProblems: string[] = [];
  reviewFileError = '';

  async onManualRegistrationFileSelect(event: Event, type: StudentFileType): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }

    if (!(await this.isValidReviewFile(file, type))) {
      return;
    }

    if (type === 'photo') {
      this.revokeManualRegistrationPhotoPreview();
      this.manualRegistrationPhotoFile = file;
      this.manualRegistrationUsesPreviousPhoto = false;
      this.manualRegistrationPhotoPreviewUrl = URL.createObjectURL(file);
      return;
    }

    this.revokeManualRegistrationDniPreview();
    this.manualRegistrationDniFile = file;

    const url = URL.createObjectURL(file);
    this.manualRegistrationDniPreviewUrl = url;
    this.manualRegistrationDniIsPdf = file.type === 'application/pdf';
    this.manualRegistrationDniSafeUrl = this.manualRegistrationDniIsPdf
      ? this.sanitizer.bypassSecurityTrustResourceUrl(url)
      : undefined;
  }

  private revokeManualRegistrationPreviews(): void {
    this.revokeManualRegistrationPhotoPreview();
    this.revokeManualRegistrationDniPreview();
  }

  private revokeManualRegistrationPhotoPreview(): void {
    if (this.manualRegistrationPhotoPreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.manualRegistrationPhotoPreviewUrl);
    }

    this.manualRegistrationPhotoPreviewUrl = 'img/card-img.png';
  }

  private revokeManualRegistrationDniPreview(): void {
    if (this.manualRegistrationDniPreviewUrl) {
      URL.revokeObjectURL(this.manualRegistrationDniPreviewUrl);
    }

    this.manualRegistrationDniPreviewUrl = undefined;
    this.manualRegistrationDniSafeUrl = undefined;
    this.manualRegistrationDniIsPdf = false;
  }

  private saveManualRegistration(formValues: any): void {
    if (!this.editStudent) {
      return;
    }

    if ((!this.manualRegistrationPhotoFile && !this.manualRegistrationUsesPreviousPhoto) || !this.manualRegistrationDniFile) {
      this.isEditSubmitting = false;
      this.manualRegistrationFilesAttempted = true;
      return;
    }

    const payload = new FormData();
    payload.append('number', formValues.number);
    payload.append('code', formValues.code);
    payload.append('names', formValues.names);
    payload.append('father_last_name', formValues.father_last_name);
    payload.append('mother_last_name', formValues.mother_last_name);
    payload.append('id_type', formValues.id_type);
    payload.append('check_digit', formValues.check_digit);
    payload.append('gender', formValues.gender);
    payload.append('email', formValues.email);
    payload.append('cellphone', formValues.cellphone);
    payload.append('address', formValues.address);
    payload.append('campus', formValues.campus);
    if (this.manualRegistrationPhotoFile) {
      payload.append('photo', this.manualRegistrationPhotoFile);
    } else if (this.manualRegistrationUsesPreviousPhoto) {
      payload.append('use_previous_photo', '1');
    }
    payload.append('dni', this.manualRegistrationDniFile);
    payload.append('sunedu_photo_validated', this.manualRegistrationPhotoApproved ? '1' : '0');
    payload.append('identity_confirmed', this.manualRegistrationIdentityConfirmed ? '1' : '0');

    this.studentCardService.storeManualRegistration(payload).subscribe({
      next: data => {
        if (data.status === STATUS.success) {
          const registeredStudent = data.payload.data;
          this.unmatchedStudent = this.unmatchedStudent.filter(s =>
            (s.number || s.id_student) !== (this.editStudent!.number || this.editStudent!.id_student)
              && s.code !== this.editStudent!.code
          );

          if (registeredStudent.status?.value === 'validated') {
            this.validatedStudents = [
              registeredStudent,
              ...this.validatedStudents.filter(s => s.id !== registeredStudent.id)
            ];
          } else {
            this.pendingStudents = [
              registeredStudent,
              ...this.pendingStudents.filter(s => s.id !== registeredStudent.id)
            ];
          }

          this.loadStudentPhotoPreview(registeredStudent);
          this.closeEditStudentDialog();
        }

        this.notificationService.notifyApiData(data);
      },
      error: e => {
        this.isEditSubmitting = false;
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      },
      complete: () => {
        this.isEditSubmitting = false;
      }
    });
  }

  onGlobalFilter(table: any, event: Event): void {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  getNamePart(fullName: string | undefined, index: number): string {
    return fullName?.split(' ')?.[index] ?? '';
  }

  canValidateReview(): boolean {
    return !!this.reviewStudent
      && !!this.reviewStudent.photo
      && !!this.reviewStudent.dni
      && this.isReviewFileApproved('photo')
      && this.isReviewFileApproved('dni')
      && !this.isReviewSubmitting;
  }

  getReviewMissingStudentData(student: StudentCard): string[] {
    const missingFields: string[] = [];
    const documentNumber = student.number || student.id_student;

    const requiredFields: Array<[string, unknown]> = [
      ['Tipo de documento', student.id_type?.id],
      ['Codigo', student.code],
      ['Documento', documentNumber],
      ['Nombres', student.names || this.getNamePart(student.fullName, 0)],
      ['Apellido paterno', student.father_last_name || this.getNamePart(student.fullName, 1)],
      ['Apellido materno', student.mother_last_name || this.getNamePart(student.fullName, 2)],
      ['Digito verificador', student.check_digit],
      ['Genero', student.gender?.id],
      ['Correo', student.email],
      ['Celular', student.cellphone],
      ['Direccion', student.address],
      ['Sede', student.campus?.id],
    ];

    requiredFields.forEach(([label, value]) => {
      if (value === null || value === undefined || value.toString().trim() === '') {
        missingFields.push(label);
      }
    });

    if (student.code?.trim() && documentNumber?.trim() && student.code.trim() === documentNumber.trim()) {
      missingFields.push('Codigo diferente al documento');
    }

    if (student.cellphone?.trim() && !/^[0-9]{9}$/.test(student.cellphone.trim())) {
      missingFields.push('Celular de 9 digitos');
    }

    if (student.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(student.email.trim())) {
      missingFields.push('Correo valido');
    }

    const checkDigit = student.check_digit?.toString().trim();
    if (checkDigit && !/^[0-9]$/.test(checkDigit)) {
      missingFields.push('Digito verificador de un digito');
    }

    return missingFields;
  }

  isReviewFileApproved(type: StudentFileType): boolean {
    return this.reviewStudent?.[type]?.status?.value === 'approved';
  }

  onReviewFileApprovalChange(type: StudentFileType, checked: boolean): void {
    const student = this.reviewStudent;
    const file = student?.[type];

    if (!student || !file) {
      this.setReviewApprovalCheckbox(type, false);
      return;
    }

    const previousStatus = file.status;

    this.studentCardService.setStudentFileStatus({
      id: student.id,
      type,
      status: checked ? 'approved' : 'pending'
    }).subscribe({
      next: data => {
        if (data.status === STATUS.success) {
          file.status = data.payload.data.status;
          this.setReviewApprovalCheckbox(type, data.payload.data.status?.value === 'approved');
        } else {
          file.status = previousStatus;
          this.setReviewApprovalCheckbox(type, previousStatus?.value === 'approved');
        }
        this.notificationService.notifyApiData(data);
      },
      error: e => {
        file.status = previousStatus;
        this.setReviewApprovalCheckbox(type, previousStatus?.value === 'approved');
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      }
    });
  }

  private setReviewApprovalCheckbox(type: StudentFileType, checked: boolean): void {
    if (type === 'photo') {
      this.suneduPhotoValidated = checked;
      return;
    }

    this.identityConfirmed = checked;
  }

  confirmReviewValidation(): void {
    const student = this.reviewStudent;

    if (!student) {
      return;
    }


    if (!this.canValidateReview()) {
      return;
    }

    const missingFields = this.getReviewMissingStudentData(student);
    this.reviewValidationProblems = missingFields.length > 0
      ? [`Complete o corrija estos campos: ${missingFields.join(', ')}.`]
      : [];
    if (missingFields.length > 0) {
      return;
    }

    this.isReviewSubmitting = true;

    const payload = new FormData();
    payload.append('id', student.id.toString());

    this.studentCardService.validateStudentCard(payload).subscribe({
      next: (data) => {
        if (data.status === STATUS.success) {
          this.validatedStudents.push(student);
          this.pendingStudents = this.pendingStudents.filter(s => s.id !== student.id);
          this.advanceReview(student);
        }
        this.notificationService.notifyApiData(data);
      },
      error: (e) => {
        this.isReviewSubmitting = false;
        if (e?.message === 'api-flow-stopped') {
          return;
        }

        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      },
      complete: () => {
        this.isReviewSubmitting = false;
      }
    });
  }

  confirmReviewObservation(): void {
    const student = this.reviewStudent;

    if (!student) {
      return;
    }

    if (!student.photo || !student.dni) {
      return;
    }

    if (!this.selectedPhotoFlags?.length && !this.selectedDniFlags?.length) {
      this.showSelectError = true;
      return;
    }

    this.isReviewSubmitting = true;
    const selectedPhotoFlags = [...this.selectedPhotoFlags];
    const selectedDniFlags = [...this.selectedDniFlags];

    this.studentCardService.setFlaggedStudentCard({
      id: student.id,
      photo_flags: this.toStoredFlags(selectedPhotoFlags),
      dni_flags: this.toStoredFlags(selectedDniFlags)
    }).subscribe({
      next: (data) => {
        if (data.status === STATUS.success) {
          student.photo_flags = [...selectedPhotoFlags];
          student.dni_flags = [...selectedDniFlags];
          student.list_flags = [...selectedPhotoFlags];
          if (student.photo) {
            student.photo.flags = [...selectedPhotoFlags];
          }
          if (student.dni) {
            student.dni.flags = [...selectedDniFlags];
          }
          this.pendingStudents = this.pendingStudents.filter(s => s.id !== student.id);
          this.flaggedStudents.push(student);
          this.advanceReview(student);
        }
        this.notificationService.notifyApiData(data);
      },
      error: (e) => {
        this.isReviewSubmitting = false;
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      },
      complete: () => {
        this.isReviewSubmitting = false;
      }
    });
  }

  private toStoredFlags(flags: Dictionary[]): Array<{code: string; name: string}> {
    return flags.map(flag => ({
      code: (flag.value ?? flag.id ?? '').toString(),
      name: flag.label ?? '',
    }));
  }

  private ensureApiSuccess(data: ApiData<any>): void {
    if (data.status === STATUS.success) {
      return;
    }

    this.notificationService.notifyApiData(data);
    throw new Error('api-flow-stopped');
  }

  private loadReviewDni(student: StudentCard): void {
    this.revokeReviewDniUrl();

    this.studentCardService.downloadAcademicStudentFile(student.id, 'dni').subscribe({
      next: async (response) => {
        const blob = response.body;

        if (!blob || blob.type.includes('json') || blob.type.includes('text')) {
          await this.logBlobError(blob, student.id);
          return;
        }

        this.reviewDniObjectUrl = URL.createObjectURL(blob);
        this.reviewDniIsPdf = blob.type.includes('pdf');
        this.reviewDniSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.reviewDniObjectUrl);
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

  private revokeReviewDniUrl(): void {
    if (this.reviewDniObjectUrl) {
      URL.revokeObjectURL(this.reviewDniObjectUrl);
    }

    this.reviewDniObjectUrl = undefined;
    this.reviewDniSafeUrl = undefined;
    this.reviewDniIsPdf = false;
  }

  validateCardStudent(student: StudentCard) {
    const previousStatus = student.status;
    const payload = new FormData();
    payload.append('id', student.id.toString());
    this.studentCardService.validateStudentCard(payload).subscribe({
      next: (data) => {
        if (data.status === STATUS.success) {
          if (student.status) {
            // Si está validado, lo movemos de pendientes a validados
            this.validatedStudents.push(student);
            this.pendingStudents = this.pendingStudents.filter(s => s.id !== student.id);
            const basePath = student.photo_path.split('?')[0]; // elimina query anterior si lo hubiera
            student.photo_path = `${basePath}?v=${Date.now()}`;
          } else {
            // Si se quitó la validación, lo movemos de validados a pendientes
            this.pendingStudents.push(student);
            this.validatedStudents = this.validatedStudents.filter(s => s.id !== student.id);
          }
        } else {
          student.status = previousStatus;
        }
        this.notificationService.notifyApiData(data);
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

  pendingCardStudent(student: StudentCard, list: string) {
    const previousStatus = student.status;
    const payload = new FormData();
    payload.append('id', student.id.toString());
    this.studentCardService.pendingStudentCard(payload).subscribe({
      next: (pending) => {
        if (pending.status === STATUS.success) {
          // Si está validado, lo movemos de pendientes a validados
          this.pendingStudents.push(student);
          if (list === 'validated') {
            this.validatedStudents = this.validatedStudents.filter(s => s.id !== student.id);
          }
          if (list === 'flagged') {
            this.flaggedStudents = this.flaggedStudents.filter(s => s.id !== student.id);
          }
        }  else {
          student.status = previousStatus;
        }
        this.notificationService.notifyApiData(pending);
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


  downloadReviewFile(type: StudentFileType): void {
    if (!this.reviewStudent) {
      return;
    }

    this.downloadStudentFile(this.reviewStudent, type);
  }

  isUploadingReviewFile(type: StudentFileType): boolean {
    return this.uploadingReviewFileType === type;
  }

  async uploadReviewFile(event: Event, type: StudentFileType): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!this.reviewStudent || !file) {
      return;
    }

    if (!(await this.isValidReviewFile(file, type))) {
      return;
    }

    const formData = new FormData();
    formData.append('id', this.reviewStudent.id.toString());
    formData.append(type, file);
    this.uploadingReviewFileType = type;

    this.studentCardService.updateAcademicStudentFile(type, formData).subscribe({
      next: data => {
        if (data.status === STATUS.success) {
          this.applyStudentFileUpdate(this.reviewStudent!, data.payload.data, type);
        }
        this.notificationService.notifyApiData(data);
      },
      error: e => {
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      },
      complete: () => {
        this.uploadingReviewFileType = undefined;
      }
    });
  }

  private async isValidReviewFile(file: File, type: StudentFileType): Promise<boolean> {
    if (type === 'photo') {
      const requirements = await validatePhotoCardStudent(file);

      if (!requirements.validated) {
        this.reviewFileError = `Foto inválida:\n${requirements.invalid.map(err => `• ${err.message}`).join('\n')}`;
        return false;
      }

      this.reviewFileError = '';
      return true;
    }

    const isValidDni = ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)
      || /\.(jpe?g|png|pdf)$/i.test(file.name);

    if (!isValidDni) {
      this.reviewFileError = 'El DNI debe estar en formato JPG, PNG o PDF.';
      return false;
    }

    if (file.size > 20 * 1024 * 1024) {
      this.reviewFileError = 'El DNI no debe superar los 20MB.';
      return false;
    }

    this.reviewFileError = '';
    return true;
  }

  private applyStudentFileUpdate(student: StudentCard, updated: StudentCard, type: StudentFileType): void {
    if (updated.photo_path) {
      student.photo_path = updated.photo_path;
    }

    if (updated.photo_name) {
      student.photo_name = updated.photo_name;
    }

    if (updated.status) {
      student.status = updated.status;
    }

    if (updated[type]) {
      const currentFile = student[type];
      student[type] = {
        ...updated[type],
        status: updated[type]?.status ?? currentFile?.status ?? {value: 'pending', label: 'Pendiente'}
      };
    }

    if (type === 'photo') {
      this.suneduPhotoValidated = false;
      this.revokeStudentPhotoPreview(student.id);
      this.loadStudentPhotoPreview(student);
      return;
    }

    this.identityConfirmed = false;
    this.loadReviewDni(student);
  }

  downloadStudentPhoto(student: StudentCard): void {
    this.downloadStudentFile(student, 'photo');
  }

  private downloadStudentFile(student: StudentCard, type: StudentFileType): void {
    this.studentCardService.downloadAcademicStudentFile(student.id, type).subscribe({
      next: async (response) => {
        const blob = response.body;

        if (!blob) {
          return;
        }

        try {
          // Intentar leerlo como JSON
          const text = await blob.text();
          const parsed = JSON.parse(text);

        } catch {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = this.getDownloadFileName(response, `${type}-${student.id}`);
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

  private getDownloadFileName(response: HttpResponse<Blob>, fallback: string): string {
    const headerFileName = response.headers.get('X-File-Name')
      || this.getContentDispositionFileName(response.headers.get('Content-Disposition'));

    return headerFileName || fallback;
  }

  private getContentDispositionFileName(contentDisposition: string | null): string | null {
    if (!contentDisposition) {
      return null;
    }

    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
      return decodeURIComponent(utf8Match[1].replace(/"/g, ''));
    }

    const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
    return asciiMatch?.[1] ?? null;
  }

  private startDownloadAction(action: 'pdf' | 'excel' | 'photos'): boolean {
    if (this.downloadActionInProgress) {
      return false;
    }

    this.downloadActionInProgress = true;
    this.activeDownloadAction = action;
    return true;
  }

  private finishDownloadAction() {
    this.downloadActionInProgress = false;
    this.activeDownloadAction = undefined;
  }

  downloadStudentCardsPDF() {
    if (!this.startDownloadAction('pdf')) {
      return;
    }

    this.studentCardService.downloadStudentCardsPdf(this.selectedSemesterId!).pipe(
      finalize(() => this.finishDownloadAction())
    ).subscribe({
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
          a.download = 'estudiantes_validados.pdf';
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

  downloadStudentCardsExcel() {
    if (!this.startDownloadAction('excel')) {
      return;
    }

    this.studentCardService.downloadStudentCardsExcel(this.selectedSemesterId!).pipe(
      finalize(() => this.finishDownloadAction())
    ).subscribe({
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
          a.download = 'estudiantes_validados.xlsx';
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

  downloadPhotosZip() {
    if (!this.startDownloadAction('photos')) {
      return;
    }

    this.studentCardService.downloadStudentPhotosZip(this.selectedSemesterId!).pipe(
      finalize(() => this.finishDownloadAction())
    ).subscribe({
      next: async (blob) => {
        try {
          const text = await (blob as Blob).text(); // 👈 le decimos a TS que es Blob
          const parsed = JSON.parse(text) as ApiData<any>;
          // if (isApiResponse<any>(parsed)) {
          //   this.notificationService.notifyApiData(parsed);
          //   console.log(parsed.payload.data);
          // }
        } catch {
          // Si no era JSON, descargarlo
          const url = window.URL.createObjectURL(blob as Blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'fotos_estudiantes_validados.zip';
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

  @ViewChild('overlayObservations') overlayObservations!: OverlayPanel;
  @ViewChild('observationsMultiSelect') observationsMultiSelect!: MultiSelect;

  openObservationPanel(event: Event, student: StudentCard) {
    if (this.selectedFlaggedCard?.id === student.id) {
      return;
    }

    this.clearObservationPanelTimer();
    this.observationsMultiSelect?.hide();
    this.selectedFlags = [];
    this.selectedFlaggedCard = student;
    this.showSelectError = false;
    this.observationsMultiSelectTimer = setTimeout(() => {
      this.overlayObservations.show(event);
      this.observationsMultiSelect.show();
    });
  }

  onCancelObservations(): void {
    this.clearObservationPanelState();
    this.observationsMultiSelect.hide();
    this.overlayObservations.hide();
  }

  clearObservationPanelState(): void {
    this.clearObservationPanelTimer();
    this.selectedFlaggedCard = undefined;
    this.selectedFlags = [];
    this.showSelectError = false;
  }

  private clearObservationPanelTimer(): void {
    if (this.observationsMultiSelectTimer) {
      clearTimeout(this.observationsMultiSelectTimer);
      this.observationsMultiSelectTimer = undefined;
    }
  }

  onObservationSelectionChange(): void {
    if (this.selectedFlags?.length || this.selectedPhotoFlags?.length || this.selectedDniFlags?.length) {
      this.showSelectError = false;
    }
  }

  onConfirmObservations() {
    if (!this.selectedFlags || this.selectedFlags.length === 0) {
      this.showSelectError = true;
      // this.notificationService.warning('Observaciones requeridas', 'Debe seleccionar al menos una observación.')
      return;
    }
    this.showSelectError = false;
    const selectedCard = this.selectedFlaggedCard;
    const selectedFlags = [...this.selectedFlags];

    if (!selectedCard) {
      return;
    }

    const payload = {
      id: selectedCard.id,
      flags: selectedFlags
    };

    this.studentCardService.setFlaggedStudentCard(payload).subscribe({
      next: (data) => {
        if (data.status === STATUS.success) {
          const index = this.pendingStudents.findIndex(s => s.id === selectedCard.id);
          if (index !== -1) {
            const student = this.pendingStudents[index];
            student.list_flags = selectedFlags;
            this.pendingStudents.splice(index, 1);
            this.flaggedStudents.push(student);
          }
          this.notificationService.notifyApiData(data);
        } else {
          this.notificationService.notifyApiData(data);
        }
      }
    });
    this.clearObservationPanelState();
    this.observationsMultiSelect.hide();
    this.overlayObservations.hide();
  }

  @ViewChild('overlayUploadPhoto') overlayUploadPhoto!: OverlayPanel;
  @ViewChild('fileUploader') fileUploader!: FileUpload;

  async onFileSelect(event: any): Promise<void> {
    const selectedFileUpload = this.fileUploader.files[0];

    if (selectedFileUpload && await this.isValidReviewFile(selectedFileUpload, 'photo')) {

      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(selectedFileUpload);
    } else {
      this.fileUploader.clear();
      this.previewUrl = 'img/card-img.png';
    }
  }

  async onConfirmUploadPhoto(): Promise<void> {
    const selectedFileUpload = this.fileUploader.files[0];
    if (!selectedFileUpload) {
      // this.notificationService.warning('Sin foto', 'Por favor, seleccione una foto antes de continuar.');
      return;
    }
    if (!(await this.isValidReviewFile(selectedFileUpload, 'photo'))) {
      return;
    }
    const formData = new FormData();
    formData.append('photo', selectedFileUpload);
    formData.append('id', this.selectedUploadCard.id.toString());
    this.studentCardService.updateStudentPhoto(formData).subscribe({
      next: (studentCardData) => {
        if (studentCardData.status === STATUS.success) {
          const studentCard = studentCardData.payload.data;
          this.applyStudentFileUpdate(this.selectedUploadCard, studentCard, 'photo');
          this.pendingStudents.push(this.selectedUploadCard);
          this.flaggedStudents = this.flaggedStudents.filter(s => s.id !== studentCard.id);
          this.overlayUploadPhoto.hide();
        }
        this.notificationService.notifyApiData(studentCardData);
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

  showOverlay(event: Event, student: StudentCard): void {
    this.previewUrl = 'img/card-img.png';
    this.selectedUploadCard = student;
    this.fileUploader.clear();
    this.overlayUploadPhoto.toggle(event);
  }

  onlyNumbers(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'];

    if (allowedKeys.includes(event.key)) {
      return;
    }

    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onPaste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text') || '';

    if (!/^[0-9]+$/.test(pasted)) {
      event.preventDefault();
    }
  }

  onlyOneDigit(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'];

    if (allowedKeys.includes(event.key)) {
      return;
    }

    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      return;
    }

    const input = event.target as HTMLInputElement;
    if (input.value.length >= 1) {
      event.preventDefault();
    }
  }

  onPasteOneDigit(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text') || '';

    if (!/^[0-9]$/.test(pasted)) {
      event.preventDefault();
    }
  }

  previewFile(student: StudentCard, type: 'photo' | 'dni') {
    const popup = window.open('', '_blank');

    this.studentCardService.downloadAcademicStudentFile(student.id, type).subscribe({
      next: async (response) => {
        const blob = response.body;

        if (!blob || blob.type.includes('json') || blob.type.includes('text')) {
          await this.logBlobError(blob, student.id);
          popup?.close();
          return;
        }

        const url = window.URL.createObjectURL(blob);

        if (popup) {
          popup.location.href = url;
        } else {
          window.open(url, '_blank');
        }

        setTimeout(() => window.URL.revokeObjectURL(url), 60000);
      },
      error: (e) => {
        popup?.close();
        this.notificationService.error(
          NOTIFICATION_MESSAGE.error_connection.title,
          NOTIFICATION_MESSAGE.error_connection.message
        );
        console.error(e);
      }
    });
  }
}
