import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Board from './Board'

/* Torchlight flicker */
function Torch({ position, color = '#ffb347', intensity = 1.6 }) {
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

/* Crown prop */
function Crown({ position }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <torusGeometry args={[0.45, 0.1, 16, 32]} />
        <meshStandardMaterial color="#ffd700" metalness={1} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow>
        <coneGeometry args={[0.1, 0.3, 10]} />
        <meshStandardMaterial color="#fff7c0" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  )
}

/* Thrones facing the chessboard */
function Throne({ position, rotation, color = '#ffd700', occupant = 'King' }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Base */}
      <mesh castShadow>
        <boxGeometry args={[1.2, 0.4, 1.2]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, 1, -0.3]} castShadow>
        <boxGeometry args={[1, 2, 0.4]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.3} />
      </mesh>
      {/* Emblem crown */}
      <Crown position={[0, 1.7, -0.2]} />
      {/* Royal figure */}
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

export default function CastleHall() {
  return (
    <Canvas shadows camera={{ position: [15, 12, 15], fov: 45 }}>
      {/* Lighting */}
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[18, 25, 12]}
        intensity={1.6}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
      />
      {/* Purple-White ambient accent */}
      <pointLight position={[0, 12, 0]} intensity={0.3} color="#b39ddb" />
      <pointLight position={[-12, 8, -10]} intensity={0.3} color="#fdfdfd" />

      {/* Sky Dome */}
      <mesh scale={[120, 120, 120]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial color="#c6a850" side={1} />
      </mesh>

      {/* Castle Structure */}
      <group>
        {/* Floor */}
        <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, -0.05, 0]}>
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial color="#e5c78a" metalness={0.7} roughness={0.4} />
        </mesh>

        {/* Walls with subtle golden marble texture */}
        {[
          { pos: [0, 10, -30], size: [60, 20, 0.6] },
          { pos: [0, 10, 30], size: [60, 20, 0.6] },
          { pos: [-30, 10, 0], size: [0.6, 20, 60] },
          { pos: [30, 10, 0], size: [0.6, 20, 60] },
        ].map((w, i) => (
          <mesh key={`wall-${i}`} position={w.pos} receiveShadow>
            <boxGeometry args={w.size} />
            <meshStandardMaterial
              color="#d9b14a"
              metalness={0.85}
              roughness={0.25}
            />
          </mesh>
        ))}

        {/* Roof */}
        <mesh position={[0, 20, 0]}>
          <boxGeometry args={[60, 0.5, 60]} />
          <meshStandardMaterial color="#f6d870" metalness={0.85} roughness={0.25} />
        </mesh>

        {/* Windows */}
        {[-20, 0, 20].map((x, i) =>
          [-20, 0, 20].map((z, j) => (
            <mesh key={`window-${i}-${j}`} position={[x, 10, z]}>
              <torusGeometry args={[2, 0.15, 16, 32, Math.PI]} />
              <meshStandardMaterial color="#fff5b3" metalness={0.7} roughness={0.3} />
            </mesh>
          ))
        )}

        {/* Grand Golden Doors */}
        <group position={[0, 5, -30]}>
          {/* Door frame */}
          <mesh>
            <boxGeometry args={[6, 10, 0.8]} />
            <meshStandardMaterial color="#d6af45" metalness={0.9} roughness={0.25} />
          </mesh>
          {/* Door panels */}
          <mesh position={[0, 0, 0.05]}>
            <boxGeometry args={[5.6, 9.6, 0.2]} />
            <meshStandardMaterial color="#b89028" metalness={0.7} roughness={0.4} />
          </mesh>
          {/* Door handles */}
          {[[-1, 0, 0.25], [1, 0, 0.25]].map((pos, i) => (
            <mesh key={i} position={pos}>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshStandardMaterial color="#fff6d5" metalness={1} roughness={0.2} />
            </mesh>
          ))}
        </group>

        {/* Pillars (spaced widely) */}
        {[-25, -10, 10, 25].map((x, i) =>
          [-25, -10, 10, 25].map((z, j) => (
            <mesh key={`pillar-${i}-${j}`} position={[x, 10, z]} castShadow>
              <cylinderGeometry args={[0.5, 0.6, 20, 20]} />
              <meshStandardMaterial color="#e8ca74" metalness={0.8} roughness={0.2} />
            </mesh>
          ))
        )}

        {/* Thrones facing the board from sides */}
        <Throne position={[-20, 0, 0]} rotation={[0, Math.PI / 2, 0]} occupant="Queen" />
        <Throne position={[20, 0, 0]} rotation={[0, -Math.PI / 2, 0]} occupant="King" />

        {/* Decorative crowns */}
        {[
          [-15, 0, -15],
          [15, 0, -15],
          [-15, 0, 15],
          [15, 0, 15],
        ].map((p, i) => (
          <Crown key={`crown-${i}`} position={[p[0], 0.5, p[2]]} />
        ))}

        {/* Torches */}
        {[[-25, 3, 0], [25, 3, 0], [0, 3, -25], [0, 3, 25]].map((p, i) => (
          <Torch key={`torch-${i}`} position={p} />
        ))}
      </group>

      {/* Chess Board */}
      <Board />

      {/* Camera Controls */}
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={8}
        maxDistance={80}
        maxPolarAngle={Math.PI / 2.05}
      />
    </Canvas>
  )
}
