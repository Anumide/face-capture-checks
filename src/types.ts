export interface FaceBox {
  x: number
  y: number
  width: number
  height: number
}

export interface FrameSize {
  width: number
  height: number
}

export interface FaceImageMetrics {
  brightness: number
  sharpness: number
}

export interface FaceCenteredOptions {
  centerTolerance?: number
  minFaceWidthRatio?: number
  maxFaceWidthRatio?: number
}

export interface EyeVisibilityOptions {
  minAspectRatio?: number
}

export interface LightingOptions {
  minBrightness?: number
  maxBrightness?: number
}

export interface SharpnessOptions {
  minSharpness?: number
}
