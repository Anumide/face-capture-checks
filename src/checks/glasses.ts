import type { FaceLandmarks68 } from 'face-api.js'

export interface GlassesDetectionOptions {
  canvas?: HTMLCanvasElement
  sampleWidth?: number
  sampleHeight?: number
  edgeThreshold?: number
}

function createCanvas(): HTMLCanvasElement {
  if (typeof document === 'undefined') {
    throw new Error('Glasses detection requires a browser canvas or a supplied canvas.')
  }
  return document.createElement('canvas')
}

/**
 * Heuristically detects glasses using dark pixels, contrast, and strong edges around the eyes.
 * This is a visual heuristic, not a face-api model classification.
 */
export function detectGlasses(
  video: HTMLVideoElement,
  landmarks: FaceLandmarks68,
  options: GlassesDetectionOptions = {}
): boolean {
  const canvas = options.canvas ?? createCanvas()
  const context = canvas.getContext('2d')
  if (!context) return false

  const requestedWidth = Math.trunc(options.sampleWidth ?? 80)
  const requestedHeight = Math.trunc(options.sampleHeight ?? 32)
  const sampleWidth = Number.isFinite(requestedWidth) ? Math.min(requestedWidth, 1024) : 80
  const sampleHeight = Number.isFinite(requestedHeight) ? Math.min(requestedHeight, 256) : 32
  const eyePoints = [...landmarks.getLeftEye(), ...landmarks.getRightEye()]
  if (eyePoints.length === 0) return false

  const minX = Math.max(0, Math.min(...eyePoints.map(({ x }) => x)) - 10)
  const minY = Math.max(0, Math.min(...eyePoints.map(({ y }) => y)) - 10)
  const maxX = Math.min(video.videoWidth, Math.max(...eyePoints.map(({ x }) => x)) + 10)
  const maxY = Math.min(video.videoHeight, Math.max(...eyePoints.map(({ y }) => y)) + 20)
  const positions = landmarks.positions
  if (positions.length < 31) return false
  const noseBridgeMinY = Math.min(positions[27].y, positions[28].y, positions[29].y, positions[30].y)
  const regionY = Math.max(0, Math.min(minY, noseBridgeMinY))
  const regionWidth = maxX - minX
  const regionHeight = maxY - regionY
  if (regionWidth <= 0 || regionHeight <= 0) return false

  canvas.width = sampleWidth
  canvas.height = sampleHeight
  context.drawImage(video, minX, regionY, regionWidth, regionHeight, 0, 0, sampleWidth, sampleHeight)
  const pixels = context.getImageData(0, 0, sampleWidth, sampleHeight).data
  const grayscale = new Uint8Array(sampleWidth * sampleHeight)
  let darkPixels = 0
  let veryDarkPixels = 0
  let brightnessSum = 0

  for (let pixel = 0; pixel < grayscale.length; pixel++) {
    const index = pixel * 4
    const brightness = 0.299 * pixels[index] + 0.587 * pixels[index + 1] + 0.114 * pixels[index + 2]
    grayscale[pixel] = brightness
    brightnessSum += brightness
    if (brightness < 80) darkPixels++
    if (brightness < 45) veryDarkPixels++
  }

  let gradientSum = 0
  let strongEdgePixels = 0
  let edgeCount = 0
  const edgeThreshold = options.edgeThreshold ?? 46

  for (let row = 1; row < sampleHeight - 1; row++) {
    for (let column = 1; column < sampleWidth - 1; column++) {
      const index = row * sampleWidth + column
      const gradientX = grayscale[index + 1] - grayscale[index - 1]
      const gradientY = grayscale[index + sampleWidth] - grayscale[index - sampleWidth]
      const gradient = Math.hypot(gradientX, gradientY)
      gradientSum += gradient
      if (gradient > edgeThreshold) strongEdgePixels++
      edgeCount++
    }
  }

  const averageBrightness = brightnessSum / grayscale.length
  const averageGradient = edgeCount > 0 ? gradientSum / edgeCount : 0
  const strongEdgeRatio = edgeCount > 0 ? strongEdgePixels / edgeCount : 0
  const darkPixelRatio = darkPixels / grayscale.length
  const veryDarkPixelRatio = veryDarkPixels / grayscale.length
  const variance = grayscale.reduce((sum, value) => sum + (value - averageBrightness) ** 2, 0) / grayscale.length
  const contrast = Math.sqrt(variance)

  return averageGradient > 34
    && strongEdgeRatio > 0.16
    && (darkPixelRatio > 0.18 || veryDarkPixelRatio > 0.07)
    && contrast > 52
}
