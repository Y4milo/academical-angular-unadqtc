import {Payload} from '../models/api/payload.model';
import {jwtDecode} from 'jwt-decode';
import jwtEncode from 'jwt-encode';
import {environment} from '../../environments/environment';
import {ApiDataEncoded} from '../models/api/api-data-encoded.model';
import {PayloadDecoded} from '../models/api/payload-decoded.model';
import {NotificationService} from '../services/notification.service';
import {MessageService} from 'primeng/api';
import {ApiData} from '../models/api/api-data.model';

/**
 * Intenta decodificar un campo de DataResponse si es un JWT string.
 * Si ya es un objeto/array, lo devuelve tal cual.
 * @param payload Objeto de tipo Array
 * @return FormData devuelve un FormData de la for {payload: jwtEncode(payload)}
 */
export function encodeArray<T>(
  payload: T
): FormData {
  const key = environment.tokenKey;
  let formData = new FormData();
  formData.append('payload', jwtEncode(payload, key));
  return formData;
}


/**
 * Intenta decodificar un campo de ApiDataEncoded si es un JWT string.
 * Si ya es un objeto/array, lo devuelve tal cual.
 * @param apiData
 * @return messageResult
 */
export function decodeApiData<T>(
  apiData: ApiDataEncoded<T>,
): PayloadDecoded<T> {
  const titleResult = 'Error';
  const messageResult = 'No se puede decodificar';

  // Si no existe, devolver null
  if (!apiData.payload) {
    console.warn(`⚠️ El 'payload' está vacío`);
    return { status: 'error', payload: undefined, title: titleResult, message: messageResult };
  }

  // Si el campo indica que está codificado y es string, decodificar
  try {
    const payloadDecoded = jwtDecode<T>(apiData.payload) as Payload<T>;
    return { status: 'error', payload: payloadDecoded, title: '', message: '' };
  } catch (error) {
    console.error(`❌ Error al decodificar el 'payload' como JWT`, error);
    return { status: 'error', payload: undefined, title: titleResult, message: messageResult };
  }
}

export function validatePhotoCardStudent(file: File){
  let requirements = {
    validated: true,
    invalid: [] as { title: string; message: string }[],
    reader: null as FileReader | null,
    e: null as any | null
  };

  // Validate size
  const maxSize = 50 * 1024; // 50KB
  const minSize = 4 * 1024;  // 4KB
  if (file.size > maxSize || file.size < minSize) {
    requirements.invalid.push({
      title: 'Tamaño inválido',
      message: 'La imagen debe pesar entre 4KB y 50KB.'
    });
  }

  // Validate height and width
  const reader = new FileReader();
  reader.onload = (e: any) => {
    requirements.e = e;
    const img = new Image();
    img.src = e.target.result;
    img.onload = () => {
      const width = img.width;
      const height = img.height;
      if (width !== 240 || height !== 288) {
        requirements.invalid.push({
          title: 'Dimensiones incorrectas',
          message: `La imagen debe medir exactamente 240x288 píxeles. Tamaño actual: ${width}x${height}.`
        });
      }
    }
  }
  requirements.reader = reader;

  if (requirements.invalid.length > 0) {
    requirements.validated = false;
  }

  return requirements;
}

/**
 * Intenta mostrar un MessageService.
 * Si ya es un objeto/array, lo devuelve tal cual.
 * @param data Objeto de tipo Payload<T>
 * @param life tiempo de vida de la notificación
 */
export function payloadNotification<T>(
  data: ApiData<T>,
  life: number = 0)
  : void {

  const notification = new NotificationService(new MessageService())
  switch (data.status){
    case "success":
      life?
      notification.success(data.payload.title, data.payload.message, life) :
        notification.error(data.payload.title, data.payload.message);
    break;
    case "warning":
      life?
      notification.warning(data.payload.title, data.payload.message, life) :
        notification.error(data.payload.title, data.payload.message);
      break;
    case "error":
      life?
      notification.error(data.payload.title, data.payload.message, life) :
        notification.error(data.payload.title, data.payload.message);
      break;
    default:
      life?
      notification.info(data.payload.title, data.payload.message, life) :
        notification.error(data.payload.title, data.payload.message);
      break;
  }
}
