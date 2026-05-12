import {Payload} from '../models/api/payload.model';
import {jwtDecode} from 'jwt-decode';
import jwtEncode from 'jwt-encode';
import {environment} from '../../environments/environment';
import {Dictionary} from '../models/dictionary.model';
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
  apiData: ApiData<T>,
): any {
  const titleResult = 'Error';
  const messageResult = 'No se puede decodificar';

  // Si no existe, devolver null
  if (!apiData.payload) {
    console.warn(`⚠️ El 'payload' está vacío`);
    return { status: 'error', title: titleResult, message: messageResult };
  }

  // Si el campo indica que está codificado y es string, decodificar
  try {
    // const payloadDecoded = jwtDecode<T>(apiData.payload) as Payload<T>;
    return { status: 'error', title: '', message: '' };
  } catch (error) {
    console.error(`❌ Error al decodificar el 'payload' como JWT`, error);
    return { status: 'error', payload: undefined, title: titleResult, message: messageResult };
  }
}

export function validatePhotoCardStudent(file: File): Promise<{
  validated: boolean;
  invalid: { title: string; message: string }[];
}> {

  return new Promise((resolve) => {

    let invalid: { title: string; message: string }[] = [];

    const isJpg = file.type === 'image/jpeg' || /\.(jpe?g)$/i.test(file.name);
    if (!isJpg) {
      invalid.push({
        title: 'Formato invalido',
        message: 'La imagen debe estar en formato JPG.'
      });
    }

    // ✅ VALIDAR TAMAÑO
    const maxSize = 50 * 1024; // 50KB
    const minSize = 4 * 1024;  // 4KB

    if (file.size > maxSize || file.size < minSize) {
      invalid.push({
        title: 'Tamaño inválido',
        message: 'La imagen debe pesar entre 4KB y 50KB.'
      });
    }

    // ✅ VALIDAR DIMENSIONES (ASYNC)
    const reader = new FileReader();

    reader.onload = (e: any) => {
      const img = new Image();
      img.src = e.target.result;

      img.onload = () => {
        const width = img.width;
        const height = img.height;

        if (width !== 240 || height !== 288) {
          invalid.push({
            title: 'Dimensiones incorrectas',
            message: `La imagen debe medir 240x288 px. Actual: ${width}x${height}.`
          });
        }

        resolve({
          validated: invalid.length === 0,
          invalid
        });
      };

      img.onerror = () => {
        invalid.push({
          title: 'Imagen invalida',
          message: 'No se pudo leer la imagen seleccionada.'
        });

        resolve({
          validated: false,
          invalid
        });
      };
    };

    reader.readAsDataURL(file);
  });
}


