// src/components/CastleHall.jsx
import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Board from './Board'

/* 🔥 Torch flicker */
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

/* 👑 small crown decorative prop */
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

/* Thrones that face the board (rotation passed in) */
function Throne({ position, rotation = [0, 0, 0], color = '#ffd700', occupant = 'King' }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Seat base */}
      <mesh castShadow>
        <boxGeometry args={[1.3, 0.4, 1.3]} />
        <meshStandardMaterial color={color} metalness={0.95} roughness={0.18} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, 1.05, -0.32]} castShadow>
        <boxGeometry args={[1.05, 2.1, 0.45]} />
        <meshStandardMaterial color={color} metalness={0.95} roughness={0.2} />
      </mesh>
      {/* Crown emblem */}
      <Crown position={[0, 1.85, -0.2]} />
      {/* Occupant placeholder */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshStandardMaterial
          color={occupant === 'King' ? '#f9e76c' : '#f4c2ff'}
          metalness={0.7}
          roughness={0.25}
        />
      </mesh>
    </group>
  )
}

/* Guard placeholder near doors */
function Guard({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <cylinderGeometry args={[0.25, 0.28, 1.6, 12]} />
        <meshStandardMaterial color="#6b6b6b" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1, 0]} castShadow>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshStandardMaterial color="#333" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.2, -0.6]} castShadow>
        <boxGeometry args={[0.05, 1.2, 0.05]} />
        <meshStandardMaterial color="#333" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  )
}

