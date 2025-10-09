import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';

export default function CastleHall() {
  const lightRef = useRef();

  return (
    <Canvas shadows gl={{ antialias: true }} style={{ height: '100vh', background: '#0d0b0b' }}>
      {/* Camera */}
      <PerspectiveCamera makeDefault position={[0, 2, 10]} fov={50} />

      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <spotLight
        ref={lightRef}
        position={[0, 8, 4]}
        intensity={2.5}
        penumbra={0.8}
        castShadow
        angle={0.4}
        color={'#ffcc88'}
      />
      <pointLight position={[0, 2, -2]} intensity={0.5} />

      {/* Floor */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#e5e0d8" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Back wall and door */}
      <group position={[0, 2, -8]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[20, 10, 0.5]} />
          <meshStandardMaterial color="#2b1e0f" />
        </mesh>
        <mesh position={[0, -0.5, 0.26]}>
          <boxGeometry args={[3, 5, 0.2]} />
          <meshStandardMaterial color="#c49a6c" emissive="#c49a6c" emissiveIntensity={0.4} />
        </mesh>
        <pointLight position={[0, 0, 1]} intensity={1.2} color="#ffd580" />
      </group>

      {/* Castle pillars */}
      {[-8, -4, 0, 4, 8].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 2.5, -8]} castShadow>
            <cylinderGeometry args={[0.4, 0.4, 5, 32]} />
            <meshStandardMaterial color="#3a2b1a" metalness={0.5} roughness={0.6} />
          </mesh>
          <mesh position={[x, 2.5, 8]} castShadow>
            <cylinderGeometry args={[0.4, 0.4, 5, 32]} />
            <meshStandardMaterial color="#3a2b1a" metalness={0.5} roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Chess pieces (placeholder shapes for now) */}
      <group position={[0, 0.5, 0]}>
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i} position={[i - 3.5, 0.5, 2]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 0.6, 16]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i} position={[i - 3.5, 0.5, -2]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 0.6, 16]} />
            <meshStandardMaterial color="#eee" />
          </mesh>
        ))}
      </group>

      {/* Environment reflections */}
      <Environment preset="warehouse" />

      {/* Controls */}
      <OrbitControls enablePan={false} enableZoom={true} maxPolarAngle={Math.PI / 2.2} />
      <Html position={[0, 0, 0]} center style={{ color: '#fff' }}>
        <div style={{ fontFamily: 'serif', textAlign: 'center' }}>♔ The Castle Hall ♕</div>
      </Html>
    </Canvas>
  );
}
