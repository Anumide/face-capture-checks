import type { FaceLandmarks68, Point } from 'face-api.js'

/** Creates a { x, y } point compatible with face-api's Point (only x/y are read by the checks). */
export function point(x: number, y: number): Point {
  return { x, y } as unknown as Point
}

/** Fake video element — the checks only read videoWidth/videoHeight (frames are drawn via the context). */
export function makeVideo(videoWidth: number, videoHeight: number): HTMLVideoElement {
  return { videoWidth, videoHeight } as unknown as HTMLVideoElement
}

/**
 * Fake canvas whose 2d context returns the supplied pixels from getImageData.
 * drawImage is a no-op; pass null to simulate a canvas without a 2d context.
 */
export function makeCanvas(pixels: Uint8ClampedArray | null): HTMLCanvasElement {
  return {
    width: 0,
    height: 0,
    getContext: () =>
      pixels === null
        ? null
        : {
            drawImage: () => {},
            getImageData: () => ({ data: pixels })
          }
  } as unknown as HTMLCanvasElement
}

/** Uniform RGBA image of the given size. */
export function solidPixels(
  width: number,
  height: number,
  r: number,
  g: number,
  b: number
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let index = 0; index < width * height; index++) {
    data[index * 4] = r
    data[index * 4 + 1] = g
    data[index * 4 + 2] = b
    data[index * 4 + 3] = 255
  }
  return data
}

/** Alternating vertical stripes of the given pixel width (grayscale colors). */
export function verticalStripePixels(
  width: number,
  height: number,
  stripeWidth: number,
  dark: number,
  light: number
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      const value = Math.floor(column / stripeWidth) % 2 === 0 ? dark : light
      const index = (row * width + column) * 4
      data[index] = value
      data[index + 1] = value
      data[index + 2] = value
      data[index + 3] = 255
    }
  }
  return data
}

/**
 * Fake FaceLandmarks68 — only getLeftEye/getRightEye/positions are used.
 * The default positions form a deterministic 68-point array whose nose-bridge
 * points (27-30) sit below the eye fixtures used in tests.
 */
export function makeLandmarks(
  leftEye: Point[],
  rightEye: Point[],
  positions?: Point[]
): FaceLandmarks68 {
  const fallbackPositions = Array.from({ length: 68 }, (_, index) =>
    point(100 + index, 100 + index)
  )
  return {
    getLeftEye: () => leftEye,
    getRightEye: () => rightEye,
    positions: positions ?? fallbackPositions
  } as unknown as FaceLandmarks68
}

/** Open eye with EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|) = (2 + 2) / (2 * 4) = 0.5. */
export function openEye(): Point[] {
  return [point(0, 0), point(1, -1), point(3, -1), point(4, 0), point(3, 1), point(1, 1)]
}

/** Closed (collapsed) eye — the lid pairs (p2/p6, p3/p5) are vertically aligned, so EAR = 0. */
export function closedEye(): Point[] {
  return [point(0, 0), point(1, 0), point(3, 0), point(4, 0), point(3, 0), point(1, 0)]
}

/** Eye with EAR = (2 + 2) / (2 * 10) = 0.2 — exactly the default minAspectRatio threshold. */
export function boundaryEye(): Point[] {
  return [point(0, 0), point(3, -1), point(7, -1), point(10, 0), point(7, 1), point(3, 1)]
}
