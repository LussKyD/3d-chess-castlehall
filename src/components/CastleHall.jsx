// src/components/CastleHall.jsx
import React, { useMemo, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Board from './Board'
import Character from './Character'
import CaptureEscort from './CaptureEscort'

const INTRO_DURATION = 16
const FRONT_DOOR_Z = -34.6
const BACK_DOOR_Z = 34.6
const KING_THRONE_POS = [10, 0, 0]
const QUEEN_THRONE_POS = [-10, 0, 0]
const KING_THRONE_ROTATION = [0, -Math.PI / 2, 0]
const QUEEN_THRONE_ROTATION = [0, Math.PI / 2, 0]
const DUNGEON_OFFSET_Z = 7.5
const DUNGEON_POSITIONS = {
  w: [QUEEN_THRONE_POS[0], 0, DUNGEON_OFFSET_Z],
  b: [KING_THRONE_POS[0], 0, -DUNGEON_OFFSET_Z],
}

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

function interpolateKeyframes(frames, t) {
  if (t <= frames[0].t) return frames[0].pos
  for (let i = 0; i < frames.length - 1; i += 1) {
    const a = frames[i]
    const b = frames[i + 1]
    if (t <= b.t) {
      const segmentT = (t - a.t) / (b.t - a.t)
      const eased = smoothstep(segmentT)
      return lerpVec(a.pos, b.pos, eased)
    }
  }
  return frames[frames.length - 1].pos
}

function IntroTimeline({ timeRef, duration, skipped, onDone }) {
  const doneRef = useRef(false)

  useFrame((_, delta) => {
    if (doneRef.current) return
    if (skipped) {
      timeRef.current = duration
      doneRef.current = true
      if (onDone) onDone()
      return
    }
    timeRef.current = Math.min(timeRef.current + delta, duration)
    if (timeRef.current >= duration) {
      doneRef.current = true
      if (onDone) onDone()
    }
  })

  return null
}

function CinematicCamera({ timeRef, duration, active }) {
  const { camera } = useThree()
  const frames = useMemo(
    () => [
      { t: 0, pos: [32, 18, 0] },
      { t: 5, pos: [26, 17, 8] },
      { t: 10, pos: [20, 16, 16] },
      { t: duration, pos: [18, 14, 18] },
    ],
    [duration]
  )

  useFrame(() => {
    if (!active) return
    const t = Math.min(timeRef.current, duration)
    const pos = interpolateKeyframes(frames, t)
    camera.position.set(pos[0], pos[1], pos[2])
    camera.lookAt(0, 5, 0)
  })

  return null
}

function Torch({ position, color = '#ffb347', intensity = 1.6 }) {
  const light = useRef()
  useFrame(({ clock }) => {
    if (light.current) {
      const t = clock.elapsedTime
      light.current.intensity = intensity + Math.sin(t * 8 + position[0]) * 0.25
    }
  })
  return (
    <pointLight
      ref={light}
      position={position}
      color={color}
      intensity={intensity}
      distance={8}
      castShadow
    />
  )
}

function Crown({ position }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <torusGeometry args={[0.45, 0.1, 16, 32]} />
        <meshStandardMaterial color="#ffd700" metalness={1} roughness={0.08} />
      </mesh>
      <mesh position={[0, 0.32, 0]} castShadow>
        <coneGeometry args={[0.11, 0.32, 10]} />
        <meshStandardMaterial color="#fff7c0" metalness={0.92} roughness={0.18} />
      </mesh>
    </group>
  )
}

function Throne({ position, rotation = [0, 0, 0], color = '#ffd700', scale = 1 }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh castShadow>
        <boxGeometry args={[1.8, 0.5, 1.8]} />
        <meshStandardMaterial color={color} metalness={0.95} roughness={0.18} />
      </mesh>
      <mesh position={[0, 1.2, -0.5]} castShadow>
        <boxGeometry args={[1.4, 2.4, 0.6]} />
        <meshStandardMaterial color={color} metalness={0.95} roughness={0.2} />
      </mesh>
      <Crown position={[0, 2.2, -0.3]} />
    </group>
  )
}

/* Decorative framed paintings */
function Painting({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial color="#cdbd8c" />
      </mesh>
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[6.2, 4.2, 0.1]} />
        <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  )
}

