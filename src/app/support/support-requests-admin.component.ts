import {CommonModule} from '@angular/common';
import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {DialogModule} from 'primeng/dialog';
import {InputTextModule} from 'primeng/inputtext';
import {MessageModule} from 'primeng/message';
import {Select} from 'primeng/select';
import {TableModule} from 'primeng/table';
import {TagModule} from 'primeng/tag';
import {TextareaModule} from 'primeng/textarea';
import {AdminSupportRequest, SupportRequestService} from '../services/support-request.service';
import {TestModeBannerComponent} from '../core/components/test-mode-banner.component';
import {StepsModule} from 'primeng/steps';
import {MenuItem} from 'primeng/api';

@Component({selector: 'app-support-requests-admin', standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, CardModule, DialogModule, InputTextModule, MessageModule, Select, TableModule, TagModule, TextareaModule, TestModeBannerComponent, StepsModule],
  templateUrl: './support-requests-admin.component.html', styleUrl: './support-requests-admin.component.css'})
export class SupportRequestsAdminComponent implements OnInit {
  requests: AdminSupportRequest[]=[]; selected: AdminSupportRequest|null=null; loading=false; saving=false;
  status=''; search=''; page=1; total=0; perPage=20; nextStatus='processing'; notes='';
  testMode=false; testRecipient:string|null=null;
  reviewStep=0; actionMessage=''; actionError=''; actionErrorStep:number|null=null;
  readonly workflowSteps:MenuItem[]=[{label:'Revisión'},{label:'Correo verificado'},{label:'Decisión'},{label:'Resultado'}];
  statusOptions=[{label:'Todos',value:''},{label:'Revisión manual',value:'manual_review'},{label:'Pendiente de verificación',value:'pending_verification'},
    {label:'Validada automáticamente',value:'automatically_validated'},{label:'Pendiente de aprobación',value:'pending_approval'},
    {label:'Pendiente de información',value:'pending_information'},{label:'Aprobada',value:'approved'},
    {label:'En proceso',value:'processing'},{label:'Resuelta',value:'resolved'},{label:'Rechazada',value:'rejected'},{label:'Cerrada',value:'closed'}];
  constructor(private service:SupportRequestService){}
  ngOnInit(){this.load();}
  get detailVisible(): boolean { return this.selected !== null; }
  set detailVisible(value: boolean) { if (!value) this.selected = null; }
  load(page=1){this.loading=true;this.page=page;this.service.list({status:this.status,search:this.search,page,per_page:this.perPage}).subscribe({
    next:r=>{this.loading=false;this.requests=r.payload.data.data;this.total=r.payload.data.total;this.testMode=!!r.payload.mail_delivery?.test_mode;this.testRecipient=r.payload.mail_delivery?.test_recipient??null;},error:()=>this.loading=false});}
  open(row:AdminSupportRequest){this.service.show(row.ticket_number).subscribe(r=>{this.selected=r.payload.data;this.nextStatus=this.selected.status;this.notes='';this.reviewStep=0;this.actionMessage='';this.actionError='';this.actionErrorStep=null;});}
  save(){if(!this.selected||!this.notes.trim())return;this.saving=true;this.service.update(this.selected.ticket_number,this.nextStatus,this.notes).subscribe({
    next:r=>{this.saving=false;this.actionError='';this.actionErrorStep=null;this.actionMessage=r.payload.message;const finalStatus=r.payload.data.status;this.load(this.page);if(['rejected','closed','resolved'].includes(finalStatus)){this.selected=null;return;}const ticket=this.selected!.ticket_number;this.service.show(ticket).subscribe(x=>{this.selected=x.payload.data;this.nextStatus=this.selected.status;});},error:e=>{this.saving=false;this.actionErrorStep=2;this.actionError=e?.error?.message??e?.error?.payload?.message??'No se pudo guardar la decisión.';}});}
  severity(status:string):'success'|'info'|'warn'|'danger'|'secondary'{if(['resolved','closed','automatically_validated'].includes(status))return 'success';if(status==='manual_review')return 'danger';if(['pending_approval','pending_verification'].includes(status))return 'warn';return 'info';}
  label(status:string){return this.statusOptions.find(x=>x.value===status)?.label||status;}
  requesterLabel(type:string|null|undefined):string {
    const labels:Record<string,string>={student:'Estudiante',professor:'Docente',administrative:'Personal administrativo',unknown:'No determinado',former_member:'Sin vínculo vigente'};
    return type ? (labels[type] ?? type) : 'No determinado';
  }
  requestLabel(type:string):string {
    const labels:Record<string,string>={recover_email:'Recuperar correo institucional',reset_password:'Restablecer contraseña',create_email:'Crear correo institucional',reactivate_email:'Reactivar correo institucional',mfa_problem:'Problema con verificación en dos pasos',other:'Otra solicitud'};
    return labels[type] ?? type;
  }
  checkLabel(check:string):string {
    const labels:Record<string,string>={active_record:'Registro vigente',document_match:'Documento encontrado',personal_contact:'Contacto personal válido para recuperación',registered_contact_match:'Contacto registrado coincidente',student_code_match:'Código estudiantil coincidente',unique_identity:'Identidad única',user_account_found:'Cuenta de Academical encontrada',role_match:'Tipo de personal y rol coincidentes',verified_contact:'Contacto verificado',microsoft_account_enabled:'Cuenta de Microsoft 365 habilitada'};
    return labels[check] ?? check.replaceAll('_',' ');
  }
  contactChannelLabel(channel:'email'|'phone'):string {
    return channel === 'email' ? 'Correo personal' : 'Número de celular';
  }
  executeRecovery():void {
    if(!this.selected)return;this.saving=true;this.actionError='';
    this.service.executeRecovery(this.selected.ticket_number).subscribe({next:r=>{this.saving=false;this.actionMessage=r.payload.message;this.selected=null;this.load(this.page);},error:e=>{this.saving=false;this.actionErrorStep=3;this.actionError=e?.error?.message??e?.error?.payload?.message??'No se pudo ejecutar la recuperación.';}});
  }
}
