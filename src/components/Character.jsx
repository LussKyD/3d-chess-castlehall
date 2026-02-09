import React from 'react'
import Model from './models/Model'
import { MODEL_PATHS, MODEL_SETTINGS } from '../config/models'

function GuardFallback() {
  return (
    <group>
      <mesh castShadow position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.25, 0.28, 1.6, 12]} />
        <meshStandardMaterial color="#555" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.6, 0]} castShadow>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshStandardMaterial color="#333" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  )
}

function RoyalFallback({ tone = '#f4c2ff' }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.55, 0.75, 1.7, 24]} />
        <meshStandardMaterial color={tone} metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position={[0, 1.7, 0]} castShadow>
        <sphereGeometry args={[0.38, 16, 16]} />
        <meshStandardMaterial color={tone} metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  )
}

export default function Character({ role, position = [0, 0, 0], rotation = [0, 0, 0], scale, tint }) {
  const url = MODEL_PATHS[role]
  const settings = MODEL_SETTINGS[role] || MODEL_SETTINGS.guard
  const finalScale = scale ?? settings.scale
  const yOffset = settings.yOffset ?? 0

  let fallback = <GuardFallback />
  if (role === 'king') {
    fallback = <RoyalFallback tone="#f9e76c" />
  } else if (role === 'queen') {
    fallback = <RoyalFallback tone="#f4c2ff" />
  }

  return (
    <group position={position} rotation={rotation}>
      <group position={[0, yOffset, 0]} scale={finalScale}>
        <Model url={url} tint={tint} fallback={fallback} />
      </group>
    </group>
  )
}
