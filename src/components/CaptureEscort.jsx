import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import Character from './Character'
import Piece from './Piece'
import * as THREE from 'three'
import {
  STAIR_CONFIG,
  STAIR_DEPTH,
  PRISONER_OFFSET,
  DUNGEON_MODEL_PATH,
  DUNGEON_MODEL_CONFIG,
  CELL_BASE_Y,
} from '../config/dungeon'

const APPROACH_TIME = 0.6
const GRAB_TIME = 0.25
const ESCORT_TIME = 0.9
const STEP_FORWARD_TIME = 0.12
const STEP_DOWN_TIME = 0.1
const TO_CELL_TIME = 0.2
const THROW_TIME = 0.35
const RETURN_STEP_TIME = 0.06
const RETURN_HOME_TIME = 0.35

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function lerpVec(a, b, t) {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
}

function smoothstep(t) {
  return t * t * (3 - 2 * t)
}

function buildStairSteps() {
  const steps = []
  for (let i = 0; i < STAIR_CONFIG.count; i += 1) {
    steps.push({
      y: STAIR_CONFIG.startY + i * STAIR_CONFIG.stepY,
      z: STAIR_CONFIG.startZ + i * STAIR_CONFIG.stepZ,
    })
  }
  return steps
}

function createMoveSegment(from, to, duration, carry, open) {
  return { type: 'move', from, to, duration, carry, open }
}

function createThrowSegment(from, to, duration, open, arc = 0.6) {
  return { type: 'throw', from, to, duration, carry: false, open, arc }
}

function buildSequence({ capture, dungeonPositions, homePositions }) {
  const side = capture.capturingColor || 'w'
  const stairDir = side === 'w' ? 1 : -1
  const dungeon = dungeonPositions[side]
  const home = homePositions[side]
  const start = [capture.position[0], 0, capture.position[2]]
  const stairEntry = [dungeon[0], 0, dungeon[2]]
  const steps = buildStairSteps()
  const segments = []

  segments.push(createMoveSegment(home, start, APPROACH_TIME, false, 0))
  segments.push(createMoveSegment(start, start, GRAB_TIME, true, 0))
  segments.push(createMoveSegment(start, stairEntry, ESCORT_TIME, true, 1))

  let current = stairEntry
  steps.forEach((step) => {
    const forward = [dungeon[0], current[1], dungeon[2] + stairDir * step.z]
    segments.push(createMoveSegment(current, forward, STEP_FORWARD_TIME, true, 1))
    const down = [dungeon[0], step.y, forward[2]]
    segments.push(createMoveSegment(forward, down, STEP_DOWN_TIME, true, 1))
    current = down
  })

  const cellStand = [dungeon[0], current[1], dungeon[2] + stairDir * DUNGEON_MODEL_CONFIG.cell.offset]
  segments.push(createMoveSegment(current, cellStand, TO_CELL_TIME, true, 1))

  const cellPrisoner = [cellStand[0], CELL_BASE_Y, cellStand[2] + stairDir * 0.4]
  segments.push(createThrowSegment(cellStand, cellPrisoner, THROW_TIME, 1))

  let returnPos = cellStand
  segments.push(createMoveSegment(cellStand, current, 0.18, false, 1))

  for (let i = steps.length - 2; i >= 0; i -= 1) {
    const step = steps[i]
    const open = clamp((i + 1) / (steps.length - 1), 0, 1)
    const up = [returnPos[0], step.y, returnPos[2]]
    segments.push(createMoveSegment(returnPos, up, RETURN_STEP_TIME, false, open))
    const back = [dungeon[0], step.y, dungeon[2] + stairDir * step.z]
    segments.push(createMoveSegment(up, back, RETURN_STEP_TIME, false, open))
    returnPos = back
  }

  const upToHall = [returnPos[0], 0, returnPos[2]]
  segments.push(createMoveSegment(returnPos, upToHall, RETURN_STEP_TIME, false, 0.06))
  segments.push(createMoveSegment(upToHall, stairEntry, RETURN_STEP_TIME, false, 0.03))
  segments.push(createMoveSegment(stairEntry, home, RETURN_HOME_TIME, false, 0))

  return {
    side,
    stairDir,
    steps,
    segments,
    index: 0,
    time: 0,
    open: 0,
    prisonerFixed: null,
  }
}

