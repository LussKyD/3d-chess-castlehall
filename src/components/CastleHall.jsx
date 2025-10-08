import React, { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Board from './Board'

/* 🔥 Torchlight flicker */
function Torch({ position, color = '#ffb347', intensity = 1.8 }) {
  const light = useRef()
  useFrame(({ clock }) => {
    if (light.current) {
      const t = clock.elapsedTime
      light.current.intensity = intensity + Math.sin(t * 8 + position[0]) * 0.3
    }
  })
  return (
    <pointLight
      ref={light}
      position={position}
      color={color}
      intensity={intensity}
      distance={7}
      castShadow
    />
  )
}

/* 👑 Crown prop */
function Crown({ position }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <torusGeometry args={[0.5, 0.12, 16, 32]} />
        <meshStandardMaterial color="#ffd700" metalness={1} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.35, 0]} castShadow>
        <coneGeometry args={[0.12, 0.35, 10]} />
        <meshStandardMaterial color="#fff7c0" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  )
}

/* 🪑 Thrones with Kings/Queens */
function Throne({ position, color = '#ffd700', occupant = 'King' }) {
  return (
    <group position={position}>
      {/* Base seat */}
      <mesh castShadow>
        <boxGeometry args={[1.2, 0.4, 1.2]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, 1, -0.3]} castShadow>
        <boxGeometry args={[1, 2, 0.4]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.3} />
      </mesh>
      {/* Crown emblem */}
      <Crown position={[0, 1.8, -0.2]} />
      {/* Placeholder for figure */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color={occupant === 'King' ? '#f9e76c' : '#f4c2ff'}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
    </group>
  )
}

/* 🎨 Theme system */
const THEMES = {
  gold: { wall: '#d9b14a', floor: '#e5c78a', sky: '#b69548' },
  black: { wall: '#222', floor: '#444', sky: '#555' },
  purple: { wall: '#4b0082', floor: '#5c0a99', sky: '#3d0066' },
  white: { wall: '#f5f5f5', floor: '#ddd', sky: '#ccc' },
}

export default function CastleHall() {
  const [theme, setTheme] = useState('gold')

  /* Switch theme automatically every 20 seconds */
  useEffect(() => {
    const keys = Object.keys(THEMES)
    let index = 0
    const id = setInterval(() => {
      index = (index + 1) % keys.length
      setTheme(keys[index])
    }, 20000)
    return () => clearInterval(id)
  }, [])

  const colors = THEMES[theme]

  return (
    <Canvas shadows camera={{ position: [12, 15, 12], fov: 45 }}>
      {/* Lighting */}
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[15, 25, 10]}
        intensity={1.6}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
      />

      {/* Sky dome */}
      <mesh scale={[120, 120, 120]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial color={colors.sky} side={1} />
      </mesh>

      {/* Structure */}
      <group>
        {/* Floor */}
        <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, -0.05, 0]}>
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial color={colors.floor} metalness={0.6} roughness={0.4} />
        </mesh>

        {/* Walls */}
        {[
          { pos: [0, 10, -30], size: [60, 20, 0.6] },
          { pos: [0, 10, 30], size: [60, 20, 0.6] },
          { pos: [-30, 10, 0], size: [0.6, 20, 60] },
          { pos: [30, 10, 0], size: [0.6, 20, 60] },
        ].map((w, i) => (
          <mesh key={`wall-${i}`} position={w.pos} receiveShadow>
            <boxGeometry args={w.size} />
            <meshStandardMaterial color={colors.wall} metalness={0.8} roughness={0.3} />
          </mesh>
        ))}

        {/* Ceiling */}
        <mesh position={[0, 20, 0]}>
          <boxGeometry args={[60, 0.6, 60]} />
          <meshStandardMaterial color={colors.wall} metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Windows */}
        {[-20, 0, 20].map((x, i) =>
          [-20, 0, 20].map((z, j) => (
            <mesh key={`window-${i}-${j}`} position={[x, 12, z]}>
              <torusGeometry args={[2, 0.15, 16, 32, Math.PI]} />
              <meshStandardMaterial color="#fff5b3" metalness={0.7} roughness={0.3} />
            </mesh>
          ))
        )}

        {/* Torches */}
        {[[-25, 3, 0], [25, 3, 0], [0, 3, -25], [0, 3, 25]].map((p, i) => (
          <Torch key={`torch-${i}`} position={p} />
        ))}

        {/* Pillars */}
        {[-25, -12, 12, 25].map((x, i) =>
          [-25, -12, 12, 25].map((z, j) => (
            <mesh key={`pillar-${i}-${j}`} position={[x, 10, z]} castShadow>
              <cylinderGeometry args={[0.5, 0.6, 20, 20]} />
              <meshStandardMaterial color={colors.wall} metalness={0.8} roughness={0.2} />
            </mesh>
          ))
        )}

        {/* Thrones */}
        <Throne position={[0, 0, -20]} occupant="King" />
        <Throne position={[0, 0, 20]} occupant="Queen" />

        {/* Crowns */}
        {[
          [-15, 0, -15],
          [15, 0, -15],
          [-15, 0, 15],
          [15, 0, 15],
        ].map((p, i) => (
          <Crown key={`crown-${i}`} position={[p[0], 0.5, p[2]]} />
        ))}
      </group>

      {/* Board */}
      <Board />

      {/* Camera Controls */}
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={7}
        maxDistance={80}   // ← zoomed out farther to see sky dome
        maxPolarAngle={Math.PI / 2.1}
      />
    </Canvas>
  )
}
