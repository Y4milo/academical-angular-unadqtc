/**
 * Revisión previa de la foto del carné con los criterios de la SUNEDU (https://siucarne.sunedu.gob.pe/carne/validacion), hecha en el dispositivo del
 * estudiante: nada se envía hasta que guarde. Avisa, no bloquea. Los criterios de archivo y fondo se miden aquí y el servidor los vuelve a medir;
 * los de rostro (ojos, boca, pose) los mide MediaPipe en `PhotoFaceService`.
 */

export interface PhotoReviewThresholds {
  ppi: number;
  bg_min: number;
  bg_max: number;
  eye_left_x_min: number; eye_left_x_max: number; eye_left_y_min: number; eye_left_y_max: number;
  eye_right_x_min: number; eye_right_x_max: number; eye_right_y_min: number; eye_right_y_max: number;
  mouth_x_min: number; mouth_x_max: number; mouth_y_min: number; mouth_y_max: number;
  yaw_max: number; pitch_max: number; roll_max: number;
}

/** Valores de la SUNEDU (rostro sobre la imagen de 240 x 288) y límites de pose; el semestre puede cambiarlos. */
export const DEFAULT_REVIEW_THRESHOLDS: PhotoReviewThresholds = {
  ppi: 300, bg_min: 220, bg_max: 255,
  eye_left_x_min: 24, eye_left_x_max: 120, eye_left_y_min: 55, eye_left_y_max: 180,
  eye_right_x_min: 80, eye_right_x_max: 185, eye_right_y_min: 50, eye_right_y_max: 180,
  mouth_x_min: 50, mouth_x_max: 161, mouth_y_min: 70, mouth_y_max: 252,
  yaw_max: 15, pitch_max: 12, roll_max: 10,
};

export type ReviewGroup = 'file' | 'background' | 'face' | 'pose';

export interface ReviewCheck {
  key: string;
  group: ReviewGroup;
  label: string;
  value: string;
  ok: boolean;
  /** Medida aproximada (lentes): se muestra como estimación. */
  estimate?: boolean;
}

export interface PhotoReview {
  checks: ReviewCheck[];
  /** Se encontró un rostro y se pudo medir. */
  face: boolean;
}

export const REVIEW_GROUPS: { id: ReviewGroup; title: string }[] = [
  { id: 'file', title: 'Archivo' },
  { id: 'background', title: 'Fondo' },
  { id: 'face', title: 'Rostro (ojos y boca)' },
  { id: 'pose', title: 'Pose y accesorios' },
];

export interface FacePoints {
  faces: number;
  eyeLeft: { x: number; y: number };
  eyeRight: { x: number; y: number };
  mouth: { x: number; y: number };
  yaw: number;
  pitch: number;
  roll: number;
  /** Cuánto más oscura es la zona de los ojos que la de las mejillas (1 = igual). */
  eyeDarkness: number;
}

/** Resolución declarada en el archivo: cabecera JFIF (puntos por pulgada o por centímetro) o, si falta, EXIF. */
export function readResolution(bytes: Uint8Array): number | null {
  if (bytes.length < 18 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return null;
  }

  if (bytes[2] === 0xff && bytes[3] === 0xe0 && bytes[6] === 0x4a && bytes[7] === 0x46 && bytes[8] === 0x49 && bytes[9] === 0x46) {
    const units = bytes[13];
    const x = (bytes[14] << 8) | bytes[15];

    if (units === 1 && x > 0) {
      return x;
    }

    if (units === 2 && x > 0) {
      return Math.round(x * 2.54);
    }
  }

  return readExifResolution(bytes);
}

function readExifResolution(bytes: Uint8Array): number | null {
  let offset = 2;

  while (offset + 4 < bytes.length && bytes[offset] === 0xff) {
    const marker = bytes[offset + 1];
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];

    if (marker === 0xe1 && bytes[offset + 4] === 0x45 && bytes[offset + 5] === 0x78) {
      const view = new DataView(bytes.buffer, bytes.byteOffset + offset + 10, length - 8);
      const little = view.getUint16(0) === 0x4949;
      const ifd = view.getUint32(4, little);
      const count = view.getUint16(ifd, little);
      let unit = 2;
      let value: number | null = null;

      for (let i = 0; i < count; i++) {
        const entry = ifd + 2 + i * 12;
        const tag = view.getUint16(entry, little);

        if (tag === 0x011a) {
          const at = view.getUint32(entry + 8, little);
          const denominator = view.getUint32(at + 4, little);
          value = denominator > 0 ? view.getUint32(at, little) / denominator : null;
        } else if (tag === 0x0128) {
          unit = view.getUint16(entry + 8, little);
        }
      }

      return value === null ? null : Math.round(unit === 3 ? value * 2.54 : value);
    }

    offset += 2 + length;
  }

  return null;
}

/** Color medio del fondo: franja superior de 40 px a los lados (en una foto de carné no hay rostro ni cabello ahí). */
export function measureBackground(bitmap: ImageBitmap): { r: number; g: number; b: number } | null {
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });

  if (!context) {
    return null;
  }

  context.drawImage(bitmap, 0, 0);
  const band = Math.min(40, bitmap.height);
  const edge = Math.floor(bitmap.width * 0.3);
  const sum = [0, 0, 0];
  let count = 0;

  for (const [x0, x1] of [[0, edge], [bitmap.width - edge, bitmap.width]]) {
    const data = context.getImageData(x0, 0, x1 - x0, band).data;

    for (let i = 0; i < data.length; i += 4) {
      sum[0] += data[i];
      sum[1] += data[i + 1];
      sum[2] += data[i + 2];
      count++;
    }
  }

  return count === 0 ? null : { r: Math.round(sum[0] / count), g: Math.round(sum[1] / count), b: Math.round(sum[2] / count) };
}