function DungeonEntrance({ position, openProgressRef, stairDir = 1, accent = '#7a5b13' }) {
  const leftRef = useRef()
  const rightRef = useRef()
  const lightRef = useRef()
  const cellOffset = stairDir * STAIR_DEPTH

  useFrame(() => {
    const open = openProgressRef.current || 0
    const angle = open * Math.PI * 0.5
    if (leftRef.current) leftRef.current.rotation.x = -angle
    if (rightRef.current) rightRef.current.rotation.x = angle
    if (lightRef.current) {
      lightRef.current.intensity = open * 1.1
    }
  })

  return (
    <group position={position}>
      <mesh receiveShadow position={[0, 0.02, 0]}>
        <boxGeometry args={[3.6, 0.08, 3.6]} />
        <meshStandardMaterial color="#6b5a32" metalness={0.4} roughness={0.5} />
      </mesh>
      <pointLight
        ref={lightRef}
        position={[0, -1.5, cellOffset]}
        intensity={0}
        color="#b39ddb"
      />
      <group ref={leftRef} position={[-1.3, 0.05, 0]}>
        <mesh position={[0.65, 0, 0]} castShadow>
          <boxGeometry args={[1.3, 0.08, 2.6]} />
          <meshStandardMaterial color={accent} metalness={0.6} roughness={0.5} />
        </mesh>
      </group>
      <group ref={rightRef} position={[1.3, 0.05, 0]}>
        <mesh position={[-0.65, 0, 0]} castShadow>
          <boxGeometry args={[1.3, 0.08, 2.6]} />
          <meshStandardMaterial color={accent} metalness={0.6} roughness={0.5} />
        </mesh>
      </group>
    </group>
  )
}

function DungeonRoomModel({ position, stairDir = 1, openProgressRef }) {
  return (
    <group position={position} rotation={stairDir === 1 ? [0, 0, 0] : [0, Math.PI, 0]}>
      <Suspense fallback={null}>
        <DungeonRoomGeometry openProgressRef={openProgressRef} />
      </Suspense>
      <DungeonRevealLights openProgressRef={openProgressRef} />
    </group>
  )
}

function DungeonRevealLights({ openProgressRef }) {
  const stairLightRef = useRef()
  const cellLightRef = useRef()

  useFrame(() => {
    const open = clamp(openProgressRef?.current || 0, 0, 1)
    if (stairLightRef.current) {
      stairLightRef.current.intensity = open * 1.35
      stairLightRef.current.distance = 3.5 + open * 4.5
    }
    if (cellLightRef.current) {
      cellLightRef.current.intensity = open * 1.95
      cellLightRef.current.distance = 4 + open * 5
    }
  })

  return (
    <group>
      <pointLight
        ref={stairLightRef}
        position={[0, -1.4, STAIR_DEPTH * 0.58]}
        color="#a9b9ff"
        intensity={0}
        distance={0}
        decay={1.8}
      />
      <pointLight
        ref={cellLightRef}
        position={[0, CELL_BASE_Y + 0.85, DUNGEON_MODEL_CONFIG.cell.offset + 0.35]}
        color="#b39ddb"
        intensity={0}
        distance={0}
        decay={1.7}
      />
    </group>
  )
}

