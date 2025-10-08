import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function KingsWatch(){
  const kingRef = useRef()
  const queenRef = useRef()
  const tmp = new THREE.Vector3()

  useFrame(({camera, clock}) => {
    // target a point near camera but slightly above the board so it looks natural
    tmp.copy(camera.position)
    tmp.y = 1.2
    if(kingRef.current) kingRef.current.lookAt(tmp)
    if(queenRef.current) queenRef.current.lookAt(tmp)

    // subtle idle rotation
    const t = clock.getElapsedTime()
    if(kingRef.current) kingRef.current.rotation.y += Math.sin(t*0.3)*0.0008
    if(queenRef.current) queenRef.current.rotation.y += Math.cos(t*0.25)*0.0007
  })

  return (
    <group>
      {/* King - gold */}
      <mesh ref={kingRef} position={[0,1.3,-6]} castShadow>
        <cylinderGeometry args={[0.6,0.8,1.8,32]} />
        <meshStandardMaterial color={'#D4AF37'} metalness={1} roughness={0.25} />
      </mesh>

      {/* Queen - purple */}
      <mesh ref={queenRef} position={[0,1.3,6]} castShadow>
        <coneGeometry args={[0.7,1.8,32]} />
        <meshStandardMaterial color={'#9B59B6'} metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  )
}
