import React from 'react'
import Model from './models/Model'
import { MODEL_PATHS, MODEL_SETTINGS } from '../config/models'

function PieceFallback({ type, color }) {
  const metal = color === 'w' ? 0.3 : 0.8
  const rough = 0.4
  const baseColor = color === 'w' ? '#ffffff' : '#111111'

  return (
    <mesh castShadow>
      {type === 'p' && <sphereGeometry args={[0.18, 16, 16]} />}
      {type === 'r' && <boxGeometry args={[0.38, 0.7, 0.38]} />}
      {type === 'n' && <torusGeometry args={[0.25, 0.08, 16, 100]} />}
      {type === 'b' && <coneGeometry args={[0.25, 0.6, 16]} />}
      {type === 'q' && <cylinderGeometry args={[0.28, 0.34, 0.9, 32]} />}
      {type === 'k' && <cylinderGeometry args={[0.32, 0.4, 1.05, 32]} />}
      <meshStandardMaterial color={baseColor} metalness={metal} roughness={rough} />
    </mesh>
  )
}

export default function Piece({ piece, position, rotation }) {
  if (!piece) return null
  const { type, color } = piece
  const tint = color === 'w' ? '#f8f4ee' : '#1a1a1a'
  const url = MODEL_PATHS.pieces[type]
  const { scale, yOffset } = MODEL_SETTINGS.piece

  return (
    <group position={position} rotation={rotation}>
      <group position={[0, yOffset, 0]} scale={scale}>
        <Model url={url} tint={tint} fallback={<PieceFallback type={type} color={color} />} />
      </group>
    </group>
  )
}