function Door({ position, rotation = [0, 0, 0], timeRef }) {
  const leftPanel = useRef()
  const rightPanel = useRef()

  useFrame(() => {
    const t = timeRef.current
    const openProgress = clamp((t - 0.5) / 1.8, 0, 1)
    const closeProgress = clamp((t - 12) / 2, 0, 1)
    const open = openProgress * (1 - closeProgress)
    const angle = open * Math.PI * 0.52
    if (leftPanel.current) leftPanel.current.rotation.y = angle
    if (rightPanel.current) rightPanel.current.rotation.y = -angle
  })

  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[10, 12, 1]} />
        <meshStandardMaterial color="#d6af45" metalness={0.95} roughness={0.2} />
      </mesh>
      <group ref={leftPanel} position={[-5, 0, 0.55]}>
        <mesh position={[2.3, 0, 0]}>
          <boxGeometry args={[4.6, 10.6, 0.2]} />
          <meshStandardMaterial color="#b89028" metalness={0.85} roughness={0.3} />
        </mesh>
        <mesh position={[3.7, 0, 0.35]}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#fff6d5" metalness={1} roughness={0.15} />
        </mesh>
      </group>
      <group ref={rightPanel} position={[5, 0, 0.55]}>
        <mesh position={[-2.3, 0, 0]}>
          <boxGeometry args={[4.6, 10.6, 0.2]} />
          <meshStandardMaterial color="#b89028" metalness={0.85} roughness={0.3} />
        </mesh>
        <mesh position={[-3.7, 0, 0.35]}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#fff6d5" metalness={1} roughness={0.15} />
        </mesh>
      </group>
      <mesh position={[0, -1.5, 0.95]}>
        <boxGeometry args={[0.4, 0.6, 0.08]} />
        <meshStandardMaterial color="#7a5b13" metalness={0.6} roughness={0.5} />
      </mesh>
    </group>
  )
}

function RoyalProcession({ timeRef, duration, kingSeat, queenSeat }) {
  const kingRef = useRef()
  const queenRef = useRef()
  const seatYOffset = 0.2
  const kingDirection = [-1, 0, 0]
  const queenDirection = [1, 0, 0]
  const kingTarget = [
    kingSeat[0] + kingDirection[0] * 0.6,
    kingSeat[1] + seatYOffset,
    kingSeat[2] + kingDirection[2] * 0.6,
  ]
  const queenTarget = [
    queenSeat[0] + queenDirection[0] * 0.6,
    queenSeat[1] + seatYOffset,
    queenSeat[2] + queenDirection[2] * 0.6,
  ]
  const kingFrames = useMemo(
    () => [
      { t: 0, pos: [0, 0, BACK_DOOR_Z + 4] },
      { t: 2.5, pos: [8, 0, BACK_DOOR_Z - 6] },
      { t: 7, pos: [12, 0, 12] },
      { t: 10.5, pos: [kingTarget[0], kingTarget[1], kingTarget[2] + 4] },
      { t: 12.5, pos: kingTarget },
      { t: duration, pos: kingTarget },
    ],
    [duration, kingTarget]
  )
  const queenFrames = useMemo(
    () => [
      { t: 0, pos: [0, 0, FRONT_DOOR_Z - 4] },
      { t: 2.5, pos: [-8, 0, FRONT_DOOR_Z + 6] },
      { t: 7, pos: [-12, 0, -12] },
      { t: 10.5, pos: [queenTarget[0], queenTarget[1], queenTarget[2] - 4] },
      { t: 12.5, pos: queenTarget },
      { t: duration, pos: queenTarget },
    ],
    [duration, queenTarget]
  )

  useFrame(() => {
    const t = Math.min(timeRef.current, duration)
    const kingPos = interpolateKeyframes(kingFrames, t)
    const queenPos = interpolateKeyframes(queenFrames, t)
    if (kingRef.current) {
      kingRef.current.position.set(kingPos[0], kingPos[1], kingPos[2])
      kingRef.current.lookAt(0, 1, 0)
    }
    if (queenRef.current) {
      queenRef.current.position.set(queenPos[0], queenPos[1], queenPos[2])
      queenRef.current.lookAt(0, 1, 0)
    }
  })

  return (
    <group>
      <group ref={queenRef}>
        <Character role="queen" position={[0, 0, 0]} />
      </group>
      <group ref={kingRef}>
        <Character role="king" position={[0, 0, 0]} />
      </group>
    </group>
  )
}

