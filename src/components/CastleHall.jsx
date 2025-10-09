```javascript
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
      distance={14}
      decay={2}
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
        <meshStandardMaterial color={color} metalness={0.95} roughness={0.15} />
      </mesh>
      <mesh position={[0, 0.65, 0]} castShadow>
        <boxGeometry args={[1.05, 1.2, 0.75]} />
        <meshStandardMaterial color={'#7d5a20'} metalness={0.2} roughness={0.6} />
      </mesh>
    </group>
  )
}

/* Guards now placed inside the hall beside the doors */
function Guard({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* torso: centered around origin so we can place feet by setting group Y = half-height */}
      <mesh castShadow>
        <cylinderGeometry args={[0.25, 0.28, 1.6, 12]} />
        <meshStandardMaterial color="#555" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* head */}
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
    <Canvas shadowMap camera={{ position: [0, 14, 35], fov: 40 }}>
      {/* ambient & directional */}
      <ambientLight intensity={0.16} />
      <directionalLight position={[20, 30, 10]} intensity={0.6} castShadow />

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
          <group key={`win-${i}`} position={[x, y, z]} rotation={[0, i === 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
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
        {(() => {
          const DOOR_DEFS = [
            { z: -35 + 0.4, rot: 0, guardZ: 2 },
            { z: 35 - 0.4, rot: Math.PI, guardZ: -2 },
          ]
          const GUARD_HALF_HEIGHT = 0.8 // half of the guard's 1.6 height
          const DOOR_GROUP_Y = 5 // original door group Y in this layout
          const GUARD_LOCAL_Y_INSIDE = -DOOR_GROUP_Y + GUARD_HALF_HEIGHT // places guard feet on (approx) y=0
          const OUTSIDE_OFFSET = 2.2 // how far outside the wall to place outside guards

          return DOOR_DEFS.map((d, i) => (
            <React.Fragment key={`door-frag-${i}`}>
              {/* door structure (kept as original, but guards will be adjusted) */}
              <group position={[0, DOOR_GROUP_Y, d.z]} rotation={[0, d.rot, 0]}>
                <mesh>
                  <boxGeometry args={[10, 12, 1]} />
                  <meshStandardMaterial color="#d6af45" metalness={0.95} roughness={0.2} />
                </mesh>
                {[[-2.5, 0, 0.55], [2.5, 0, 0.55]].map((p, j) => (
                  <mesh key={j} position={p}>
                    <boxGeometry args={[4.6, 10.6, 0.2]} />
                    <meshStandardMaterial color="#f1d98a" metalness={0.92} roughness={0.14} />
                  </mesh>
                ))}
                <mesh position={[0, -1.5, 0.95]}>
                  <boxGeometry args={[0.4, 0.6, 0.08]} />
                  <meshStandardMaterial color="#7a5b13" metalness={0.6} roughness={0.5} />
                </mesh>

                {/* Guards inside near door edges — local Y chosen so feet sit near the floor (approx y=0). */}
                <Guard position={[-5, GUARD_LOCAL_Y_INSIDE, d.guardZ]} rotation={[0, 0.1, 0]} />
                <Guard position={[5, GUARD_LOCAL_Y_INSIDE, d.guardZ]} rotation={[0, -0.1, 0]} />
              </group>

              {/* Outside guards placed on the exterior of the door (world coordinates).
                  We create a small group at floor-level (y=0) and put guards with feet at ~0.8 so they sit on the ground.
                  This yields both inside and outside guards as requested. */}
              <group key={`outside-${i}`} position={[0, 0, d.z + Math.sign(d.z) * OUTSIDE_OFFSET]}>
                <Guard position={[-5, 0.8, 0]} rotation={[0, 0.1, 0]} />
                <Guard position={[5, 0.8, 0]} rotation={[0, -0.1, 0]} />
              </group>
            </React.Fragment>
          ))
        })()}

        {/* Paintings beside doors */}
        <Painting position={[-12, 10, -33]} />
        <Painting position={[12, 10, -33]} />
        <Painting position={[-12, 10, 33]} rotation={[0, Math.PI, 0]} />
        <Painting position={[12, 10, 33]} rotation={[0, Math.PI, 0]} />

        {/* Pillars & thrones */}
        {[-28, -14, 14, 28].map((x, i) =>
          [-28, -14, 14, 28].map((z, j) => (
            <group key={`pillar-${i}-${j}`} position={[x, 0, z]}>
              <mesh position={[0, 3, 0]}>
                <cylinderGeometry args={[0.6, 1, 6, 12]} />
                <meshStandardMaterial color="#b68a3a" metalness={0.85} roughness={0.25} />
              </mesh>
            </group>
          ))
        )}

        <Throne position={[-24, 0, 0]} rotation={[0, Math.PI / 2, 0]} occupant="Queen" />
        <Throne position={[24, 0, 0]} rotation={[0, -Math.PI / 2, 0]} occupant="King" />

        {/* Decorations */}
        {[
          [-18, 0, -18],
          [
```