export default function CastleHall() {
  // Colors: keep gold dominant with subtle accents
  const wallColors = {
    back: '#d9b14a',   // gold (back wall with main doors)
    front: '#c9a63a',  // slightly different gold (front double doors)
    left: '#ffffff',   // white accent wall
    right: '#111111'   // black accent wall
  }

  return (
    <Canvas shadows camera={{ position: [18, 14, 18], fov: 45 }}>
      {/* Global lighting */}
      <ambientLight intensity={0.36} />
      <directionalLight
        position={[20, 30, 12]}
        intensity={1.6}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
      />
      {/* subtle purple/white accents */}
      <pointLight position={[0, 12, 0]} intensity={0.25} color="#b39ddb" />
      <pointLight position={[-12, 8, -10]} intensity={0.2} color="#fdfdfd" />

      {/* Sky dome / exterior glow */}
      <mesh scale={[140, 140, 140]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial color="#c9a850" side={1} />
      </mesh>

      {/* ====== Architecture ====== */}
      <group>
        {/* Floor (large marble-ish) */}
        <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, -0.05, 0]}>
          <planeGeometry args={[80, 80]} />
          <meshStandardMaterial color="#efd99d" metalness={0.7} roughness={0.35} />
        </mesh>

        {/* Walls: back/front/left/right with different tones */}
        <mesh position={[0, 12, -35]} receiveShadow>
          <boxGeometry args={[80, 24, 0.8]} />
          <meshStandardMaterial color={wallColors.back} metalness={0.9} roughness={0.25} />
        </mesh>

        <mesh position={[0, 12, 35]} receiveShadow>
          <boxGeometry args={[80, 24, 0.8]} />
          <meshStandardMaterial color={wallColors.front} metalness={0.9} roughness={0.25} />
        </mesh>

        <mesh position={[-35, 12, 0]} receiveShadow>
          <boxGeometry args={[0.8, 24, 80]} />
          <meshStandardMaterial color={wallColors.left} metalness={0.75} roughness={0.3} />
        </mesh>

        <mesh position={[35, 12, 0]} receiveShadow>
          <boxGeometry args={[0.8, 24, 80]} />
          <meshStandardMaterial color={wallColors.right} metalness={0.75} roughness={0.3} />
        </mesh>

        {/* Ceiling / roof */}
        <mesh position={[0, 24, 0]}>
          <boxGeometry args={[80, 1.2, 80]} />
          <meshStandardMaterial color="#f6d870" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* ====== Large arched windows on left & right walls ====== */}
        {[-20, 0, 20].map((yOff, ix) =>
          [-18, 0, 18].map((zOff, jx) => (
            <group key={`win-${ix}-${jx}`} position={[-34.4, 12 + yOff * 0.15, zOff]}>
              {/* Window frame arch (left wall) */}
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[2.5 + Math.abs(yOff) * 0.05, 0.15, 16, 48, Math.PI]} />
                <meshStandardMaterial color="#ffd86b" metalness={0.95} roughness={0.2} />
              </mesh>
              {/* Glass (slightly transparent plane) */}
              <mesh position={[0, -0.5, 0]}>
                <planeGeometry args={[3.8, 5]} />
                <meshStandardMaterial color="#fff2c4" transparent={true} opacity={0.22} />
              </mesh>
            </group>
          ))
        )}

        {[-20, 0, 20].map((yOff, ix) =>
          [-18, 0, 18].map((zOff, jx) => (
            <group key={`win-r-${ix}-${jx}`} position={[34.4, 12 + yOff * 0.15, zOff]}>
              <mesh rotation={[0, 0, -Math.PI / 2]}>
                <torusGeometry args={[2.5 + Math.abs(yOff) * 0.05, 0.15, 16, 48, Math.PI]} />
                <meshStandardMaterial color="#ffd86b" metalness={0.95} roughness={0.2} />
              </mesh>
              <mesh position={[0, -0.5, 0]}>
                <planeGeometry args={[3.8, 5]} />
                <meshStandardMaterial color="#fff2c4" transparent={true} opacity={0.22} />
              </mesh>
            </group>
          ))
        )}

        {/* ====== Double doors at back and front with frames, handles & locks ====== */}
        {/* Back doors (main entrance) */}
        <group position={[0, 5, -35 + 0.4]}>
          {/* Frame */}
          <mesh>
            <boxGeometry args={[10, 12, 1.0]} />
            <meshStandardMaterial color="#d6af45" metalness={0.95} roughness={0.2} />
          </mesh>
          {/* Left panel */}
          <mesh position={[-2.5, 0, 0.55]}>
            <boxGeometry args={[4.6, 10.6, 0.2]} />
            <meshStandardMaterial color="#b89028" metalness={0.85} roughness={0.3} />
          </mesh>
          {/* Right panel */}
          <mesh position={[2.5, 0, 0.55]}>
            <boxGeometry args={[4.6, 10.6, 0.2]} />
            <meshStandardMaterial color="#b89028" metalness={0.85} roughness={0.3} />
          </mesh>
          {/* Handles & locks */}
          <mesh position={[-1, 0, 0.9]}>
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshStandardMaterial color="#fff6d5" metalness={1} roughness={0.15} />
          </mesh>
          <mesh position={[1, 0, 0.9]}>
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshStandardMaterial color="#fff6d5" metalness={1} roughness={0.15} />
          </mesh>
          <mesh position={[0, -1.5, 0.95]}>
            <boxGeometry args={[0.4, 0.6, 0.08]} />
            <meshStandardMaterial color="#7a5b13" metalness={0.6} roughness={0.5} />
          </mesh>
          {/* Guards by the back door */}
          <Guard position={[-5.2, 0, -1.5]} rotation={[0, 0.3, 0]} />
          <Guard position={[5.2, 0, -1.5]} rotation={[0, -0.3, 0]} />
        </group>

        {/* Front doors (opposite side) */}
        <group position={[0, 5, 35 - 0.4]}>
          <mesh>
            <boxGeometry args={[10, 12, 1.0]} />
            <meshStandardMaterial color="#d6af45" metalness={0.95} roughness={0.2} />
          </mesh>
          <mesh position={[-2.5, 0, -0.55]}>
            <boxGeometry args={[4.6, 10.6, 0.2]} />
            <meshStandardMaterial color="#b89028" metalness={0.85} roughness={0.3} />
          </mesh>
          <mesh position={[2.5, 0, -0.55]}>
            <boxGeometry args={[4.6, 10.6, 0.2]} />
            <meshStandardMaterial color="#b89028" metalness={0.85} roughness={0.3} />
          </mesh>
          <mesh position={[-1, 0, -0.9]}>
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshStandardMaterial color="#fff6d5" metalness={1} roughness={0.15} />
          </mesh>
          <mesh position={[1, 0, -0.9]}>
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshStandardMaterial color="#fff6d5" metalness={1} roughness={0.15} />
          </mesh>
          <mesh position={[0, -1.5, -0.95]}>
            <boxGeometry args={[0.4, 0.6, 0.08]} />
            <meshStandardMaterial color="#7a5b13" metalness={0.6} roughness={0.5} />
          </mesh>
          <Guard position={[-5.2, 0, 1.5]} rotation={[0, -0.3, 0]} />
          <Guard position={[5.2, 0, 1.5]} rotation={[0, 0.3, 0]} />
        </group>

        {/* Pillars placed outside of main board area */}
        {[-28, -14, 14, 28].map((x, i) =>
          [-28, -14, 14, 28].map((z, j) => (
            <mesh key={`pillar-${i}-${j}`} position={[x, 12, z]} castShadow>
              <cylinderGeometry args={[0.7, 0.8, 24, 20]} />
              <meshStandardMaterial color="#e8ca74" metalness={0.9} roughness={0.18} />
            </mesh>
          ))
        )}

        {/* Thrones placed on sides, rotated to face center (the board). Room behind them for captured pieces */}
        <Throne position={[-24, 0, 0]} rotation={[0, Math.PI / 2, 0]} occupant="Queen" />
        <Throne position={[24, 0, 0]} rotation={[0, -Math.PI / 2, 0]} occupant="King" />

        {/* Decorative crowns near corners */}
        {[
          [-18, 0, -18],
          [18, 0, -18],
          [-18, 0, 18],
          [18, 0, 18],
        ].map((p, i) => (
          <Crown key={`crown-${i}`} position={[p[0], 0.5, p[2]]} />
        ))}

        {/* Torches for ambience */}
        {[[-30, 3, 0], [30, 3, 0], [0, 3, -30], [0, 3, 30]].map((p, i) => (
          <Torch key={`torch-${i}`} position={p} />
        ))}
      </group>

      {/* Chess board (unchanged) */}
      <Board />

      {/* Camera controls — allow far zoom to reveal dome/exterior */}
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={8}
        maxDistance={160}
        maxPolarAngle={Math.PI / 2.03}
      />
    </Canvas>
  )
}
