import React, { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import Character from './Character'
import Piece from './Piece'
import * as THREE from 'three'

const APPROACH_TIME = 0.6
const ESCORT_TIME = 1.2
const DROP_TIME = 0.9
const RETURN_TIME = 1.1
const TOTAL_TIME = APPROACH_TIME + ESCORT_TIME + DROP_TIME + RETURN_TIME
const STAIR_DEPTH = 6
const CAMERA_BLEND = 0.08

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

function DungeonEntrance({ position, openProgressRef, stairDir = 1, accent = '#7a5b13' }) {
  const leftRef = useRef()
  const rightRef = useRef()
  const floorMaterial = useRef()
  const cellMaterial = useRef()
  const lightRef = useRef()

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
        />
      </mesh>
      <group>
        <mesh position={[0, -1.4, 0]}>
          <boxGeometry args={[2.8, 2.6, 2.8]} />
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
            <mesh key={`bar-${x}-${z}`} position={[x * 1.1, -1.2, z * 1.1]} castShadow>
              <boxGeometry args={[0.12, 2.2, 0.12]} />
              <meshStandardMaterial color="#3b2a1a" metalness={0.6} roughness={0.4} />
            </mesh>
          ))
        )}
      </group>
      {Array.from({ length: 10 }).map((_, index) => {
        const stepHeight = -0.2 - index * 0.25
        const stepDepth = 0.6 + index * 0.6
        return (
          <mesh
            key={`step-${index}`}
            position={[0, stepHeight, stairDir * stepDepth]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[2, 0.2, 0.65]} />
            <meshStandardMaterial color="#4b3b2f" metalness={0.18} roughness={0.75} />
          </mesh>
        )
      })}
      <pointLight ref={lightRef} position={[0, -1.5, 0]} intensity={0} color="#b39ddb" />
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
}) {
  const { camera } = useThree()
  const whiteGuardRef = useRef()
  const blackGuardRef = useRef()
  const pieceRef = useRef()
  const startTime = useRef(null)
  const cameraMemory = useRef(null)
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
    startTime.current = null
  }, [capture])

  useFrame(({ clock }) => {
    if (paused) return
    const hasCapture = Boolean(capture)
    if (hasCapture && camera) {
      if (!cameraMemory.current) {
        const direction = new THREE.Vector3()
        camera.getWorldDirection(direction)
        cameraMemory.current = {
          pos: camera.position.clone(),
          target: camera.position.clone().add(direction.multiplyScalar(10)),
        }
      }
      const side = capture.capturingColor || 'w'
      const stairDir = side === 'w' ? 1 : -1
      const dungeonPosition = dungeonPositions[side]
      const viewTarget = new THREE.Vector3(
        dungeonPosition[0],
        -1.8,
        dungeonPosition[2] + stairDir * 3
      )
      const viewPos = new THREE.Vector3(
        dungeonPosition[0] + stairDir * 4.2,
        22,
        dungeonPosition[2] + stairDir * 8
      )
      camera.position.lerp(viewPos, CAMERA_BLEND)
      camera.lookAt(viewTarget)
    } else if (cameraMemory.current && camera) {
      camera.position.lerp(cameraMemory.current.pos, CAMERA_BLEND)
      camera.lookAt(cameraMemory.current.target)
      if (camera.position.distanceTo(cameraMemory.current.pos) < 0.2) {
        cameraMemory.current = null
      }
    }

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

    if (!capture || !pieceRef.current) return

    if (startTime.current === null) {
      startTime.current = clock.elapsedTime
    }

    const elapsed = clock.elapsedTime - startTime.current
    const t = Math.min(elapsed, TOTAL_TIME)
    const side = capture.capturingColor || 'w'
    const stairDir = side === 'w' ? 1 : -1
    const dungeonPosition = dungeonPositions[side]
    const homePos = homePositions[side]
    const pieceStart = capture.position
    const startPos = [capture.position[0], 0, capture.position[2]]
    const stairOffset = stairDir * STAIR_DEPTH

    let guardPos = homePos
    let guardYOffset = 0
    let piecePos = pieceStart
    let openProgress = 0

    if (t <= APPROACH_TIME) {
      const p = smoothstep(t / APPROACH_TIME)
      guardPos = lerpVec(homePos, startPos, p)
      piecePos = pieceStart
      openProgress = clamp((t - 0.1) / 0.5, 0, 1)
    } else if (t <= APPROACH_TIME + ESCORT_TIME) {
      const escortT = (t - APPROACH_TIME) / ESCORT_TIME
      const p = smoothstep(escortT)
      guardPos = lerpVec(startPos, dungeonPosition, p)
      piecePos = lerpVec(pieceStart, [dungeonPosition[0], 0.4, dungeonPosition[2]], p)
      openProgress = 1
    } else if (t <= APPROACH_TIME + ESCORT_TIME + DROP_TIME) {
      const dropT = (t - APPROACH_TIME - ESCORT_TIME) / DROP_TIME
      const p = smoothstep(dropT)
      guardPos = [dungeonPosition[0], dungeonPosition[1], dungeonPosition[2] + stairOffset]
      guardYOffset = lerp(0, -1.6, p)
      piecePos = [
        dungeonPosition[0],
        lerp(0.4, -3.2, p),
        dungeonPosition[2] + stairOffset,
      ]
      openProgress = 1
    } else {
      const returnT = (t - APPROACH_TIME - ESCORT_TIME - DROP_TIME) / RETURN_TIME
      const p = smoothstep(returnT)
      const returnStart = [dungeonPosition[0], dungeonPosition[1], dungeonPosition[2] + stairOffset]
      guardPos = lerpVec(returnStart, homePos, p)
      guardYOffset = lerp(-1.6, 0, p)
      piecePos = [dungeonPosition[0], -3.2, dungeonPosition[2] + stairOffset]
      openProgress = 1 - p
    }

    const activeGuard = side === 'w' ? guards.w : guards.b
    activeGuard.position.set(guardPos[0], guardPos[1] + guardYOffset, guardPos[2])
    activeGuard.lookAt(0, 1, 0)
    if (side === 'w') {
      whiteDoorProgress.current = openProgress
    } else {
      blackDoorProgress.current = openProgress
    }

    pieceRef.current.position.set(piecePos[0], piecePos[1], piecePos[2])
    const hideAt = APPROACH_TIME + ESCORT_TIME + DROP_TIME
    const pieceVisible = t <= hideAt || openProgress > 0.15
    pieceRef.current.visible = pieceVisible

    if (elapsed >= TOTAL_TIME) {
      startTime.current = null
      if (onComplete) onComplete()
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
      {capture && (
        <group ref={pieceRef}>
          <Piece piece={capture.piece} position={[0, 0, 0]} />
        </group>
      )}
    </group>
  )
}
