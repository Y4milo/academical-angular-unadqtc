import { Injectable } from '@angular/core';
import type { FaceLandmarker } from '@mediapipe/tasks-vision';
import { FacePoints } from '../core/utils/photo-review.util';

/**
 * Detector de rostro de la revisión previa de la foto (MediaPipe FaceLandmarker, en el dispositivo). El modelo y el motor se alojan en la propia
 * aplicación (`/models`, `/mediapipe/wasm`) y se cargan solo cuando el estudiante elige una foto: nada de la foto sale del dispositivo.
 * Medidas calibradas contra la SUNEDU con una foto validada: iris y labios exteriores quedan a 1 px o menos de los suyos.
 */
@Injectable({ providedIn: 'root' })
export class PhotoFaceService {
  private landmarker: Promise<FaceLandmarker> | null = null;

  /** Puntos del rostro en píxeles de la imagen, o null si no se pudo cargar el detector. */
  async detect(bitmap: ImageBitmap): Promise<FacePoints | null> {
    let landmarker: FaceLandmarker;

    try {
      landmarker = await this.load();
    } catch {
      this.landmarker = null;
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (!context) {
      return null;
    }

    context.drawImage(bitmap, 0, 0);
    const result = landmarker.detect(canvas);

    if (result.faceLandmarks.length === 0) {
      return { faces: 0, eyeLeft: { x: 0, y: 0 }, eyeRight: { x: 0, y: 0 }, mouth: { x: 0, y: 0 }, yaw: 0, pitch: 0, roll: 0, eyeDarkness: 1 };
    }

    const landmarks = result.faceLandmarks[0];
    const at = (index: number) => ({ x: landmarks[index].x * bitmap.width, y: landmarks[index].y * bitmap.height });

    // Centros de los iris (468 y 473), el de menor X es el de la izquierda de la imagen; boca = centro de los labios exteriores (0 y 17).
    const irises = [at(468), at(473)].sort((a, b) => a.x - b.x);
    const mouth = { x: (at(0).x + at(17).x) / 2, y: (at(0).y + at(17).y) / 2 };
    const matrix = result.facialTransformationMatrixes?.[0]?.data;

    return {
      faces: result.faceLandmarks.length,
      eyeLeft: irises[0],
      eyeRight: irises[1],
      mouth,
      ...(matrix ? this.pose(matrix) : { yaw: 0, pitch: 0, roll: 0 }),
      eyeDarkness: this.eyeDarkness(context, bitmap, irises[0], irises[1]),
    };
  }

  private load(): Promise<FaceLandmarker> {
    this.landmarker ??= import('@mediapipe/tasks-vision').then(async vision => {
      const files = await vision.FilesetResolver.forVisionTasks('/mediapipe/wasm');

      return vision.FaceLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: '/models/face_landmarker.task' },
        runningMode: 'IMAGE',
        numFaces: 2,
        minFaceDetectionConfidence: 0.3,
        outputFacialTransformationMatrixes: true,
      });
    });

    return this.landmarker;
  }

  /** Giro, cabeza arriba o abajo e inclinación en grados, de la matriz 4x4 (en columnas) que entrega MediaPipe. */
  private pose(data: number[]): { yaw: number; pitch: number; roll: number } {
    const m = (row: number, column: number) => data[column * 4 + row];
    const deg = 180 / Math.PI;

    return {
      yaw: Math.atan2(-m(2, 0), Math.hypot(m(2, 1), m(2, 2))) * deg,
      pitch: Math.atan2(m(2, 1), m(2, 2)) * deg,
      roll: Math.atan2(m(1, 0), m(0, 0)) * deg,
    };
  }

  /** Luminosidad media de la zona de cada ojo sobre la de las mejillas: lentes oscuros la bajan mucho. */
  private eyeDarkness(context: CanvasRenderingContext2D, bitmap: ImageBitmap, left: { x: number; y: number }, right: { x: number; y: number }): number {
    const gap = Math.hypot(right.x - left.x, right.y - left.y);
    const luminance = (cx: number, cy: number, halfWidth: number, halfHeight: number): number => {
      const x = Math.max(0, Math.round(cx - halfWidth));
      const y = Math.max(0, Math.round(cy - halfHeight));
      const width = Math.max(1, Math.min(bitmap.width - x, Math.round(halfWidth * 2)));
      const height = Math.max(1, Math.min(bitmap.height - y, Math.round(halfHeight * 2)));
      const data = context.getImageData(x, y, width, height).data;
      let sum = 0;

      for (let i = 0; i < data.length; i += 4) {
        sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }

      return sum / (data.length / 4);
    };

    const eyes = (luminance(left.x, left.y, gap * 0.3, gap * 0.12) + luminance(right.x, right.y, gap * 0.3, gap * 0.12)) / 2;
    const cheeks = (luminance(left.x, left.y + gap * 0.7, gap * 0.25, gap * 0.12) + luminance(right.x, right.y + gap * 0.7, gap * 0.25, gap * 0.12)) / 2;

    return cheeks > 0 ? eyes / cheeks : 1;
  }
}
