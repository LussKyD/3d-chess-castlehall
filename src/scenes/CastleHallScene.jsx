import React from 'react'
import Board from '../components/Board'
import KingsWatch from '../components/KingsWatch'

export default function CastleHallScene(){
  return (
    <group>
      {/* simple decorative floor */}
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.01,0]} receiveShadow>
        <planeGeometry args={[80,80]} />
        <meshStandardMaterial metalness={0.2} roughness={0.6} color="#222" />
      </mesh>

      <Board position={[0,0,0]} />
      <KingsWatch />
    </group>
  )
}
