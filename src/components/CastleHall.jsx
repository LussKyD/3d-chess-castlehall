import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sky, Environment } from "@react-three/drei";

function Guard({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={[0.7, 1.8, 0.4]} />
      <meshStandardMaterial color="#9d7f2f" metalness={0.6} roughness={0.4} />
    </mesh>
  );
}

function Throne({ position = [0, 0, 0], rotation = [0, 0, 0], color = "#d6af45" }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Seat */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, 3, -1]}>
        <boxGeometry args={[2, 3, 0.3]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Crown emblem */}
      <mesh position={[0, 5, -1]}>
        <torusGeometry args={[0.6, 0.1, 16, 32]} />
        <meshStandardMaterial color="#fff6d5" metalness={1} roughness={0.1} />
      </mesh>
    </group>
  );
}

export default function CastleHall() {
  return (
    <Canvas camera={{ position: [0, 10, 40], fov: 60 }}>
      {/* === Lighting === */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[20, 40, 20]} intensity={1.2} castShadow />
      <Environment preset="sunset" />
      <Sky distance={450000} sunPosition={[0, 1, 0]} inclination={0} azimuth={0.25} />

      {/* === Floor === */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#c8a64d" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* === Chess Board === */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[16, 0.4, 16]} />
        <meshStandardMaterial color="#111" />
      </mesh>

      {/* === Thrones === */}
      <Throne position={[15, 1, -10]} rotation={[0, Math.PI / 2, 0]} color="#d6af45" />
      <Throne position={[-15, 1, 10]} rotation={[0, -Math.PI / 2, 0]} color="#d6af45" />

      {/* === Guards (corrected, standing on ground inside) === */}
      <Guard position={[10, 0.9, -12]} rotation={[0, -0.2, 0]} />
      <Guard position={[-10, 0.9, 12]} rotation={[0, 0.2, 0]} />

      {/* === Walls === */}
      {[
        { pos: [0, 10, -35], rot: [0, 0, 0], color: "#d6af45" }, // back
        { pos: [0, 10, 35], rot: [0, Math.PI, 0], color: "#d6af45" }, // front
        { pos: [-35, 10, 0], rot: [0, Math.PI / 2, 0], color: "#000000" }, // left
        { pos: [35, 10, 0], rot: [0, -Math.PI / 2, 0], color: "#ffffff" }, // right
      ].map((w, i) => (
        <mesh key={i} position={w.pos} rotation={w.rot} receiveShadow>
          <planeGeometry args={[70, 20]} />
          <meshStandardMaterial color={w.color} metalness={0.3} roughness={0.6} side={2} />
        </mesh>
      ))}

      {/* === Windows (fixed placement and rotation) === */}
      {[[-25, 10, 0], [25, 10, 0]].map(([x, y, z], i) => (
        <group
          key={i}
          position={[x, y, z]}
          rotation={[0, i === 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
        >
          {[-15, 0, 15].map((zOff, j) => (
            <group key={j} position={[0, 0, zOff]}>
              <mesh>
                <torusGeometry args={[2.5, 0.15, 16, 48, Math.PI]} />
                <meshStandardMaterial
                  color="#ffd86b"
                  metalness={0.9}
                  roughness={0.3}
                  side={2}
                />
              </mesh>
              <mesh position={[0, -0.5, 0]}>
                <planeGeometry args={[3.8, 5]} />
                <meshStandardMaterial
                  color="#fff2c4"
                  transparent
                  opacity={0.22}
                  side={2}
                />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      {/* === Doors === */}
      {[
        { z: -35 + 0.4, rot: 0 },
        { z: 35 - 0.4, rot: Math.PI },
      ].map((d, i) => (
        <group key={i} position={[0, 5, d.z]} rotation={[0, d.rot, 0]}>
          {/* Double doors */}
          {[[-2.5, 0, 0.55], [2.5, 0, 0.55]].map((p, j) => (
            <mesh key={j} position={p}>
              <boxGeometry args={[4.6, 10.6, 0.2]} />
              <meshStandardMaterial
                color="#d6af45"
                metalness={0.9}
                roughness={0.3}
                side={2}
              />
            </mesh>
          ))}
          {/* Door handles */}
          {[[-1, 0, 0.9], [1, 0, 0.9]].map((p, j) => (
            <mesh key={`handle-${i}-${j}`} position={p}>
              <sphereGeometry args={[0.18, 16, 16]} />
              <meshStandardMaterial color="#fff6d5" metalness={1} roughness={0.15} />
            </mesh>
          ))}
        </group>
      ))}

      {/* === Picture Frames === */}
      {[
        { pos: [0, 8, -34.8], rot: [0, 0, 0] },
        { pos: [0, 8, 34.8], rot: [0, Math.PI, 0] },
      ].map((f, i) => (
        <group key={i} position={f.pos} rotation={f.rot}>
          <mesh>
            <boxGeometry args={[6, 4, 0.3]} />
            <meshStandardMaterial color="#c9a13f" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.16]}>
            <planeGeometry args={[5.4, 3.4]} />
            <meshStandardMaterial color="#fff2c4" />
          </mesh>
        </group>
      ))}

      <OrbitControls enablePan enableZoom enableRotate />
    </Canvas>
  );
}