/** Criterios de archivo y fondo. */
export async function reviewFile(
  file: File,
  bitmap: ImageBitmap,
  rules: { photo_min_kb: number; photo_max_kb: number; photo_width: number; photo_height: number },
  thresholds: PhotoReviewThresholds,
): Promise<ReviewCheck[]> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kb = Math.round((file.size / 1024) * 10) / 10;
  const ppi = readResolution(bytes);
  const checks: ReviewCheck[] = [
    { key: 'size', group: 'file', label: `Tamaño del archivo (${rules.photo_min_kb} a ${rules.photo_max_kb} KB)`, value: `${kb} KB`, ok: kb >= rules.photo_min_kb && kb <= rules.photo_max_kb },
    { key: 'height', group: 'file', label: `Alto (${rules.photo_height} px)`, value: `${bitmap.height} px`, ok: bitmap.height === rules.photo_height },
    { key: 'width', group: 'file', label: `Ancho (${rules.photo_width} px)`, value: `${bitmap.width} px`, ok: bitmap.width === rules.photo_width },
    { key: 'ppi', group: 'file', label: `Resolución (${thresholds.ppi} ppi)`, value: ppi === null ? 'sin dato' : `${ppi} ppi`, ok: ppi === thresholds.ppi },
  ];
  const background = measureBackground(bitmap);

  for (const [channel, name] of [['r', 'rojo'], ['g', 'verde'], ['b', 'azul']] as const) {
    const value = background?.[channel] ?? null;
    checks.push({
      key: `bg_${channel}`,
      group: 'background',
      label: `Fondo ${name} (${thresholds.bg_min} a ${thresholds.bg_max})`,
      value: value === null ? 'sin dato' : String(value),
      ok: value !== null && value >= thresholds.bg_min && value <= thresholds.bg_max,
    });
  }

  return checks;
}

const inRange = (value: number, min: number, max: number): boolean => value >= min && value <= max;
const point = (p: { x: number; y: number }): string => `${Math.round(p.x)} / ${Math.round(p.y)}`;

/** Criterios de rostro y pose a partir de los puntos que midió el detector. Sin puntos: un solo aviso, no seis. */
export function reviewFace(points: FacePoints | null, thresholds: PhotoReviewThresholds): ReviewCheck[] {
  if (points === null || points.faces === 0) {
    return [{ key: 'faces', group: 'face', label: 'Un solo rostro', value: 'no se detectó un rostro', ok: false }];
  }

  const t = thresholds;

  return [
    { key: 'eye_left', group: 'face', label: `Ojo izquierdo X ${t.eye_left_x_min} a ${t.eye_left_x_max}, Y ${t.eye_left_y_min} a ${t.eye_left_y_max}`, value: point(points.eyeLeft),
      ok: inRange(points.eyeLeft.x, t.eye_left_x_min, t.eye_left_x_max) && inRange(points.eyeLeft.y, t.eye_left_y_min, t.eye_left_y_max) },
    { key: 'eye_right', group: 'face', label: `Ojo derecho X ${t.eye_right_x_min} a ${t.eye_right_x_max}, Y ${t.eye_right_y_min} a ${t.eye_right_y_max}`, value: point(points.eyeRight),
      ok: inRange(points.eyeRight.x, t.eye_right_x_min, t.eye_right_x_max) && inRange(points.eyeRight.y, t.eye_right_y_min, t.eye_right_y_max) },
    { key: 'mouth', group: 'face', label: `Boca X ${t.mouth_x_min} a ${t.mouth_x_max}, Y ${t.mouth_y_min} a ${t.mouth_y_max}`, value: point(points.mouth),
      ok: inRange(points.mouth.x, t.mouth_x_min, t.mouth_x_max) && inRange(points.mouth.y, t.mouth_y_min, t.mouth_y_max) },
    { key: 'faces', group: 'pose', label: 'Un solo rostro', value: points.faces === 1 ? '1 rostro' : `${points.faces} rostros`, ok: points.faces === 1 },
    { key: 'yaw', group: 'pose', label: `De frente, sin girar (hasta ${t.yaw_max}°)`, value: `${Math.round(Math.abs(points.yaw))}°`, ok: Math.abs(points.yaw) <= t.yaw_max },
    { key: 'pitch', group: 'pose', label: `Cabeza recta, sin subir ni bajar (hasta ${t.pitch_max}°)`, value: `${Math.round(Math.abs(points.pitch))}°`, ok: Math.abs(points.pitch) <= t.pitch_max },
    { key: 'roll', group: 'pose', label: `Sin inclinar la cabeza (hasta ${t.roll_max}°)`, value: `${Math.round(Math.abs(points.roll))}°`, ok: Math.abs(points.roll) <= t.roll_max },
    { key: 'glasses', group: 'pose', label: 'Sin lentes oscuros (estimado)', value: points.eyeDarkness < GLASSES_DARKNESS ? 'posibles' : 'no se ven', ok: points.eyeDarkness >= GLASSES_DARKNESS, estimate: true },
  ];
}

/** Por debajo de esta relación (ojos / mejillas) los ojos están muy oscuros: probables lentes oscuros. Estimación, no medida exacta. */
export const GLASSES_DARKNESS = 0.45;

export function warningsOf(checks: ReviewCheck[]): number {
  return checks.filter(check => !check.ok).length;
}

/** Lo que se envía al servidor junto con la foto: solo claves, valores simples y si pasó; el servidor lo sanea. */
export function serializeReview(review: PhotoReview): string {
  return JSON.stringify({ face: review.face, checks: review.checks.map(({ key, value, ok }) => ({ key, value, ok })) });
}
