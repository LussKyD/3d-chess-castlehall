import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Character from './Character'
import Piece from './Piece'
import {
  STAIR_CONFIG,
  STAIR_DEPTH,
  PRISONER_OFFSET,
  DUNGEON_MODEL_CONFIG,
  CELL_BASE_Y,
  DUNGEON_VIEWPORT,
} from '../config/dungeon'

const APPROACH_TIME = 0.45
const GRAB_TIME = 0.25
const ESCORT_TIME = 0.9
const STEP_FORWARD_TIME = 0.12
const STEP_DOWN_TIME = 0.1
const TO_CELL_TIME = 0.2
const PUSH_TIME = 0.24
const THROW_TIME = 0.35
const GATE_SLAM_TIME = 0.22
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

function createMoveSegment(from, to, duration, carry, open, extras = {}) {
  return { type: 'move', from, to, duration, carry, open, ...extras }
}

function createThrowSegment(from, to, duration, open, arc = 0.6, extras = {}) {
  return { type: 'throw', from, to, duration, carry: false, open, arc, ...extras }
}

function buildSequence({ capture, dungeonPositions, homePositions }) {
  const side = capture.capturingColor || 'w'
  const stairDir = side === 'w' ? 1 : -1
  const dungeon = dungeonPositions[side]
  const start = [capture.position[0], 0, capture.position[2]]
  const home = homePositions[side]
  const stairEntry = [dungeon[0], 0, dungeon[2]]
  const steps = buildStairSteps()
  const segments = []

  segments.push(
    createMoveSegment(home, start, APPROACH_TIME, false, 0, {
      phase: 'approach',
      footstep: true,
    })
  )
  segments.push(createMoveSegment(start, start, GRAB_TIME, true, 0, { phase: 'grab' }))
  segments.push(
    createMoveSegment(start, stairEntry, ESCORT_TIME, true, 1, {
      phase: 'to-stairs',
      footstep: true,
    })
  )

  let current = stairEntry
  steps.forEach((step) => {
    const forward = [dungeon[0], current[1], dungeon[2] + stairDir * step.z]
    segments.push(
      createMoveSegment(current, forward, STEP_FORWARD_TIME, true, 1, {
        phase: 'stairs-forward',
        footstep: true,
        stumble: true,
      })
    )
    const down = [dungeon[0], step.y, forward[2]]
    segments.push(
      createMoveSegment(forward, down, STEP_DOWN_TIME, true, 1, {
        phase: 'stairs-down',
        footstep: true,
        stumble: true,
      })
    )
    current = down
  })

  const cellStand = [dungeon[0], current[1], dungeon[2] + stairDir * DUNGEON_MODEL_CONFIG.cell.offset]
  segments.push(
    createMoveSegment(current, cellStand, TO_CELL_TIME, true, 1, {
      phase: 'cell-approach',
      footstep: true,
    })
  )
  segments.push(createMoveSegment(cellStand, cellStand, PUSH_TIME, true, 1, { phase: 'push' }))

  const cellPrisoner = [cellStand[0], CELL_BASE_Y, cellStand[2] + stairDir * 0.4]
  segments.push(createThrowSegment(cellStand, cellPrisoner, THROW_TIME, 1, 0.66, { phase: 'throw' }))
  segments.push(
    createMoveSegment(cellStand, cellStand, GATE_SLAM_TIME, false, 1, {
      phase: 'gate-slam',
      gateSlam: true,
    })
  )

  let returnPos = cellStand
  segments.push(
    createMoveSegment(cellStand, current, 0.18, false, 1, {
      phase: 'leave-cell',
      footstep: true,
    })
  )

  for (let i = steps.length - 2; i >= 0; i -= 1) {
    const step = steps[i]
    const open = clamp((i + 1) / (steps.length - 1), 0, 1)
    const up = [returnPos[0], step.y, returnPos[2]]
    segments.push(
      createMoveSegment(returnPos, up, RETURN_STEP_TIME, false, open, {
        phase: 'return-up',
        footstep: true,
      })
    )
    const back = [dungeon[0], step.y, dungeon[2] + stairDir * step.z]
    segments.push(
      createMoveSegment(up, back, RETURN_STEP_TIME, false, open, {
        phase: 'return-back',
        footstep: true,
      })
    )
    returnPos = back
  }

  const upToHall = [returnPos[0], 0, returnPos[2]]
  segments.push(
    createMoveSegment(returnPos, upToHall, RETURN_STEP_TIME, false, 0.06, {
      phase: 'return-lift',
      footstep: true,
    })
  )
  segments.push(
    createMoveSegment(upToHall, stairEntry, RETURN_STEP_TIME, false, 0.03, {
      phase: 'return-door',
      footstep: true,
    })
  )
  segments.push(
    createMoveSegment(stairEntry, home, RETURN_HOME_TIME, false, 0, {
      phase: 'return-home',
      footstep: true,
    })
  )

  return {
    side,
    stairDir,
    steps,
    segments,
    index: 0,
    time: 0,
    open: 0,
    prisonerFixed: null,
    home,
  }
}

