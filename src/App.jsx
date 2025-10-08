import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import CastleHallScene from './scenes/CastleHallScene'

export default function App(){
  return (
    <div className="app">
      <Canvas shadows camera={{ position: [0, 12, 18], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight intensity={0.8} position={[10, 20, 10]} castShadow />
        <CastleHallScene />
        <OrbitControls target={[0,1,0]} />
      </Canvas>

      <div className="ui-overlay">
        <button id="new-game">New Game</button>
      </div>
    </div>
  )
}
