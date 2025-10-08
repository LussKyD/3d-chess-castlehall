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

export default function CastleHall() {
  return (
    <Canvas camera={{ position: [0, 12, 50], fov: 60 }}>
      {/* === Lighting === */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[20, 40, 20]} intensity={1.5} castShadow />
      <Environment preset="sunset" />
      <Sky distance={450000} sunPosition={[0, 1, 0]} inclination={0} azimuth={0.25} />

      {/* === Floor === */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#c8a64d" metalness={0.4} roughness={0.4} />
      </mesh>

      {/* === Walls and Ceiling === */}
      {[
        { pos: [0, 10, -35], rot: [0, 0, 0], color: "#d6af45" }, // back wall gold
        { pos: [0, 10, 35], rot: [0, Math.PI, 0], color: "#d6af45" }, // front wall gold
        { pos: [-35, 10, 0], rot: [0, Math.PI / 2, 0], color: "#000000" }, // left wall black
        { pos: [35, 10, 0], rot: [0, -Math.PI / 2, 0], color: "#ffffff" }, // right wall white
      ].map((w, i) => (
        <mesh key={i} position={w.pos} rotation={w.rot} receiveShadow>
          <planeGeometry args={[70, 20]} />
          <meshStandardMaterial color={w.color} metalness={0.3} roughness={0.6} side={2} />
        </mesh>
      ))}

      {/* === Ceiling === */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 20, 0]}>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial color="#d6af45" metalness={0.6} roughness={0.3} side={2} />
      </mesh>

      {/* === Corrected Windows === */}
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
                  metalness={0.95}
                  roughness={0.2}
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

      {/* === Doors and Guards === */}
      {[
        { z: -35 + 0.4, rot: 0 },
        { z: 35 - 0.4, rot: Math.PI },
      ].map((d, i) => (
        <group key={i} position={[0, 5, d.z]} rotation={[0, d.rot, 0]}>
          {/* Double golden doors visible from both sides */}
          <mesh>
            <boxGeometry args={[10, 12, 1]} />
            <meshStandardMaterial
              color="#d6af45"
              metalness={0.95}
              roughness={0.2}
              side={2}
            />
          </mesh>

          {/* Two panels */}
          {[[-2.5, 0, 0.55], [2.5, 0, 0.55]].map((p, j) => (
            <mesh key={j} position={p}>
              <boxGeometry args={[4.6, 10.6, 0.2]} />
              <meshStandardMaterial
                color="#b89028"
                metalness={0.85}
                roughness={0.3}
                side={2}
              />
            </mesh>
          ))}

          {/* Handles */}
          {[[-1, 0, 0.9], [1, 0, 0.9]].map((p, j) => (
            <mesh key={`handle-${i}-${j}`} position={p}>
              <sphereGeometry args={[0.18, 16, 16]} />
              <meshStandardMaterial color="#fff6d5" metalness={1} roughness={0.15} />
            </mesh>
          ))}

          {/* Lock plate */}
          <mesh position={[0, -1.5, 0.95]}>
            <boxGeometry args={[0.4, 0.6, 0.08]} />
            <meshStandardMaterial color="#7a5b13" metalness={0.6} roughness={0.5} />
          </mesh>

          {/* Guards on floor inside */}
          <Guard position={[-5, 0.8, 2.5]} rotation={[0, 0.1, 0]} />
          <Guard position={[5, 0.8, 2.5]} rotation={[0, -0.1, 0]} />
        </group>
      ))}

      <OrbitControls enablePan enableZoom enableRotate />
    </Canvas>
  );
}
