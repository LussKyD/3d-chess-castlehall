import React, { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import Character from './Character'
import Piece from './Piece'

const APPROACH_TIME = 0.7
const ESCORT_TIME = 1.4
const DROP_TIME = 0.7
const RETURN_TIME = 1.2
const TOTAL_TIME = APPROACH_TIME + ESCORT_TIME + DROP_TIME + RETURN_TIME

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

function Dungeon({ position, openProgressRef }) {
  const leftRef = useRef()
  const rightRef = useRef()

  useFrame(() => {
    const open = openProgressRef.current || 0
    const angle = open * Math.PI * 0.45
    if (leftRef.current) leftRef.current.rotation.x = -angle
    if (rightRef.current) rightRef.current.rotation.x = angle
  })

  return (
    <group position={position}>
      <mesh receiveShadow position={[0, -0.05, 0]}>
        <boxGeometry args={[4, 0.1, 4]} />
        <meshStandardMaterial color="#3d2b1f" metalness={0.2} roughness={0.7} />
      </mesh>
      <mesh position={[0, -1.3, 0]}>
        <boxGeometry args={[2.6, 2.6, 2.6]} />
        <meshStandardMaterial color="#121015" metalness={0.1} roughness={0.9} />
      </mesh>
      <group ref={leftRef} position={[-1.3, 0.05, 0]}>
        <mesh position={[0.65, 0, 0]} castShadow>
          <boxGeometry args={[1.3, 0.08, 2.6]} />
          <meshStandardMaterial color="#7a5b13" metalness={0.6} roughness={0.5} />
        </mesh>
      </group>
      <group ref={rightRef} position={[1.3, 0.05, 0]}>
        <mesh position={[-0.65, 0, 0]} castShadow>
          <boxGeometry args={[1.3, 0.08, 2.6]} />
          <meshStandardMaterial color="#7a5b13" metalness={0.6} roughness={0.5} />
        </mesh>
      </group>
    </group>
  )
}

export default function CaptureEscort({ capture, onComplete, dungeonPosition = [0, 0, -9] }) {
  const guardRef = useRef()
  const pieceRef = useRef()
  const startTime = useRef(null)
  const doorProgress = useRef(0)

  useEffect(() => {
    startTime.current = null
  }, [capture])

  useFrame(({ clock }) => {
    if (!capture || !guardRef.current || !pieceRef.current) return

    if (startTime.current === null) {
      startTime.current = clock.elapsedTime
    }

    const elapsed = clock.elapsedTime - startTime.current
    const t = Math.min(elapsed, TOTAL_TIME)
    const pieceStart = capture.position
    const startPos = [capture.position[0], 0, capture.position[2]]
    const homePos = [dungeonPosition[0] + 2.2, 0, dungeonPosition[2] + 2]

    let guardPos = homePos
    let piecePos = startPos
    let openProgress = 0

    if (t <= APPROACH_TIME) {
      const p = smoothstep(t / APPROACH_TIME)
      guardPos = lerpVec(homePos, startPos, p)
      piecePos = pieceStart
      openProgress = clamp((t - 0.2) / 0.6, 0, 1)
    } else if (t <= APPROACH_TIME + ESCORT_TIME) {
      const escortT = (t - APPROACH_TIME) / ESCORT_TIME
      const p = smoothstep(escortT)
      guardPos = lerpVec(startPos, dungeonPosition, p)
      piecePos = lerpVec(pieceStart, [dungeonPosition[0], 0.4, dungeonPosition[2]], p)
      openProgress = 1
    } else if (t <= APPROACH_TIME + ESCORT_TIME + DROP_TIME) {
      const dropT = (t - APPROACH_TIME - ESCORT_TIME) / DROP_TIME
      const p = smoothstep(dropT)
      guardPos = dungeonPosition
      piecePos = [dungeonPosition[0], lerp(0.4, -2.2, p), dungeonPosition[2]]
      openProgress = 1
    } else {
      const returnT = (t - APPROACH_TIME - ESCORT_TIME - DROP_TIME) / RETURN_TIME
      const p = smoothstep(returnT)
      guardPos = lerpVec(dungeonPosition, homePos, p)
      piecePos = [dungeonPosition[0], -2.2, dungeonPosition[2]]
      openProgress = 1 - p
    }

    doorProgress.current = openProgress
    guardRef.current.position.set(guardPos[0], guardPos[1], guardPos[2])
    guardRef.current.lookAt(0, 1, 0)
    pieceRef.current.position.set(piecePos[0], piecePos[1], piecePos[2])
    const hideAt = APPROACH_TIME + ESCORT_TIME + DROP_TIME * 0.9
    pieceRef.current.visible = t < hideAt

    if (elapsed >= TOTAL_TIME) {
      startTime.current = null
      if (onComplete) onComplete()
    }
  })

  if (!capture) return null

  return (
    <group>
      <Dungeon position={dungeonPosition} openProgressRef={doorProgress} />
      <group ref={guardRef}>
        <Character role="guard" position={[0, 0, 0]} />
      </group>
      <group ref={pieceRef}>
        <Piece piece={capture.piece} position={[0, 0, 0]} />
      </group>
    </group>
  )
}
