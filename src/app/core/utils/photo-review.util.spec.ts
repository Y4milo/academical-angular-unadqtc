import { DEFAULT_REVIEW_THRESHOLDS, FacePoints, readResolution, reviewFace, serializeReview, warningsOf } from './photo-review.util';

/** Cabecera JFIF mínima: SOI + APP0 con unidades y densidad. */
function jfif(units: number, density: number): Uint8Array {
  return Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, units, density >> 8, density & 0xff, density >> 8, density & 0xff, 0, 0]);
}

const FRONTAL: FacePoints = {
  faces: 1, eyeLeft: { x: 101.6, y: 119.3 }, eyeRight: { x: 150.6, y: 120 }, mouth: { x: 123.3, y: 163.8 }, yaw: -2.9, pitch: -5.8, roll: -1.2, eyeDarkness: 0.75,
};

describe('photo review', () => {
  it('reads the resolution from the JFIF header, in dots per inch or per centimetre', () => {
    expect(readResolution(jfif(1, 300))).toBe(300);
    expect(readResolution(jfif(2, 118))).toBe(300);
    expect(readResolution(jfif(0, 1))).toBeNull();
    expect(readResolution(new Uint8Array([1, 2, 3]))).toBeNull();
  });

  it('accepts the face of a frontal photo that SUNEDU validated', () => {
    const checks = reviewFace(FRONTAL, DEFAULT_REVIEW_THRESHOLDS);

    expect(warningsOf(checks)).toBe(0);
    expect(checks.find(check => check.key === 'eye_left')?.value).toBe('102 / 119');
  });

  it('warns about a head tilted back even when eyes and mouth are inside the SUNEDU ranges', () => {
    const checks = reviewFace({ ...FRONTAL, pitch: -15.7 }, DEFAULT_REVIEW_THRESHOLDS);

    expect(checks.filter(check => !check.ok).map(check => check.key)).toEqual(['pitch']);
  });

  it('warns about a turned head, several faces and dark glasses, the last one as an estimate', () => {
    const checks = reviewFace({ ...FRONTAL, yaw: 30, faces: 2, eyeDarkness: 0.2 }, DEFAULT_REVIEW_THRESHOLDS);

    expect(checks.filter(check => !check.ok).map(check => check.key)).toEqual(['faces', 'yaw', 'glasses']);
    expect(checks.find(check => check.key === 'glasses')?.estimate).toBeTrue();
  });

  it('gives a single warning when no face is found or the detector is not available', () => {
    expect(reviewFace(null, DEFAULT_REVIEW_THRESHOLDS).length).toBe(1);
    expect(reviewFace({ ...FRONTAL, faces: 0 }, DEFAULT_REVIEW_THRESHOLDS)[0].ok).toBeFalse();
  });

  it('uses the thresholds of the semester', () => {
    const strict = { ...DEFAULT_REVIEW_THRESHOLDS, pitch_max: 5 };

    expect(reviewFace(FRONTAL, strict).find(check => check.key === 'pitch')?.ok).toBeFalse();
  });

  it('serializes only keys, simple values and the result', () => {
    const json = JSON.parse(serializeReview({ face: true, checks: reviewFace(FRONTAL, DEFAULT_REVIEW_THRESHOLDS) }));

    expect(json.face).toBeTrue();
    expect(Object.keys(json.checks[0]).sort()).toEqual(['key', 'ok', 'value']);
  });
});