function GuardFormation({ timeRef, duration, kingSeat, queenSeat }) {
  const guardRefs = useRef([])
  const guardConfigs = useMemo(() => {
    const queenDoorZ = FRONT_DOOR_Z + 2
    const kingDoorZ = BACK_DOOR_Z - 2
    const queenStandby = [
      [queenSeat[0] - 4, 0, queenSeat[2] - 3],
      [queenSeat[0] - 4, 0, queenSeat[2] + 3],
      [queenSeat[0] - 1.5, 0, queenSeat[2] - 4],
      [queenSeat[0] - 1.5, 0, queenSeat[2] + 4],
    ]
    const kingStandby = [
      [kingSeat[0] + 4, 0, kingSeat[2] - 3],
      [kingSeat[0] + 4, 0, kingSeat[2] + 3],
      [kingSeat[0] + 1.5, 0, kingSeat[2] - 4],
      [kingSeat[0] + 1.5, 0, kingSeat[2] + 4],
    ]

    const buildGuard = (id, start, sweep, standby, returnToDoor = false) => {
      const frames = [
        { t: 0, pos: start },
        { t: 3, pos: sweep },
        { t: 8, pos: standby },
      ]
      if (returnToDoor) {
        frames.push({ t: 12, pos: start })
        frames.push({ t: duration, pos: start })
      } else {
        frames.push({ t: duration, pos: standby })
      }
      return { id, frames }
    }

    const queenOffsets = [-16, -14, -12, -10, -18]
    const kingOffsets = [16, 14, 12, 10, 18]

    const queenGuards = [
      buildGuard('q1', [queenOffsets[0], 0, queenDoorZ], [-18, 0, -18], queenStandby[0]),
      buildGuard('q2', [queenOffsets[1], 0, queenDoorZ], [-16, 0, -14], queenStandby[1]),
      buildGuard('q3', [queenOffsets[2], 0, queenDoorZ], [-14, 0, -10], queenStandby[2]),
      buildGuard('q4', [queenOffsets[3], 0, queenDoorZ], [-12, 0, -8], queenStandby[3]),
      buildGuard('q5', [queenOffsets[4], 0, queenDoorZ], [-10, 0, -12], queenStandby[1], true),
    ]

    const kingGuards = [
      buildGuard('k1', [kingOffsets[0], 0, kingDoorZ], [18, 0, 18], kingStandby[0]),
      buildGuard('k2', [kingOffsets[1], 0, kingDoorZ], [16, 0, 14], kingStandby[1]),
      buildGuard('k3', [kingOffsets[2], 0, kingDoorZ], [14, 0, 10], kingStandby[2]),
      buildGuard('k4', [kingOffsets[3], 0, kingDoorZ], [12, 0, 8], kingStandby[3]),
      buildGuard('k5', [kingOffsets[4], 0, kingDoorZ], [10, 0, 12], kingStandby[0], true),
    ]

    return [...queenGuards, ...kingGuards]
  }, [duration, kingSeat, queenSeat])

  useFrame(() => {
    const t = Math.min(timeRef.current, duration)
    guardConfigs.forEach((guard, index) => {
      const ref = guardRefs.current[index]
      if (!ref) return
      const pos = interpolateKeyframes(guard.frames, t)
      ref.position.set(pos[0], pos[1], pos[2])
      ref.lookAt(0, 1, 0)
      ref.visible = true
    })
  })

  return (
    <group>
      {guardConfigs.map((guard, index) => (
        <group key={guard.id} ref={(el) => (guardRefs.current[index] = el)}>
          <Character role="guard" position={[0, 0, 0]} />
        </group>
      ))}
    </group>
  )
}

