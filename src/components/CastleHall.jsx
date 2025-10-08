import React, { useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Board from './Board'

/* 🔥 Small torchlight component for subtle flicker */
function Torch({ position, color = '#ffb347', intensity = 1.5 }) {
  const light = useRef()
  useFrame(({ clock }) => {
    if (light.current) {
      const t = clock.elapsedTime
      light.current.intensity = intensity + Math.sin(t * 10 + position[0]) * 0.2
    }
  })
  return (
    <pointLight
      ref={light}
      position={position}
      color={color}
      intensity={intensity}
      distance={6}
      castShadow
    />
  )
}

/* 👑 Simple crown prop */
function Crown({ position }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <torusGeometry args={[0.4, 0.1, 12, 24]} />
        <meshStandardMaterial color="#ffd700" metalness={1} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow>
        <coneGeometry args={[0.08, 0.3, 8]} />
        <meshStandardMaterial color="#fff7c0" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  )
}

export default function CastleHall() {
  return (
    <Canvas shadows camera={{ position: [10, 12, 10], fov: 45 }}>
      {/* 🌤️ Ambient + main lighting */}
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[12, 20, 10]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Sky dome / exterior glow */}
      <mesh scale={[60, 60, 60]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial color="#b69548" side={1} />
      </mesh>

      {/* 🏰 Golden Castle Structure */}
      <group>
        {/* Floor */}
        <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, -0.05, 0]}>
          <planeGeometry args={[36, 36]} />
          <meshStandardMaterial color="#e5c78a" metalness={0.6} roughness={0.4} />
        </mesh>

        {/* Walls */}
        {[
          { pos: [0, 8, -18], rot: [0, 0, 0], size: [36, 16, 0.6] }, // back
          { pos: [0, 8, 18], rot: [0, 0, 0], size: [36, 16, 0.6] }, // front
          { pos: [-18, 8, 0], rot: [0, 0, 0], size: [0.6, 16, 36] }, // left
          { pos: [18, 8, 0], rot: [0, 0, 0], size: [0.6, 16, 36] }  // right
        ].map((w, i) => (
          <mesh key={i} position={w.pos} receiveShadow>
            <boxGeometry args={w.size} />
            <meshStandardMaterial color="#d9b14a" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}

        {/* Ceiling */}
        <mesh position={[0, 16, 0]}>
          <boxGeometry args={[36, 0.5, 36]} />
          <meshStandardMaterial color="#f6d870" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Pillars (moved further out) */}
        {[-14, -7, 7, 14].map((x, i) =>
          [-14, -7, 7, 14].map((z, j) => (
            <mesh key={`pillar-${i}-${j}`} position={[x, 8, z]} castShadow>
              <cylinderGeometry args={[0.35, 0.4, 16, 20]} />
              <meshStandardMaterial color="#e8ca74" metalness={0.8} roughness={0.2} />
            </mesh>
          ))
        )}

        {/* Arched windows */}
        {[-12, 12].map((z, i) =>
          [-8, 0, 8].map((x, j) => (
            <mesh key={`window-${i}-${j}`} position={[x, 8, z]}>
              <torusGeometry args={[1.5, 0.1, 16, 32, Math.PI]} />
              <meshStandardMaterial color="#fff5b3" metalness={0.7} roughness={0.3} />
            </mesh>
          ))
        )}

        {/* Torches with flicker light */}
        {[[-16, 3, 0], [16, 3, 0], [0, 3, -16], [0, 3, 16]].map((p, i) => (
          <Torch key={`torch-${i}`} position={p} />
        ))}

        {/* Crown decorations */}
        {[
          [-10, 0, -10],
          [10, 0, -10],
          [-10, 0, 10],
          [10, 0, 10]
        ].map((pos, i) => (
          <Crown key={`crown-${i}`} position={[pos[0], 0.4, pos[2]]} />
        ))}
      </group>

      {/* ♟️ Chess Board */}
      <Board />

      {/* 🎥 Camera Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={7}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2.15}
      />
    </Canvas>
  )
}
