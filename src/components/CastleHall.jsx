import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Board from './Board'

export default function CastleHall() {
  return (
    <Canvas shadows camera={{ position: [6, 6, 6], fov: 45 }}>
      {/* 🌤️ Lighting setup */}
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-5, 3, -5]} intensity={0.6} color="#a57fff" />
      <pointLight position={[5, 3, 5]} intensity={0.6} color="#ffd700" />

      {/* 🏰 Castle Hall structure */}
      <group>
        {/* Floor */}
        <mesh receiveShadow rotation-x={-Math.PI / 2} position={[0, -0.05, 0]}>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#5a3e1b" metalness={0.3} roughness={0.8} />
        </mesh>

        {/* Columns */}
        {[-7, -3.5, 0, 3.5, 7].map((x, i) =>
          [-7, -3.5, 0, 3.5, 7].map((z, j) => (
            <mesh key={`col-${i}-${j}`} position={[x, 1.5, z]} castShadow>
              <cylinderGeometry args={[0.2, 0.3, 3.2, 16]} />
              <meshStandardMaterial color="#c9b37f" metalness={0.6} roughness={0.3} />
            </mesh>
          ))
        )}
      </group>

      {/* ♟️ The Chess Board */}
      <Board />

      {/* 🎥 Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={5}
        maxDistance={15}
      />
    </Canvas>
  )
}
