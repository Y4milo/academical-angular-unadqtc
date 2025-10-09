import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

/**
 * Servicio para mostrar notificaciones tipo "toast" en toda la aplicación.
 * Utiliza PrimeNG MessageService para emitir mensajes flotantes.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {

  constructor(private messageService: MessageService) {}

  /**
   * Muestra una notificación de éxito.
   * @param title Título del mensaje (ej. "Operación exitosa").
   * @param message Detalle del mensaje (ej. "Los datos fueron guardados.").
   * @param life Tiempo de duración del mensaje en milisegundos (por defecto: 3000ms).
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
    this.messageService.add({ severity: 'warn', summary: title, detail: message, life });
  }

  /**
   * Muestra una notificación informativa.
   * @param title Título del mensaje (ej. "Información").
   * @param message Detalle del mensaje (ej. "Sesión iniciada correctamente.").
   * @param life Tiempo de duración del mensaje en milisegundos (por defecto: 3000ms).
   */
  info(title: string, message: string, life: number = 3000): void {
    this.messageService.add({ severity: 'info', summary: title, detail: message, life });
  }
}
