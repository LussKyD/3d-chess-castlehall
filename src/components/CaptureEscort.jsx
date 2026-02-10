import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import Character from './Character'
import Piece from './Piece'
import * as THREE from 'three'

const APPROACH_TIME = 0.6
const GRAB_TIME = 0.25
const ESCORT_TIME = 0.9
const STEP_FORWARD_TIME = 0.12
const STEP_DOWN_TIME = 0.1
const TO_CELL_TIME = 0.2
const THROW_TIME = 0.35
const RETURN_STEP_TIME = 0.06
const RETURN_HOME_TIME = 0.35

const STAIR_CONFIG = {
  count: 12,
  startY: -0.15,
  stepY: -0.23,
  startZ: 0.6,
  stepZ: 0.6,
}
const STAIR_DEPTH = STAIR_CONFIG.startZ + (STAIR_CONFIG.count - 1) * STAIR_CONFIG.stepZ
const PRISONER_OFFSET = [0, 0.4, 0.2]

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

  const cellStand = [dungeon[0], current[1], dungeon[2] + stairDir * (STAIR_DEPTH + 0.8)]
  segments.push(createMoveSegment(current, cellStand, TO_CELL_TIME, true, 1))

  const cellPrisoner = [cellStand[0], current[1] - 0.8, cellStand[2] + stairDir * 0.4]
  segments.push(createThrowSegment(cellStand, cellPrisoner, THROW_TIME, 1))

  let returnPos = cellStand
  segments.push(createMoveSegment(cellStand, current, 0.18, false, 0))

  for (let i = steps.length - 2; i >= 0; i -= 1) {
    const step = steps[i]
    const up = [returnPos[0], step.y, returnPos[2]]
    segments.push(createMoveSegment(returnPos, up, RETURN_STEP_TIME, false, 0))
    const back = [dungeon[0], step.y, dungeon[2] + stairDir * step.z]
    segments.push(createMoveSegment(up, back, RETURN_STEP_TIME, false, 0))
    returnPos = back
  }

  const upToHall = [returnPos[0], 0, returnPos[2]]
  segments.push(createMoveSegment(returnPos, upToHall, RETURN_STEP_TIME, false, 0))
  segments.push(createMoveSegment(upToHall, stairEntry, RETURN_STEP_TIME, false, 0))
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
  const floorMaterial = useRef()
  const cellMaterial = useRef()
  const lightRef = useRef()
  const cellOffset = stairDir * STAIR_DEPTH

  useFrame(() => {
    const open = openProgressRef.current || 0
    const angle = open * Math.PI * 0.5
    if (leftRef.current) leftRef.current.rotation.x = -angle
    if (rightRef.current) rightRef.current.rotation.x = angle
    if (floorMaterial.current) {
      floorMaterial.current.opacity = lerp(1, 0.02, open)
      floorMaterial.current.depthWrite = open < 0.2
      floorMaterial.current.depthTest = open < 0.2
    }
    if (cellMaterial.current) {
      cellMaterial.current.opacity = lerp(1, 0.15, open)
      cellMaterial.current.transparent = true
      cellMaterial.current.emissive = new THREE.Color('#2b2f3a')
      cellMaterial.current.emissiveIntensity = open * 0.45
    }
    if (lightRef.current) {
      lightRef.current.intensity = open * 1.1
    }
  })

  return (
    <group position={position}>
      <mesh receiveShadow position={[0, -0.05, 0]}>
        <boxGeometry args={[4, 0.12, 4]} />
        <meshStandardMaterial
          ref={floorMaterial}
          color="#3d2b1f"
          metalness={0.2}
          roughness={0.7}
          transparent
          opacity={1}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>
      <group>
        <mesh position={[0, -2.2, cellOffset]}>
          <boxGeometry args={[3.6, 3.2, 3.6]} />
          <meshStandardMaterial
            ref={cellMaterial}
            color="#141216"
            metalness={0.1}
            roughness={0.9}
            transparent
            opacity={1}
          />
        </mesh>
        {[-1, 1].map((x) =>
          [-1, 1].map((z) => (
            <mesh key={`bar-${x}-${z}`} position={[x * 1.4, -2, cellOffset + z * 1.4]} castShadow>
              <boxGeometry args={[0.12, 2.6, 0.12]} />
              <meshStandardMaterial color="#3b2a1a" metalness={0.6} roughness={0.4} />
            </mesh>
          ))
        )}
      </group>
      {Array.from({ length: STAIR_CONFIG.count }).map((_, index) => {
        const stepHeight = STAIR_CONFIG.startY + index * STAIR_CONFIG.stepY
        const stepDepth = STAIR_CONFIG.startZ + index * STAIR_CONFIG.stepZ
        return (
          <mesh
            key={`step-${index}`}
            position={[0, stepHeight, stairDir * stepDepth]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[2.2, 0.2, 0.7]} />
            <meshStandardMaterial color="#5a4a3b" metalness={0.18} roughness={0.75} />
          </mesh>
        )
      })}
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

export default function CaptureEscort({
  capture,
  onComplete,
  dungeonPositions = { w: [-10, 0, 0], b: [10, 0, 0] },
  paused = false,
  openProgressRef,
}) {
  const [prisonerPiece, setPrisonerPiece] = useState(null)
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

    if (pieceRef.current && prisonerPiece) {
      pieceRef.current.visible = true
      pieceRef.current.position.set(prisonerPos[0], prisonerPos[1], prisonerPos[2])
    }

    if (progress >= 1) {
      sequence.time = 0
      if (segment.type === 'throw') {
        sequence.prisonerFixed = segment.to
      }
      sequence.index += 1
    }

    if (openProgressRef?.current) {
      openProgressRef.current.w = whiteDoorProgress.current
      openProgressRef.current.b = blackDoorProgress.current
    }
  })

  return (
    <group>
      <DungeonEntrance position={dungeonPositions.w} openProgressRef={whiteDoorProgress} stairDir={1} />
      <DungeonEntrance position={dungeonPositions.b} openProgressRef={blackDoorProgress} stairDir={-1} />
      <group ref={whiteGuardRef}>
        <Character role="guard" />
      </group>
      <group ref={blackGuardRef}>
        <Character role="guard" />
      </group>
      {prisonerPiece && (
        <group ref={pieceRef}>
          <Piece piece={prisonerPiece} position={[0, 0, 0]} />
        </group>
      )}
    </group>
  )
}
