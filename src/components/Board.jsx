import React from 'react'

const SQUARE = 1

function Square({pos, color}){
  return (
    <mesh position={pos} receiveShadow>
      <boxGeometry args={[SQUARE, 0.06, SQUARE]} />
      <meshStandardMaterial color={color} metalness={0.2} roughness={0.6} />
    </mesh>
  )
}

export default function Board(){
  const squares = []
  for(let r=0; r<8; r++){
    for(let c=0; c<8; c++){
      const x = (c-3.5) * SQUARE
      const z = (r-3.5) * SQUARE
      const isLight = (r+c) % 2 === 0
      const color = isLight ? '#f0d9b5' : '#b58863'
      squares.push(<Square key={`${r}-${c}`} pos={[x,0,z]} color={color} />)
    }
  }
  return <group position={[0,0,0]}>{squares}</group>
}
