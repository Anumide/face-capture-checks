# face-capture-checks

Framework-agnostic browser image checks for face capture flows. The checks accept face-api.js detections and landmarks, plus browser video/canvas inputs for pixel-based analysis. They do not own camera lifecycle or UI state.

## Install

```sh
npm install face-capture-checks face-api.js
```

The package includes the Tiny Face Detector and Tiny 68-point Landmark model manifests and weight shards under `models/`. To serve them from a browser app's public directory, run this once after installing the package:

```sh
npx face-capture-checks-copy-models
```

This copies the bundled files into `public/models/`. Then load the included models with face-api.js:

```ts
await Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models')
])
```

To use a different static assets directory, pass its path relative to the app root:

```sh
npx face-capture-checks-copy-models static/face-models
```

## Use individual checks

```ts
import {
  analyzeFaceImage,
  areEyesVisible,
  detectGlasses,
  hasAdequateLighting,
  isFaceCentered,
  isImageSharp
} from 'face-capture-checks'

const face = detections[0]
const metrics = analyzeFaceImage(video, face.detection.box)

const checks = {
  faceCentered: isFaceCentered(face.detection, {
    width: video.videoWidth,
    height: video.videoHeight
  }),
  eyesVisible: areEyesVisible(face.landmarks),
  lighting: hasAdequateLighting(metrics),
  sharpness: isImageSharp(metrics),
  noGlasses: !detectGlasses(video, face.landmarks)
}
```

Import only the checks you need; the package is side-effect free, so bundlers tree-shake the rest.

## Blink and liveness checks

Blink and liveness checks keep state across camera frames, so create one detector for each capture session and call `reset()` when starting over. Calibration uses centered frames before asking the user to blink or turn their head.

```ts
import {
  areEyesVisible,
  createBlinkDetector,
  createLivenessDetector,
  isFaceCentered
} from 'face-capture-checks'

const blinkCheck = createBlinkDetector()
const livenessCheck = createLivenessDetector()

// Call once for each detected face/frame from face-api.js.
const frame = { width: video.videoWidth, height: video.videoHeight }
const centered = isFaceCentered(face.detection, frame)
const blink = blinkCheck.update(face.landmarks, {
  isCentered: centered,
  timestamp: performance.now()
})
const liveness = livenessCheck.update({
  face: face.detection,
  landmarks: face.landmarks,
  frame,
  eyesOpen: areEyesVisible(face.landmarks),
  blinkDetected: blink.detected
})

if (liveness.verified && liveness.facingForward) {
  // Both the blink and head movement were observed; the face has returned forward.
}
```

`createBlinkDetector` reports calibration, open, closed, and detected states and accepts optional EAR ratios and timing thresholds. `createLivenessDetector` tracks a neutral-pose baseline, smoothed head yaw, head movement, and return to a forward pose. These checks provide capture-flow signals; they are not a presentation-attack detector and do not guarantee protection from photo or video replay.

The pixel-based helpers accept an optional reusable `HTMLCanvasElement` to avoid creating a canvas for each analysis. Supply configurable thresholds through each check's options. `detectGlasses` is a pixel heuristic based on dark regions, contrast, and edges around the eyes; it is not a glasses-classification model, and it reads nose-bridge landmark points 27–30, so it assumes a full 68-point landmark set.

## Testing

```sh
pnpm install
pnpm test
pnpm test:coverage
pnpm typecheck
```

## Build

```sh
npm install
npm run build
```

The build emits ESM JavaScript and TypeScript declarations under `dist/`. `face-api.js` is a peer dependency and its detection/landmark types are used in the public API. Note that the upstream `face-api.js` repository has been unmaintained since 2020; the API-compatible fork [`@vladmandic/face-api`](https://github.com/vladmandic/face-api) is a maintained drop-in alternative. The included model files are packed with the npm package, so the copy command uses the installed files and does not download them.
