import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Board from './Board'

export default function CastleHall() {
  return (
    <Canvas shadows camera={{ position: [7, 8, 7], fov: 45 }}>
      {/* 🌤️ Lighting */}
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[8, 15, 6]}
        intensity={1.3}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      {/* Accent colored lights */}
      <pointLight position={[6, 4, -6]} intensity={0.5} color="#d4af37" />
      <pointLight position={[-6, 3, 6]} intensity={0.4} color="#a28bff" />

      {/* 🧱 Castle Structure */}
      <group>
        {/* --- Floor --- */}
        <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, -0.05, 0]}>
          <planeGeometry args={[24, 24]} />
          <meshStandardMaterial color="#5a3e1b" metalness={0.25} roughness={0.9} />
        </mesh>

        {/* --- Walls --- */}
        {/* Back Wall */}
        <mesh position={[0, 4, -12]}>
          <boxGeometry args={[24, 8, 0.5]} />
          <meshStandardMaterial color="#3b2c1a" metalness={0.2} roughness={0.9} />
        </mesh>
        {/* Front Wall */}
        <mesh position={[0, 4, 12]}>
          <boxGeometry args={[24, 8, 0.5]} />
          <meshStandardMaterial color="#3b2c1a" metalness={0.2} roughness={0.9} />
        </mesh>
        {/* Left Wall */}
        <mesh position={[-12, 4, 0]}>
          <boxGeometry args={[0.5, 8, 24]} />
          <meshStandardMaterial color="#3b2c1a" metalness={0.2} roughness={0.9} />
        </mesh>
        {/* Right Wall */}
        <mesh position={[12, 4, 0]}>
          <boxGeometry args={[0.5, 8, 24]} />
          <meshStandardMaterial color="#3b2c1a" metalness={0.2} roughness={0.9} />
        </mesh>

        {/* --- Roof --- */}
        <mesh position={[0, 8, 0]}>
          <boxGeometry args={[24, 0.5, 24]} />
          <meshStandardMaterial color="#4a3622" metalness={0.25} roughness={0.8} />
        </mesh>

        {/* --- Pillars (offset away from board) --- */}
        {[-9, -6, 6, 9].map((x, i) =>
          [-9, -6, 6, 9].map((z, j) => (
            <mesh key={`pillar-${i}-${j}`} position={[x, 3.5, z]} castShadow>
              <cylinderGeometry args={[0.25, 0.3, 7, 20]} />
              <meshStandardMaterial color="#c9b37f" metalness={0.5} roughness={0.4} />
            </mesh>
          ))
        )}
      </group>

      {/* ♟️ Chess Board */}
      <Board />

      {/* 🎥 Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        maxPolarAngle={Math.PI / 2.3}
        minDistance={6}
        maxDistance={16}
      />
    </Canvas>
  )
}