function DungeonEntrance({ position, openProgressRef, stairDir = 1 }) {
  const leftDoorRef = useRef()
  const rightDoorRef = useRef()
  const lightRef = useRef()
  const centerZ = stairDir * DUNGEON_VIEWPORT.forwardOffset

  useFrame(() => {
    const open = clamp(openProgressRef?.current || 0, 0, 1)
    const angle = open * Math.PI * 0.48
    if (leftDoorRef.current) leftDoorRef.current.rotation.x = -angle
    if (rightDoorRef.current) rightDoorRef.current.rotation.x = angle
    if (lightRef.current) {
      lightRef.current.intensity = 0.15 + open * 1.45
      lightRef.current.distance = 7 + open * 9
    }
  })

  return (
    <group position={position}>
      <mesh receiveShadow position={[0, 0.025, centerZ]}>
        <boxGeometry args={[3.8, 0.06, 3.3]} />
        <meshStandardMaterial color="#6a5729" metalness={0.6} roughness={0.5} />
      </mesh>
      <group ref={leftDoorRef} position={[-0.95, 0.08, centerZ]}>
        <mesh castShadow position={[0.95, 0, 0]}>
          <boxGeometry args={[1.9, 0.08, 3]} />
          <meshStandardMaterial color="#8a6b2f" metalness={0.7} roughness={0.45} />
        </mesh>
      </group>
      <group ref={rightDoorRef} position={[0.95, 0.08, centerZ]}>
        <mesh castShadow position={[-0.95, 0, 0]}>
          <boxGeometry args={[1.9, 0.08, 3]} />
          <meshStandardMaterial color="#8a6b2f" metalness={0.7} roughness={0.45} />
        </mesh>
      </group>
      <pointLight
        ref={lightRef}
        position={[0, -1.35, centerZ + stairDir * 0.42]}
        intensity={0.15}
        color="#8fa5ff"
        distance={7}
        decay={1.8}
      />
    </group>
  )
}

