import type { FaceDetection } from 'face-api.js'
import type { FaceBox, FaceCenteredOptions, FrameSize } from '../types.js'

const DEFAULTS = {
  centerTolerance: 0.15,
  minFaceWidthRatio: 0.3,
  maxFaceWidthRatio: 0.65
} satisfies Required<FaceCenteredOptions>

/** Returns whether the detected face is centered and occupies an acceptable frame width. */
export function isFaceCentered(
  detection: Pick<FaceDetection, 'box'> | FaceBox,
  frame: FrameSize,
  options: FaceCenteredOptions = {}
): boolean {
  const box = 'box' in detection ? detection.box : detection
  const centerTolerance = options.centerTolerance ?? DEFAULTS.centerTolerance
  const minFaceWidthRatio = options.minFaceWidthRatio ?? DEFAULTS.minFaceWidthRatio
  const maxFaceWidthRatio = options.maxFaceWidthRatio ?? DEFAULTS.maxFaceWidthRatio

  const faceCenterX = box.x + box.width / 2
  const faceCenterY = box.y + box.height / 2
  const frameCenterX = frame.width / 2
  const frameCenterY = frame.height / 2
  const centerDistance = Math.hypot(faceCenterX - frameCenterX, faceCenterY - frameCenterY)

  return centerDistance < frame.width * centerTolerance
    && box.width >= frame.width * minFaceWidthRatio
    && box.width <= frame.width * maxFaceWidthRatio
}
