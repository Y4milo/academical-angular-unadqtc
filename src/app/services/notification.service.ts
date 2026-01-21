import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import {ApiData} from '../models/api/api-data.model';
import {HttpErrorResponse} from '@angular/common/http';

/**
 * Servicio para mostrar notificaciones tipo "toast" en toda la aplicación.
 * Utiliza PrimeNG MessageService para emitir mensajes flotantes.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {

  constructor(private messageService: MessageService) {}

  notifyApiData(responseData: HttpErrorResponse | ApiData<any>, life: number = 3000): void {
    let apiData: ApiData<any> | null;

    if (responseData instanceof HttpErrorResponse) {
      // Si el backend devuelve ApiData en el cuerpo del error
      apiData = responseData.error as ApiData<any>;
    } else {
      apiData = responseData;
    }

    // Seguridad: si por alguna razón no hay payload, no procesamos
    if (!apiData || !apiData.payload) {
      this.error(
        'Servicio Temporalmente Interrumpido',
        'No pudimos completar tu solicitud. Por favor, repórtalo a la OTI para ayudarte.'
      );
      console.error('Respuesta del servidor', responseData);
      return
    }

    const status = apiData.status;

    // Mapeo de estados de ApiData a severidades de PrimeNG
    const severityMap: Record<string, 'success' | 'info' | 'warn' | 'error'> = {
      'success': 'success',
      'info': 'info',
      'warning': 'warn',
      'warn': 'warn',
      'error': 'error',
      'exception': 'error'
    };

    const severity = severityMap[status] || 'info';

    this.messageService.add({
      severity,
      summary: apiData.payload.title,
      detail: apiData.payload.message,
      life
    });
  }

  /**
   * Muestra una notificación de exito.
   * @param title Título del mensaje (ej. "Error").
   * @param message Detalle del mensaje (ej. "Credenciales inválidas.").
   * @param life Tiempo de duración del mensaje en milisegundos (por defecto: 5000ms).
   */
  success(title: string, message: string, life: number = 3000): void {
    this.messageService.add({ severity: 'success', summary: title, detail: message, life });
  }

  /**
   * Muestra una notificación de error.
   * @param title Título del mensaje (ej. "Error").
   * @param message Detalle del mensaje (ej. "Credenciales inválidas.").
   * @param life Tiempo de duración del mensaje en milisegundos (por defecto: 5000ms).
   */
  error(title: string, message: string, life: number = 5000): void {
    this.messageService.add({ severity: 'error', summary: title, detail: message, life });
  }

  /**
   * Muestra una notificación de advertencia.
   * @param title Título del mensaje (ej. "Advertencia").
   * @param message Detalle del mensaje (ej. "Campos obligatorios no llenados.").
   * @param life Tiempo de duración del mensaje en milisegundos (por defecto: 4000ms).
   */
  warning(title: string, message: string, life: number = 4000): void {
    this.messageService.add({severity: 'warn', summary: title, detail: message, life});
  }

  /**
   * Muestra una notificación informativa.
   * @param title Título del mensaje (ej. "Información").
   * @param message Detalle del mensaje (ej. "Sesión iniciada correctamente.").
   * @param life Tiempo de duración del mensaje en milisegundos (por defecto: 3000ms).
   */
  info(title: string, message: string, life: number = 3000): void {
    this.messageService.add({severity: 'info', summary: title, detail: message, life});
  }
}