function DungeonRoomGeometry({ openProgressRef }) {
  const { scene } = useGLTF(DUNGEON_MODEL_PATH)
  const cloned = useMemo(() => scene.clone(true), [scene])
  const xrayTint = useMemo(() => new THREE.Color('#a8b8ff'), [])
  const xrayEmissive = useMemo(() => new THREE.Color('#5a70d5'), [])
  const trackedMaterials = useMemo(() => {
    const materials = []
    cloned.traverse((child) => {
      if (!child.isMesh) return
      child.castShadow = true
      child.receiveShadow = true
      const source = Array.isArray(child.material) ? child.material : [child.material]
      const clonedMaterials = source.map((mat) => {
        if (!mat) return mat
        const next = mat.clone()
        materials.push({
          material: next,
          baseOpacity: next.opacity ?? 1,
          baseTransparent: Boolean(next.transparent),
          baseSide: next.side,
          baseColor: next.color ? next.color.clone() : null,
          baseEmissive:
            'emissive' in next && next.emissive ? next.emissive.clone() : new THREE.Color(0x000000),
          baseEmissiveIntensity:
            typeof next.emissiveIntensity === 'number' ? next.emissiveIntensity : 0,
        })
        return next
      })
      child.material = Array.isArray(child.material) ? clonedMaterials : clonedMaterials[0]
    })
    return materials
  }, [cloned])

  useFrame(() => {
    const open = clamp(openProgressRef?.current || 0, 0, 1)
    const opacityFactor = lerp(1, 0.58, open)
    trackedMaterials.forEach((entry) => {
      const { material } = entry
      material.transparent = open > 0.01 || entry.baseTransparent
      material.opacity = entry.baseOpacity * opacityFactor
      material.depthWrite = true
      material.depthTest = true

      if ('side' in material) {
        const side = open > 0.03 ? THREE.DoubleSide : entry.baseSide
        if (material.side !== side) {
          material.side = side
          material.needsUpdate = true
        }
      }

      if (entry.baseColor && material.color) {
        material.color.copy(entry.baseColor).lerp(xrayTint, open * 0.75)
      }
      if ('emissive' in material && material.emissive) {
        material.emissive.copy(entry.baseEmissive).lerp(xrayEmissive, open * 0.8)
        material.emissiveIntensity = entry.baseEmissiveIntensity + open * 0.85
      }
    })
  })

  return <primitive object={cloned} />
}

useGLTF.preload(DUNGEON_MODEL_PATH)