function DungeonChamber({ position, stairDir = 1, openProgressRef, gateProgressRef }) {
  const stairLightRef = useRef()
  const cellLightRef = useRef()
  const fillLightRef = useRef()
  const topLightRef = useRef()
  const leftWallRef = useRef()
  const rightWallRef = useRef()
  const backWallRef = useRef()
  const gateRef = useRef()
  const chamberWidth = DUNGEON_VIEWPORT.width - 0.3
  const chamberStartZ = -1.25
  const chamberEndZ = chamberStartZ + DUNGEON_VIEWPORT.depth
  const chamberDepth = chamberEndZ - chamberStartZ
  const chamberCenterZ = (chamberStartZ + chamberEndZ) / 2
  const floorY = -3.75
  const wallTopY = -0.22
  const wallHeight = wallTopY - floorY
  const wallY = floorY + wallHeight / 2
  const wallThickness = 0.26
  const cell = DUNGEON_MODEL_CONFIG.cell
  const lastStepY = STAIR_CONFIG.startY + (STAIR_CONFIG.count - 1) * STAIR_CONFIG.stepY
  const floorMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#44566b', metalness: 0.1, roughness: 0.9 }),
    []
  )
  const wallMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#60768f',
        emissive: '#2f3d5c',
        emissiveIntensity: 0.08,
        metalness: 0.08,
        roughness: 0.86,
        transparent: true,
        opacity: 0.96,
      }),
    []
  )
  const stepMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#6b7f95',
        emissive: '#2d3650',
        emissiveIntensity: 0.06,
        metalness: 0.08,
        roughness: 0.9,
      }),
    []
  )
  const cellMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#546a84',
        emissive: '#28324a',
        emissiveIntensity: 0.1,
        metalness: 0.1,
        roughness: 0.86,
        transparent: true,
        opacity: 0.95,
      }),
    []
  )
  const barMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#8d7b53',
        emissive: '#4a3b1d',
        emissiveIntensity: 0.12,
        metalness: 0.62,
        roughness: 0.45,
      }),
    []
  )

  useEffect(() => {
    return () => {
      floorMaterial.dispose()
      wallMaterial.dispose()
      stepMaterial.dispose()
      cellMaterial.dispose()
      barMaterial.dispose()
    }
  }, [floorMaterial, wallMaterial, stepMaterial, cellMaterial, barMaterial])

  useFrame(() => {
    const open = clamp(openProgressRef?.current || 0, 0, 1)
    const gateClosed = clamp(gateProgressRef?.current ?? 1, 0, 1)
    const cutaway = open > 0.18
    ;[leftWallRef.current, rightWallRef.current, backWallRef.current].forEach((mesh) => {
      if (mesh) mesh.visible = !cutaway
    })
    if (gateRef.current) {
      gateRef.current.position.y =
        lastStepY + cell.height / 2 - 1.1 + lerp(cell.height * 0.72, 0, gateClosed)
    }

    if (stairLightRef.current) {
      stairLightRef.current.intensity = 0.55 + open * 1.7
      stairLightRef.current.distance = 8 + open * 9
    }
    if (cellLightRef.current) {
      cellLightRef.current.intensity = 0.55 + open * 2.25
      cellLightRef.current.distance = 9 + open * 10
    }
    if (fillLightRef.current) {
      fillLightRef.current.intensity = 0.25 + open * 0.95
      fillLightRef.current.distance = 10 + open * 10
    }
    if (topLightRef.current) {
      topLightRef.current.intensity = 0.35 + open * 1.1
      topLightRef.current.distance = 9 + open * 8
    }
    wallMaterial.opacity = lerp(0.35, 0.06, open)
    wallMaterial.depthWrite = open < 0.05
    wallMaterial.emissiveIntensity = 0.08 + open * 0.34
    cellMaterial.opacity = lerp(0.35, 0.08, open)
    cellMaterial.depthWrite = open < 0.05
    cellMaterial.emissiveIntensity = 0.1 + open * 0.34
    stepMaterial.emissiveIntensity = 0.06 + open * 0.2
    barMaterial.emissiveIntensity = 0.12 + open * 0.28
  })

  return (
    <group position={position} rotation={stairDir === 1 ? [0, 0, 0] : [0, Math.PI, 0]}>
      <mesh receiveShadow position={[0, floorY, chamberCenterZ]} material={floorMaterial}>
        <boxGeometry args={[chamberWidth, 0.2, chamberDepth]} />
      </mesh>
      <mesh
        ref={leftWallRef}
        receiveShadow
        position={[-chamberWidth / 2 + wallThickness / 2, wallY, chamberCenterZ]}
        material={wallMaterial}
      >
        <boxGeometry args={[wallThickness, wallHeight, chamberDepth]} />
      </mesh>
      <mesh
        ref={rightWallRef}
        receiveShadow
        position={[chamberWidth / 2 - wallThickness / 2, wallY, chamberCenterZ]}
        material={wallMaterial}
      >
        <boxGeometry args={[wallThickness, wallHeight, chamberDepth]} />
      </mesh>
      <mesh
        ref={backWallRef}
        receiveShadow
        position={[0, wallY, chamberEndZ - wallThickness / 2]}
        material={wallMaterial}
      >
        <boxGeometry args={[chamberWidth, wallHeight, wallThickness]} />
      </mesh>

      {Array.from({ length: STAIR_CONFIG.count }).map((_, i) => {
        const stepY = STAIR_CONFIG.startY + i * STAIR_CONFIG.stepY
        const stepZ = STAIR_CONFIG.startZ + i * STAIR_CONFIG.stepZ
        return (
          <mesh
            key={`step-${i}`}
            receiveShadow
            castShadow
            position={[0, stepY - 0.1, stepZ]}
            material={stepMaterial}
          >
            <boxGeometry args={[2.4, 0.2, 0.72]} />
          </mesh>
        )
      })}

      <mesh receiveShadow position={[0, CELL_BASE_Y, cell.offset]} material={floorMaterial}>
        <boxGeometry args={[cell.width, 0.16, cell.depth]} />
      </mesh>
      <mesh
        receiveShadow
        position={[0, lastStepY + cell.height / 2 - 1.1, cell.offset + cell.depth / 2]}
        material={cellMaterial}
      >
        <boxGeometry args={[cell.width, cell.height, wallThickness]} />
      </mesh>
      <mesh
        receiveShadow
        position={[-cell.width / 2, lastStepY + cell.height / 2 - 1.1, cell.offset]}
        material={cellMaterial}
      >
        <boxGeometry args={[wallThickness, cell.height, cell.depth]} />
      </mesh>
      <mesh
        receiveShadow
        position={[cell.width / 2, lastStepY + cell.height / 2 - 1.1, cell.offset]}
        material={cellMaterial}
      >
        <boxGeometry args={[wallThickness, cell.height, cell.depth]} />
      </mesh>

      <group ref={gateRef} position={[0, lastStepY + cell.height / 2 - 1.1, cell.offset - cell.depth / 2]}>
        {Array.from({ length: 5 }).map((_, i) => {
          const x = -cell.width / 2 + (i + 1) * (cell.width / 6)
          return (
            <mesh key={`gate-moving-bar-${i}`} castShadow position={[x, 0, 0]} material={barMaterial}>
              <boxGeometry args={[0.1, cell.height * 0.9, 0.1]} />
            </mesh>
          )
        })}
        <mesh castShadow position={[0, cell.height * 0.45, 0]} material={barMaterial}>
          <boxGeometry args={[cell.width, 0.12, 0.12]} />
        </mesh>
        <mesh castShadow position={[0, -cell.height * 0.45, 0]} material={barMaterial}>
          <boxGeometry args={[cell.width, 0.12, 0.12]} />
        </mesh>
      </group>

      <pointLight
        ref={stairLightRef}
        position={[0, -1.25, STAIR_DEPTH * 0.45]}
        color="#9db4ff"
        intensity={0.55}
        distance={8}
        decay={1.7}
      />
      <pointLight
        ref={cellLightRef}
        position={[0, CELL_BASE_Y + 0.85, cell.offset + 0.2]}
        color="#ffb347"
        intensity={0.55}
        distance={9}
        decay={1.6}
      />
      <pointLight
        ref={fillLightRef}
        position={[0, -0.9, chamberCenterZ]}
        color="#8aa0c9"
        intensity={0.25}
        distance={10}
        decay={2}
      />
      <pointLight
        ref={topLightRef}
        position={[0, 0.8, chamberCenterZ]}
        color="#d8e4ff"
        intensity={0.35}
        distance={9}
        decay={2}
      />
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
  const [capturedPieces, setCapturedPieces] = useState({ w: [], b: [] })
  const whiteEscortRef = useRef()
  const blackEscortRef = useRef()
  const whiteSentinelRef = useRef()
  const blackSentinelRef = useRef()
  const pieceRef = useRef()
  const sequenceRef = useRef(null)
  const whiteDoorProgress = useRef(0)
  const blackDoorProgress = useRef(0)
  const whiteGateProgress = useRef(1)
  const blackGateProgress = useRef(1)
  const prevSegmentRef = useRef({ side: null, index: -1 })
  const audioContextRef = useRef(null)

  const homePositions = useMemo(
    () => {
      const toBoard = (from) => {
        const dx = -from[0]
        const dz = -from[2]
        const len = Math.hypot(dx, dz) || 1
        return [dx / len, dz / len]
      }
      const [wx, wz] = toBoard(dungeonPositions.w)
      const [bx, bz] = toBoard(dungeonPositions.b)
      return {
        w: [dungeonPositions.w[0] + wx * 5.4, 0, dungeonPositions.w[2] + wz * 5.4],
        b: [dungeonPositions.b[0] + bx * 5.4, 0, dungeonPositions.b[2] + bz * 5.4],
      }
    },
    [dungeonPositions.b, dungeonPositions.w]
  )

  const sentinelPositions = useMemo(
    () => ({
      w: [dungeonPositions.w[0] - 2.15, 0, dungeonPositions.w[2] + DUNGEON_VIEWPORT.forwardOffset - 1],
      b: [dungeonPositions.b[0] + 2.15, 0, dungeonPositions.b[2] - DUNGEON_VIEWPORT.forwardOffset + 1],
    }),
    [dungeonPositions.b, dungeonPositions.w]
  )

  useEffect(() => {
    if (!capture) return
    setPrisonerPiece(capture.piece)
    sequenceRef.current = buildSequence({ capture, dungeonPositions, homePositions })
    prevSegmentRef.current = { side: null, index: -1 }
  }, [capture, dungeonPositions, homePositions])

  function ensureAudioContext() {
    if (typeof window === 'undefined') return null
    if (!audioContextRef.current) {
      const Context = window.AudioContext || window.webkitAudioContext
      if (!Context) return null
      audioContextRef.current = new Context()
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {})
    }
    return audioContextRef.current
  }

  function playFootstep(volume = 0.05) {
    const context = ensureAudioContext()
    if (!context) return
    const now = context.currentTime
    const osc = context.createOscillator()
    const gain = context.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(120, now)
    osc.frequency.exponentialRampToValueAtTime(64, now + 0.1)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14)
    osc.connect(gain)
    gain.connect(context.destination)
    osc.start(now)
    osc.stop(now + 0.15)
  }

  function playGateSlam() {
    const context = ensureAudioContext()
    if (!context) return
    const now = context.currentTime
    const osc = context.createOscillator()
    const gain = context.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(180, now)
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.16)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.16, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24)
    osc.connect(gain)
    gain.connect(context.destination)
    osc.start(now)
    osc.stop(now + 0.25)
  }

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

  useFrame((state, delta) => {
    if (paused) return

    const escorts = {
      w: whiteEscortRef.current,
      b: blackEscortRef.current,
    }
    const sentinels = {
      w: whiteSentinelRef.current,
      b: blackSentinelRef.current,
    }

    if (!escorts.w || !escorts.b || !sentinels.w || !sentinels.b) return

    escorts.w.visible = true
    escorts.b.visible = true
    escorts.w.position.set(homePositions.w[0], homePositions.w[1], homePositions.w[2])
    escorts.b.position.set(homePositions.b[0], homePositions.b[1], homePositions.b[2])
    escorts.w.lookAt(0, 1, 0)
    escorts.b.lookAt(0, 1, 0)
    sentinels.w.visible = true
    sentinels.b.visible = true
    sentinels.w.position.set(sentinelPositions.w[0], sentinelPositions.w[1], sentinelPositions.w[2])
    sentinels.b.position.set(sentinelPositions.b[0], sentinelPositions.b[1], sentinelPositions.b[2])
    sentinels.w.lookAt(0, 1, 0)
    sentinels.b.lookAt(0, 1, 0)

    whiteDoorProgress.current = lerp(whiteDoorProgress.current, 0, 0.24)
    blackDoorProgress.current = lerp(blackDoorProgress.current, 0, 0.24)
    whiteGateProgress.current = lerp(whiteGateProgress.current, 1, 0.2)
    blackGateProgress.current = lerp(blackGateProgress.current, 1, 0.2)

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

    if (
      prevSegmentRef.current.side !== sequence.side ||
      prevSegmentRef.current.index !== sequence.index
    ) {
      if (segment.footstep) {
        playFootstep(segment.stumble ? 0.065 : 0.05)
      }
      if (segment.gateSlam) {
        playGateSlam()
      }
      prevSegmentRef.current = { side: sequence.side, index: sequence.index }
    }

    sequence.time += delta
    const progress = clamp(sequence.time / segment.duration, 0, 1)
    const eased = smoothstep(progress)

    const guardPos = lerpVec(segment.from, segment.to, eased)
    let prisonerPos = guardPos

    if (segment.carry) {
      const wobble = segment.stumble ? Math.sin(state.clock.elapsedTime * 18) * 0.05 : 0
      const bounce = segment.stumble ? Math.abs(Math.sin(state.clock.elapsedTime * 13)) * 0.05 : 0
      prisonerPos = [
        guardPos[0] + PRISONER_OFFSET[0] + wobble,
        guardPos[1] + PRISONER_OFFSET[1] + bounce,
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

    const activeGuard = sequence.side === 'w' ? escorts.w : escorts.b
    activeGuard.visible = true
    activeGuard.position.set(guardPos[0], guardPos[1], guardPos[2])
    const moveX = segment.to[0] - segment.from[0]
    const moveZ = segment.to[2] - segment.from[2]
    if (Math.abs(moveX) + Math.abs(moveZ) > 0.001) {
      activeGuard.lookAt(segment.to[0], guardPos[1] + 0.35, segment.to[2])
    } else {
      activeGuard.lookAt(0, 1, 0)
    }

    sequence.open = lerp(sequence.open, segment.open, 0.2)
    if (sequence.side === 'w') {
      whiteDoorProgress.current = sequence.open
      if (segment.phase === 'push' || segment.phase === 'throw') {
        whiteGateProgress.current = lerp(whiteGateProgress.current, 0, 0.26)
      } else if (segment.phase === 'gate-slam') {
        whiteGateProgress.current = lerp(whiteGateProgress.current, 1, 0.42)
      } else {
        whiteGateProgress.current = lerp(whiteGateProgress.current, 1, 0.08)
      }
    } else {
      blackDoorProgress.current = sequence.open
      if (segment.phase === 'push' || segment.phase === 'throw') {
        blackGateProgress.current = lerp(blackGateProgress.current, 0, 0.26)
      } else if (segment.phase === 'gate-slam') {
        blackGateProgress.current = lerp(blackGateProgress.current, 1, 0.42)
      } else {
        blackGateProgress.current = lerp(blackGateProgress.current, 1, 0.08)
      }
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
      <DungeonChamber
        position={dungeonPositions.w}
        stairDir={1}
        openProgressRef={whiteDoorProgress}
        gateProgressRef={whiteGateProgress}
      />
      <DungeonChamber
        position={dungeonPositions.b}
        stairDir={-1}
        openProgressRef={blackDoorProgress}
        gateProgressRef={blackGateProgress}
      />
      <DungeonEntrance
        position={dungeonPositions.w}
        openProgressRef={whiteDoorProgress}
        stairDir={1}
      />
      <DungeonEntrance
        position={dungeonPositions.b}
        openProgressRef={blackDoorProgress}
        stairDir={-1}
      />
      <group ref={whiteEscortRef}>
        <Character role="guard" />
      </group>
      <group ref={blackEscortRef}>
        <Character role="guard" />
      </group>
      <group ref={whiteSentinelRef}>
        <Character role="guard" />
      </group>
      <group ref={blackSentinelRef}>
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
