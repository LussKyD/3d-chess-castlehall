import { assetUrl } from './assetPaths.js'

export const MODEL_PATHS = {
  pieces: {
    p: assetUrl('assets/models/pawn.gltf'),
    r: assetUrl('assets/models/rook.gltf'),
    n: assetUrl('assets/models/knight.gltf'),
    b: assetUrl('assets/models/bishop.gltf'),
    q: assetUrl('assets/models/queen.gltf'),
    k: assetUrl('assets/models/king.gltf'),
  },
  guard: assetUrl('assets/models/guard.gltf'),
  king: assetUrl('assets/models/king.gltf'),
  queen: assetUrl('assets/models/queen.gltf'),
}

export const MODEL_SETTINGS = {
  piece: {
    scale: 0.72,
    yOffset: 0,
  },
  guard: {
    scale: 1.35,
    yOffset: 0,
  },
  king: {
    scale: 1.5,
    yOffset: 0,
  },
  queen: {
    scale: 1.4,
    yOffset: 0,
  },
}
