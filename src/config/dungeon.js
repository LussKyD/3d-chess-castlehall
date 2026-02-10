import { assetUrl } from './assetPaths.js'

export const STAIR_CONFIG = {
  count: 12,
  startY: -0.15,
  stepY: -0.23,
  startZ: 0.6,
  stepZ: 0.6,
}

export const STAIR_DEPTH = STAIR_CONFIG.startZ + (STAIR_CONFIG.count - 1) * STAIR_CONFIG.stepZ

export const PRISONER_OFFSET = [0, 0.4, 0.2]

export const DUNGEON_MODEL_PATH = assetUrl('assets/models/dungeon_room.gltf')

export const DUNGEON_MODEL_CONFIG = {
  width: 6,
  depth: STAIR_DEPTH + 4,
  wallHeight: 4,
  floorThickness: 0.2,
  stairWidth: 2.2,
  stairHeight: 0.2,
  stairDepth: 0.7,
  cell: {
    width: 3.4,
    depth: 3.4,
    height: 2.8,
    offset: STAIR_DEPTH + 1.4,
  },
}

export const CELL_BASE_Y =
  STAIR_CONFIG.startY + (STAIR_CONFIG.count - 1) * STAIR_CONFIG.stepY - 0.8

export const DUNGEON_VIEWPORT = {
  width: 7.2,
  depth: 13.4,
  forwardOffset: 5.45,
}
