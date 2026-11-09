import type { FaceBox, FaceImageMetrics } from '../types.js'

export interface FaceImageAnalysisOptions {
  sampleSize?: number
  canvas?: HTMLCanvasElement
}

function createCanvas(): HTMLCanvasElement {
  if (typeof document === 'undefined') {
    throw new Error('Face image analysis requires a browser canvas or a supplied canvas.')
  }
  return document.createElement('canvas')
}

/** Samples the detected face region and returns mean brightness and average gradient. */
export function analyzeFaceImage(
  video: HTMLVideoElement,
  box: FaceBox,
  options: FaceImageAnalysisOptions = {}
): FaceImageMetrics {
  const requestedSize = Math.trunc(options.sampleSize ?? 60)
  const canvas = options.canvas ?? createCanvas()
  const context = canvas.getContext('2d')
  if (
    !context
    || !video.videoWidth
    || !video.videoHeight
    || !Number.isFinite(requestedSize)
    || requestedSize < 3
  ) {
    return { brightness: 120, sharpness: 10 }
  }
  const sampleSize = Math.min(requestedSize, 512)

  const x = Math.max(0, box.x)
  const y = Math.max(0, box.y)
  const width = Math.min(video.videoWidth - x, box.width)
  const height = Math.min(video.videoHeight - y, box.height)
  if (width <= 0 || height <= 0) return { brightness: 120, sharpness: 10 }

  canvas.width = sampleSize
  canvas.height = sampleSize
  context.drawImage(video, x, y, width, height, 0, 0, sampleSize, sampleSize)

  const pixels = context.getImageData(0, 0, sampleSize, sampleSize).data
  const grayscale = new Uint8Array(sampleSize * sampleSize)
  let brightnessSum = 0

  for (let pixel = 0; pixel < grayscale.length; pixel++) {
    const index = pixel * 4
    const brightness = 0.299 * pixels[index] + 0.587 * pixels[index + 1] + 0.114 * pixels[index + 2]
    grayscale[pixel] = brightness
    brightnessSum += brightness
  }

  let gradientSum = 0
  for (let row = 1; row < sampleSize - 1; row++) {
    for (let column = 1; column < sampleSize - 1; column++) {
      const index = row * sampleSize + column
      const gradientX = grayscale[index + 1] - grayscale[index - 1]
      const gradientY = grayscale[index + sampleSize] - grayscale[index - sampleSize]
      gradientSum += Math.hypot(gradientX, gradientY)
    }
  }

  const interiorPixels = (sampleSize - 2) ** 2
  return {
    brightness: brightnessSum / grayscale.length,
    sharpness: gradientSum / interiorPixels
  }
}
