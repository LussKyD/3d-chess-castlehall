// src/components/CastleHall.jsx
import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Board from './Board'

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

function Throne({ position, rotation = [0, 0, 0], color = '#ffd700', occupant = 'King' }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <boxGeometry args={[1.3, 0.4, 1.3]} />
        <meshStandardMaterial color={color} metalness={0.95} roughness={0.18} />
      </mesh>
      <mesh position={[0, 1.05, -0.32]} castShadow>
        <boxGeometry args={[1.05, 2.1, 0.45]} />
        <meshStandardMaterial color={color} metalness={0.95} roughness={0.2} />
      </mesh>
      <Crown position={[0, 1.85, -0.2]} />
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

/* Guards now placed inside the hall beside the doors */
function Guard({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <cylinderGeometry args={[0.25, 0.28, 1.6, 12]} />
        <meshStandardMaterial color="#555" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1, 0]} castShadow>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshStandardMaterial color="#333" metalness={0.6} roughness={0.3} />
      </mesh>
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

export default function CastleHall() {
  return (
    <Canvas shadows camera={{ position: [18, 14, 18], fov: 45 }}>
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

        {/* Double doors (front & back) with guards inside */}
        {[
          { z: -35 + 0.4, rot: 0, guardZ: 2 },
          { z: 35 - 0.4, rot: Math.PI, guardZ: -2 },
        ].map((d, i) => (
          <group key={i} position={[0, 5, d.z]} rotation={[0, d.rot, 0]}>
            <mesh>
              <boxGeometry args={[10, 12, 1]} />
              <meshStandardMaterial color="#d6af45" metalness={0.95} roughness={0.2} />
            </mesh>
            {[[-2.5, 0, 0.55], [2.5, 0, 0.55]].map((p, j) => (
              <mesh key={j} position={p}>
                <boxGeometry args={[4.6, 10.6, 0.2]} />
                <meshStandardMaterial color="#b89028" metalness={0.85} roughness={0.3} />
              </mesh>
            ))}
            {[[-1, 0, 0.9], [1, 0, 0.9]].map((p, j) => (
              <mesh key={`handle-${i}-${j}`} position={p}>
                <sphereGeometry args={[0.18, 16, 16]} />
                <meshStandardMaterial color="#fff6d5" metalness={1} roughness={0.15} />
              </mesh>
            ))}
            <mesh position={[0, -1.5, 0.95]}>
              <boxGeometry args={[0.4, 0.6, 0.08]} />
              <meshStandardMaterial color="#7a5b13" metalness={0.6} roughness={0.5} />
            </mesh>
            {/* Guards inside near door edges */}
            <Guard position={[-5, 0, d.guardZ]} rotation={[0, 0.1, 0]} />
            <Guard position={[5, 0, d.guardZ]} rotation={[0, -0.1, 0]} />
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
        <Throne position={[-24, 0, 0]} rotation={[0, Math.PI / 2, 0]} occupant="Queen" />
        <Throne position={[24, 0, 0]} rotation={[0, -Math.PI / 2, 0]} occupant="King" />

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

      <Board />

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