export default function CaptureEscort({
  capture,
  onComplete,
  dungeonPositions = { w: [-10, 0, 0], b: [10, 0, 0] },
  paused = false,
  openProgressRef,
}) {
  const [prisonerPiece, setPrisonerPiece] = useState(null)
  const [capturedPieces, setCapturedPieces] = useState({ w: [], b: [] })
  const whiteGuardRef = useRef()
  const blackGuardRef = useRef()
  const pieceRef = useRef()
  const sequenceRef = useRef(null)
  const whiteDoorProgress = useRef(0)
  const blackDoorProgress = useRef(0)

  const homePositions = useMemo(
    () => ({
      w: [dungeonPositions.w[0] - 2.2, 0, dungeonPositions.w[2] + 2],
      b: [dungeonPositions.b[0] + 2.2, 0, dungeonPositions.b[2] + 2],
    }),
    [dungeonPositions]
  )

  useEffect(() => {
    if (!capture) return
    setPrisonerPiece(capture.piece)
    sequenceRef.current = buildSequence({ capture, dungeonPositions, homePositions })
  }, [capture, dungeonPositions, homePositions])

  function getCellSlotPosition(side, index) {
    const stairDir = side === 'w' ? 1 : -1
    const base = dungeonPositions[side]
    const cellZ = base[2] + stairDir * DUNGEON_MODEL_CONFIG.cell.offset
    const columns = 3
    const rows = 2
    const layerSize = columns * rows
    const layer = Math.floor(index / layerSize)
    const slot = index % layerSize
    const col = slot % columns
    const row = Math.floor(slot / columns)
    const x = (col - 1) * 0.5
    const z = (row - 0.5) * 0.6
    const y = layer * 0.25
    return [base[0] + x, CELL_BASE_Y + y, cellZ + z]
  }

  useFrame((_, delta) => {
    if (paused) return

    const guards = {
      w: whiteGuardRef.current,
      b: blackGuardRef.current,
    }

    if (!guards.w || !guards.b) return

    guards.w.position.set(homePositions.w[0], homePositions.w[1], homePositions.w[2])
    guards.b.position.set(homePositions.b[0], homePositions.b[1], homePositions.b[2])
    guards.w.lookAt(0, 1, 0)
    guards.b.lookAt(0, 1, 0)

    whiteDoorProgress.current = 0
    blackDoorProgress.current = 0

    const sequence = sequenceRef.current
    if (!sequence) {
      if (openProgressRef?.current) {
        openProgressRef.current.w = whiteDoorProgress.current
        openProgressRef.current.b = blackDoorProgress.current
      }
      return
    }

    const segment = sequence.segments[sequence.index]
    if (!segment) {
      sequenceRef.current = null
      if (onComplete) onComplete()
      return
    }

    sequence.time += delta
    const progress = clamp(sequence.time / segment.duration, 0, 1)
    const eased = smoothstep(progress)

    const guardPos = lerpVec(segment.from, segment.to, eased)
    let prisonerPos = guardPos

    if (segment.carry) {
      prisonerPos = [
        guardPos[0] + PRISONER_OFFSET[0],
        guardPos[1] + PRISONER_OFFSET[1],
        guardPos[2] + PRISONER_OFFSET[2],
      ]
    } else if (segment.type === 'throw') {
      const arc = segment.arc || 0.6
      const y =
        lerp(segment.from[1], segment.to[1], eased) + arc * Math.sin(Math.PI * eased)
      prisonerPos = [
        lerp(segment.from[0], segment.to[0], eased),
        y,
        lerp(segment.from[2], segment.to[2], eased),
      ]
    } else if (sequence.prisonerFixed) {
      prisonerPos = sequence.prisonerFixed
    }

    const activeGuard = sequence.side === 'w' ? guards.w : guards.b
    activeGuard.position.set(guardPos[0], guardPos[1], guardPos[2])
    activeGuard.lookAt(0, 1, 0)

    sequence.open = lerp(sequence.open, segment.open, 0.2)
    if (sequence.side === 'w') {
      whiteDoorProgress.current = sequence.open
    } else {
      blackDoorProgress.current = sequence.open
    }

    if (progress >= 1) {
      sequence.time = 0
      if (segment.type === 'throw') {
        sequence.prisonerFixed = segment.to
        if (!sequence.prisonerStored && prisonerPiece) {
          const side = sequence.side
          setCapturedPieces((prev) => {
            const next = [...prev[side], prisonerPiece]
            return { ...prev, [side]: next }
          })
          sequence.prisonerStored = true
          setPrisonerPiece(null)
        }
      }
      sequence.index += 1
    }

    if (pieceRef.current && prisonerPiece) {
      pieceRef.current.visible = true
      pieceRef.current.position.set(prisonerPos[0], prisonerPos[1], prisonerPos[2])
    } else if (pieceRef.current) {
      pieceRef.current.visible = false
    }

    if (openProgressRef?.current) {
      openProgressRef.current.w = whiteDoorProgress.current
      openProgressRef.current.b = blackDoorProgress.current
    }
  })

  return (
    <group>
      <DungeonRoomModel
        position={dungeonPositions.w}
        stairDir={1}
        openProgressRef={whiteDoorProgress}
      />
      <DungeonRoomModel
        position={dungeonPositions.b}
        stairDir={-1}
        openProgressRef={blackDoorProgress}
      />
      <DungeonEntrance position={dungeonPositions.w} openProgressRef={whiteDoorProgress} stairDir={1} />
      <DungeonEntrance position={dungeonPositions.b} openProgressRef={blackDoorProgress} stairDir={-1} />
      <group ref={whiteGuardRef}>
        <Character role="guard" />
      </group>
      <group ref={blackGuardRef}>
        <Character role="guard" />
      </group>
      {capturedPieces.w.map((piece, index) => (
        <Piece
          key={`cell-w-${index}`}
          piece={piece}
          position={getCellSlotPosition('w', index)}
        />
      ))}
      {capturedPieces.b.map((piece, index) => (
        <Piece
          key={`cell-b-${index}`}
          piece={piece}
          position={getCellSlotPosition('b', index)}
        />
      ))}
      {prisonerPiece && (
        <group ref={pieceRef}>
          <Piece piece={prisonerPiece} position={[0, 0, 0]} />
        </group>
      )}
    </group>
  )
}
