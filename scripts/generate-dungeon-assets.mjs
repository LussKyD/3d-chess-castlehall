import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  Scene,
  Group,
  Mesh,
  BoxGeometry,
  MeshStandardMaterial,
  Color,
} from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import {
  STAIR_CONFIG,
  STAIR_DEPTH,
  DUNGEON_MODEL_CONFIG,
  DUNGEON_MODEL_PATH,
} from '../src/config/dungeon.js'

if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class FileReader {
    constructor() {
      this.result = null
      this.onload = null
      this.onerror = null
    }

    readAsArrayBuffer(blob) {
      blob
        .arrayBuffer()
        .then((buffer) => {
          this.result = buffer
          if (this.onload) this.onload({ target: this })
          if (this.onloadend) this.onloadend({ target: this })
        })
        .catch((err) => {
          if (this.onerror) this.onerror(err)
        })
    }

    readAsDataURL(blob) {
      blob
        .arrayBuffer()
        .then((buffer) => {
          const base64 = Buffer.from(buffer).toString('base64')
          this.result = `data:${blob.type || 'application/octet-stream'};base64,${base64}`
          if (this.onload) this.onload({ target: this })
          if (this.onloadend) this.onloadend({ target: this })
        })
        .catch((err) => {
          if (this.onerror) this.onerror(err)
        })
    }
  }
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const outPath = path.join(
  __dirname,
  '..',
  'public',
  DUNGEON_MODEL_PATH.replace(/^\/+/, '')
)

async function exportDungeon() {
  const scene = new Scene()
  scene.background = new Color(0x000000)
  const group = new Group()

  const stone = new MeshStandardMaterial({ color: '#4a463c', roughness: 0.9 })
  const floorMat = new MeshStandardMaterial({ color: '#3e3a33', roughness: 0.8 })
  const metal = new MeshStandardMaterial({ color: '#5a3b1f', metalness: 0.6, roughness: 0.4 })

  const width = DUNGEON_MODEL_CONFIG.width
  const depth = DUNGEON_MODEL_CONFIG.depth
  const wallHeight = DUNGEON_MODEL_CONFIG.wallHeight
  const floorThickness = DUNGEON_MODEL_CONFIG.floorThickness
  const wallThickness = 0.4

  const floor = new Mesh(new BoxGeometry(width, floorThickness, depth), floorMat)
  floor.position.set(0, -floorThickness / 2, depth / 2)
  group.add(floor)

  const leftWall = new Mesh(new BoxGeometry(wallThickness, wallHeight, depth), stone)
  leftWall.position.set(-width / 2 + wallThickness / 2, wallHeight / 2 - 0.1, depth / 2)
  group.add(leftWall)

  const rightWall = new Mesh(new BoxGeometry(wallThickness, wallHeight, depth), stone)
  rightWall.position.set(width / 2 - wallThickness / 2, wallHeight / 2 - 0.1, depth / 2)
  group.add(rightWall)

  const backWall = new Mesh(new BoxGeometry(width, wallHeight, wallThickness), stone)
  backWall.position.set(0, wallHeight / 2 - 0.1, depth - wallThickness / 2)
  group.add(backWall)

  const ceiling = new Mesh(new BoxGeometry(width, floorThickness, depth), stone)
  ceiling.position.set(0, wallHeight + floorThickness / 2 - 0.1, depth / 2)
  group.add(ceiling)

  const stairWidth = DUNGEON_MODEL_CONFIG.stairWidth
  const stairHeight = DUNGEON_MODEL_CONFIG.stairHeight
  const stairDepth = DUNGEON_MODEL_CONFIG.stairDepth

  for (let i = 0; i < STAIR_CONFIG.count; i += 1) {
    const stepY = STAIR_CONFIG.startY + i * STAIR_CONFIG.stepY
    const stepZ = STAIR_CONFIG.startZ + i * STAIR_CONFIG.stepZ
    const step = new Mesh(new BoxGeometry(stairWidth, stairHeight, stairDepth), stone)
    step.position.set(0, stepY - stairHeight / 2, stepZ)
    group.add(step)
  }

  const cell = DUNGEON_MODEL_CONFIG.cell
  const lastStepY = STAIR_CONFIG.startY + (STAIR_CONFIG.count - 1) * STAIR_CONFIG.stepY
  const cellFloor = new Mesh(new BoxGeometry(cell.width, floorThickness, cell.depth), floorMat)
  cellFloor.position.set(0, lastStepY - 0.8, cell.offset)
  group.add(cellFloor)

  const cellBack = new Mesh(new BoxGeometry(cell.width, cell.height, wallThickness), stone)
  cellBack.position.set(0, lastStepY + cell.height / 2 - 1.1, cell.offset + cell.depth / 2)
  group.add(cellBack)

  const cellLeft = new Mesh(new BoxGeometry(wallThickness, cell.height, cell.depth), stone)
  cellLeft.position.set(-cell.width / 2, lastStepY + cell.height / 2 - 1.1, cell.offset)
  group.add(cellLeft)

  const cellRight = new Mesh(new BoxGeometry(wallThickness, cell.height, cell.depth), stone)
  cellRight.position.set(cell.width / 2, lastStepY + cell.height / 2 - 1.1, cell.offset)
  group.add(cellRight)

  const barCount = 5
  for (let i = 0; i < barCount; i += 1) {
    const x = -cell.width / 2 + (i + 1) * (cell.width / (barCount + 1))
    const bar = new Mesh(new BoxGeometry(0.1, cell.height * 0.9, 0.1), metal)
    bar.position.set(x, lastStepY + cell.height / 2 - 1.1, cell.offset - cell.depth / 2)
    group.add(bar)
  }

  const barTop = new Mesh(new BoxGeometry(cell.width, 0.12, 0.12), metal)
  barTop.position.set(0, lastStepY + cell.height - 1.2, cell.offset - cell.depth / 2)
  group.add(barTop)

  group.name = 'DungeonRoom'
  scene.add(group)
  scene.updateMatrixWorld(true)

  const exporter = new GLTFExporter()
  const gltf = await new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (result) => resolve(result),
      (err) => reject(err),
      { binary: false }
    )
  })

  await mkdir(path.dirname(outPath), { recursive: true })
  await writeFile(outPath, JSON.stringify(gltf, null, 2))
}

exportDungeon().catch((err) => {
  console.error(err)
  process.exit(1)
})
