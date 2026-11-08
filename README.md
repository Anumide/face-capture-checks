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

The pixel-based helpers accept an optional reusable `HTMLCanvasElement` to avoid creating a canvas for each analysis. Supply configurable thresholds through each check's options. `detectGlasses` is a pixel heuristic based on dark regions, contrast, and edges around the eyes; it is not a glasses-classification model.

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

The build emits ESM JavaScript and TypeScript declarations under `dist/`. `face-api.js` is a peer dependency and its detection/landmark types are used in the public API. The included model files are packed with the npm package, so the copy command uses the installed files and does not download them.