export default function CastleHall() {
  const introTime = useRef(0)
  const [introDone, setIntroDone] = useState(false)
  const [introSkipped, setIntroSkipped] = useState(false)
  const [captureQueue, setCaptureQueue] = useState([])
  const [activeCapture, setActiveCapture] = useState(null)

  useEffect(() => {
    if (!activeCapture && captureQueue.length) {
      setActiveCapture(captureQueue[0])
      setCaptureQueue((prev) => prev.slice(1))
    }
  }, [activeCapture, captureQueue])

  function handleCapture(capture) {
    setCaptureQueue((prev) => [...prev, capture])
  }

  return (
    <div className="app">
      {!introDone && (
        <div className="ui-overlay">
          <button type="button" onClick={() => setIntroSkipped(true)}>
            Skip intro
          </button>
        </div>
      )}
      <Canvas shadows camera={{ position: [18, 14, 18], fov: 45 }}>
        <IntroTimeline
          timeRef={introTime}
          duration={INTRO_DURATION}
          skipped={introSkipped}
          onDone={() => setIntroDone(true)}
        />
        <CinematicCamera timeRef={introTime} duration={INTRO_DURATION} active={!introDone} />
        <ambientLight intensity={0.36} />
        <directionalLight
          position={[20, 30, 12]}
          intensity={1.6}
          castShadow
          shadow-mapSize-width={4096}
          shadow-mapSize-height={4096}
        />
        <pointLight position={[0, 12, 0]} intensity={0.25} color="#b39ddb" />

        <mesh scale={[140, 140, 140]}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshBasicMaterial color="#c9a850" side={1} />
        </mesh>

        <group>
          {/* Floor */}
          <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, -0.05, 0]}>
            <planeGeometry args={[80, 80]} />
            <meshStandardMaterial color="#efd99d" metalness={0.7} roughness={0.35} />
          </mesh>

          {/* Golden walls */}
          {[
            { pos: [0, 12, -35], size: [80, 24, 0.8] },
            { pos: [0, 12, 35], size: [80, 24, 0.8] },
            { pos: [-35, 12, 0], size: [0.8, 24, 80] },
            { pos: [35, 12, 0], size: [0.8, 24, 80] },
          ].map((w, i) => (
            <mesh key={i} position={w.pos}>
              <boxGeometry args={w.size} />
              <meshStandardMaterial color="#d9b14a" metalness={0.9} roughness={0.25} />
            </mesh>
          ))}

          {/* Roof */}
          <mesh position={[0, 24, 0]}>
            <boxGeometry args={[80, 1, 80]} />
            <meshStandardMaterial color="#f6d870" metalness={0.9} roughness={0.2} />
          </mesh>

          {/* Correctly oriented windows on opposite walls (left/right) */}
          {[[-25, 10, 0], [25, 10, 0]].map(([x, y, z], i) => (
            <group key={i} position={[x, y, z]} rotation={[0, i === 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
              {[-15, 0, 15].map((zOff, j) => (
                <group key={j} position={[0, 0, zOff]}>
                  <mesh rotation={[0, 0, Math.PI]}>
                    <torusGeometry args={[2.5, 0.15, 16, 48, Math.PI]} />
                    <meshStandardMaterial color="#ffd86b" metalness={0.95} roughness={0.2} />
                  </mesh>
                  <mesh position={[0, -0.5, 0]}>
                    <planeGeometry args={[3.8, 5]} />
                    <meshStandardMaterial color="#fff2c4" transparent opacity={0.22} />
                  </mesh>
                </group>
              ))}
            </group>
          ))}

          {/* Double doors (front & back) */}
          {[
            { z: FRONT_DOOR_Z, rot: 0 },
            { z: BACK_DOOR_Z, rot: Math.PI },
          ].map((d, i) => (
            <group key={i} position={[0, 5, d.z]} rotation={[0, d.rot, 0]}>
              <Door position={[0, 0, 0]} rotation={[0, 0, 0]} timeRef={introTime} />
            </group>
          ))}

          {/* Paintings beside doors */}
          <Painting position={[-12, 10, -33]} />
          <Painting position={[12, 10, -33]} />
          <Painting position={[-12, 10, 33]} rotation={[0, Math.PI, 0]} />
          <Painting position={[12, 10, 33]} rotation={[0, Math.PI, 0]} />

          {/* Pillars & thrones */}
          {[-28, -14, 14, 28].map((x, i) =>
            [-28, -14, 14, 28].map((z, j) => (
              <mesh key={`pillar-${i}-${j}`} position={[x, 12, z]} castShadow>
                <cylinderGeometry args={[0.7, 0.8, 24, 20]} />
                <meshStandardMaterial color="#e8ca74" metalness={0.9} roughness={0.18} />
              </mesh>
            ))
          )}
          {[QUEEN_THRONE_POS, KING_THRONE_POS].map((pos, index) => (
            <mesh key={`dais-${index}`} position={[pos[0], 0.2, pos[2]]} receiveShadow>
              <boxGeometry args={[6, 0.4, 6]} />
              <meshStandardMaterial color="#e6c56a" metalness={0.85} roughness={0.3} />
            </mesh>
          ))}
          <Throne position={QUEEN_THRONE_POS} rotation={QUEEN_THRONE_ROTATION} scale={1.05} />
          <Throne position={KING_THRONE_POS} rotation={KING_THRONE_ROTATION} scale={1.25} />

          {/* Decorations */}
          {[
            [-18, 0, -18],
            [18, 0, -18],
            [-18, 0, 18],
            [18, 0, 18],
          ].map((p, i) => (
            <Crown key={`crown-${i}`} position={[p[0], 0.5, p[2]]} />
          ))}
          {[[-30, 3, 0], [30, 3, 0], [0, 3, -30], [0, 3, 30]].map((p, i) => (
            <Torch key={`torch-${i}`} position={p} />
          ))}
        </group>

        <RoyalProcession
          timeRef={introTime}
          duration={INTRO_DURATION}
          kingSeat={KING_THRONE_POS}
          queenSeat={QUEEN_THRONE_POS}
        />
        <GuardFormation
          timeRef={introTime}
          duration={INTRO_DURATION}
          kingSeat={KING_THRONE_POS}
          queenSeat={QUEEN_THRONE_POS}
        />
        <CaptureEscort
          capture={activeCapture}
          onComplete={() => setActiveCapture(null)}
          dungeonPositions={DUNGEON_POSITIONS}
        />
        <Board disabled={!introDone} onCapture={handleCapture} />

        <OrbitControls
          enablePan={introDone}
          enableZoom={introDone}
          enableRotate={introDone}
          minDistance={8}
          maxDistance={160}
          maxPolarAngle={Math.PI / 2.03}
        />
      </Canvas>
    </div>
  )
}
