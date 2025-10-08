import React, { useState, useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { createGame } from '../engine/chessEngine'

const SQUARE = 1

function algebraic(c, r){
  const file = String.fromCharCode('a'.charCodeAt(0) + c)
  const rank = 8 - r
  return `${file}${rank}`
}

export default function Board(){
  const gameRef = useRef(null)
  const [boardState, setBoardState] = useState([])
  const [selected, setSelected] = useState(null)
  const [legalMoves, setLegalMoves] = useState([])
  const { camera } = useThree()

  useEffect(()=>{
    gameRef.current = createGame()
    setBoardState(gameRef.current.board())
  },[])

  function handleSquareClick(square){
    if(!gameRef.current) return
    // If a square is already selected and the clicked square is a legal move, make the move
    if(selected && legalMoves.includes(square)){
      const res = gameRef.current.move(selected, square)
      if(res){
        setBoardState(gameRef.current.board())
      }
      setSelected(null)
      setLegalMoves([])
      return
    }

    // Otherwise, try to select a piece on this square (only pieces with legal moves)
    const moves = gameRef.current.moves(square) || []
    if(moves.length > 0){
      setSelected(square)
      setLegalMoves(moves.map(m => m.to))
    } else {
      // nothing to select, clear selection
      setSelected(null)
      setLegalMoves([])
    }
  }

  // helper to render a piece geometry based on type
  function PieceMesh({ piece, position }){
    const color = piece.color === 'w' ? '#ffffff' : '#111111'
    const metal = piece.color === 'w' ? 0.3 : 0.8
    const rough = 0.4
    const key = `${position.join(',')}-${piece.type}-${piece.color}`
    return (
      <mesh key={key} position={position} castShadow>
        {piece.type === 'p' && <sphereGeometry args={[0.18, 16, 16]} />}
        {piece.type === 'r' && <boxGeometry args={[0.38, 0.7, 0.38]} />}
        {piece.type === 'n' && <torusGeometry args={[0.25, 0.08, 16, 100]} />}
        {piece.type === 'b' && <coneGeometry args={[0.25, 0.6, 16]} />}
        {piece.type === 'q' && <cylinderGeometry args={[0.28, 0.34, 0.9, 32]} />}
        {piece.type === 'k' && <cylinderGeometry args={[0.32, 0.4, 1.05, 32]} />}
        <meshStandardMaterial color={color} metalness={metal} roughness={rough} />
      </mesh>
    )
  }

  // build squares and pieces
  const squares = []
  const pieces = []
  for(let r=0;r<8;r++){
    for(let c=0;c<8;c++){
      const x = (c - 3.5) * SQUARE
      const z = (r - 3.5) * SQUARE
      const isLight = (r + c) % 2 === 0
      const baseColor = isLight ? '#f0d9b5' : '#b58863'
      const sq = algebraic(c, r)
      const highlight = selected === sq ? '#ffd86b' : (legalMoves.includes(sq) ? '#89f' : baseColor)

      squares.push(
        <mesh key={`sq-${r}-${c}`} position={[x, 0, z]} receiveShadow onPointerDown={(e) => { e.stopPropagation(); handleSquareClick(sq) }}>
          <boxGeometry args={[SQUARE, 0.06, SQUARE]} />
          <meshStandardMaterial color={highlight} metalness={0.2} roughness={0.6} />
        </mesh>
      )

      // pieces: chess.board() returns ranks 8->1 as rows
      if(boardState && boardState.length){
        const piece = boardState[r][c]
        if(piece){
          const y = 0.35
          pieces.push(<PieceMesh key={`pc-${r}-${c}`} piece={piece} position={[x, y, z]} />)
        }
      }
    }
  }

  return <group>{squares}{pieces}</group>
}
