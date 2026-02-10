import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  Scene,
  Group,
  Mesh,
  BoxGeometry,
  CylinderGeometry,
  ConeGeometry,
  SphereGeometry,
  TorusGeometry,
  MeshStandardMaterial,
  Color,
} from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import {
  STAIR_CONFIG,
  DUNGEON_MODEL_CONFIG,
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
const outDir = path.join(__dirname, '..', 'public', 'assets', 'models')

async function exportScene(scene, filename) {
  const exporter = new GLTFExporter()
  const gltf = await new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (result) => resolve(result),
      (err) => reject(err),
      { binary: false }
    )
  })

  await mkdir(outDir, { recursive: true })
  const outPath = path.join(outDir, filename)
  await writeFile(outPath, JSON.stringify(gltf, null, 2))
}

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

  await exportScene(scene, 'dungeon_room.gltf')
}

function createPieceScene(buildFn, name) {
  const scene = new Scene()
  const group = new Group()
  buildFn(group)
  group.name = name
  scene.add(group)
  scene.updateMatrixWorld(true)
  return scene
}

function buildPawn(group) {
  const base = new Mesh(new CylinderGeometry(0.3, 0.35, 0.2, 24), new MeshStandardMaterial())
  base.position.set(0, 0.1, 0)
  group.add(base)
  const body = new Mesh(new CylinderGeometry(0.22, 0.28, 0.35, 24), new MeshStandardMaterial())
  body.position.set(0, 0.35, 0)
  group.add(body)
  const head = new Mesh(new SphereGeometry(0.2, 24, 24), new MeshStandardMaterial())
  head.position.set(0, 0.65, 0)
  group.add(head)
}

function buildRook(group) {
  const base = new Mesh(new CylinderGeometry(0.34, 0.38, 0.2, 24), new MeshStandardMaterial())
  base.position.set(0, 0.1, 0)
  group.add(base)
  const body = new Mesh(new BoxGeometry(0.55, 0.5, 0.55), new MeshStandardMaterial())
  body.position.set(0, 0.45, 0)
  group.add(body)
  const top = new Mesh(new BoxGeometry(0.6, 0.2, 0.6), new MeshStandardMaterial())
  top.position.set(0, 0.8, 0)
  group.add(top)
}

function buildKnight(group) {
  const base = new Mesh(new CylinderGeometry(0.32, 0.36, 0.2, 24), new MeshStandardMaterial())
  base.position.set(0, 0.1, 0)
  group.add(base)
  const body = new Mesh(new CylinderGeometry(0.26, 0.3, 0.45, 24), new MeshStandardMaterial())
  body.position.set(0, 0.4, 0)
  group.add(body)
  const head = new Mesh(new BoxGeometry(0.35, 0.35, 0.25), new MeshStandardMaterial())
  head.position.set(0.05, 0.75, 0)
  head.rotation.set(0, 0.3, 0)
  group.add(head)
  const snout = new Mesh(new ConeGeometry(0.12, 0.25, 16), new MeshStandardMaterial())
  snout.position.set(0.22, 0.78, 0)
  snout.rotation.set(0, 0, Math.PI / 2)
  group.add(snout)
}

function buildBishop(group) {
  const base = new Mesh(new CylinderGeometry(0.32, 0.36, 0.2, 24), new MeshStandardMaterial())
  base.position.set(0, 0.1, 0)
  group.add(base)
  const body = new Mesh(new ConeGeometry(0.35, 0.7, 24), new MeshStandardMaterial())
  body.position.set(0, 0.55, 0)
  group.add(body)
  const head = new Mesh(new SphereGeometry(0.2, 24, 24), new MeshStandardMaterial())
  head.position.set(0, 0.95, 0)
  group.add(head)
}

function buildQueen(group) {
  const base = new Mesh(new CylinderGeometry(0.34, 0.4, 0.2, 24), new MeshStandardMaterial())
  base.position.set(0, 0.1, 0)
  group.add(base)
  const body = new Mesh(new CylinderGeometry(0.22, 0.32, 0.7, 24), new MeshStandardMaterial())
  body.position.set(0, 0.55, 0)
  group.add(body)
  const crown = new Mesh(new TorusGeometry(0.22, 0.05, 12, 24), new MeshStandardMaterial())
  crown.position.set(0, 0.95, 0)
  group.add(crown)
  const head = new Mesh(new SphereGeometry(0.16, 24, 24), new MeshStandardMaterial())
  head.position.set(0, 1.1, 0)
  group.add(head)
}

function buildKing(group) {
  const base = new Mesh(new CylinderGeometry(0.34, 0.4, 0.2, 24), new MeshStandardMaterial())
  base.position.set(0, 0.1, 0)
  group.add(base)
  const body = new Mesh(new CylinderGeometry(0.24, 0.34, 0.8, 24), new MeshStandardMaterial())
  body.position.set(0, 0.6, 0)
  group.add(body)
  const crown = new Mesh(new BoxGeometry(0.35, 0.08, 0.35), new MeshStandardMaterial())
  crown.position.set(0, 1.05, 0)
  group.add(crown)
  const cross = new Mesh(new BoxGeometry(0.08, 0.22, 0.08), new MeshStandardMaterial())
  cross.position.set(0, 1.2, 0)
  group.add(cross)
}

function buildGuard(group) {
  const base = new Mesh(new CylinderGeometry(0.28, 0.32, 0.25, 20), new MeshStandardMaterial())
  base.position.set(0, 0.12, 0)
  group.add(base)
  const body = new Mesh(new CylinderGeometry(0.26, 0.32, 0.7, 20), new MeshStandardMaterial())
  body.position.set(0, 0.55, 0)
  group.add(body)
  const chest = new Mesh(new BoxGeometry(0.45, 0.35, 0.25), new MeshStandardMaterial())
  chest.position.set(0, 0.8, 0)
  group.add(chest)
  const head = new Mesh(new SphereGeometry(0.2, 20, 20), new MeshStandardMaterial())
  head.position.set(0, 1.05, 0)
  group.add(head)
}

async function exportPieces() {
  await exportScene(createPieceScene(buildPawn, 'Pawn'), 'pawn.gltf')
  await exportScene(createPieceScene(buildRook, 'Rook'), 'rook.gltf')
  await exportScene(createPieceScene(buildKnight, 'Knight'), 'knight.gltf')
  await exportScene(createPieceScene(buildBishop, 'Bishop'), 'bishop.gltf')
  await exportScene(createPieceScene(buildQueen, 'Queen'), 'queen.gltf')
  await exportScene(createPieceScene(buildKing, 'King'), 'king.gltf')
  await exportScene(createPieceScene(buildGuard, 'Guard'), 'guard.gltf')
}

async function run() {
  await exportDungeon()
  await exportPieces()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
