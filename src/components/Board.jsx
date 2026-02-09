import React, { useState, useEffect, useRef } from 'react'
import { createGame } from '../engine/chessEngine'
import Piece from './Piece'

const SQUARE = 1

function algebraic(c, r){
  const file = String.fromCharCode('a'.charCodeAt(0) + c)
  const rank = 8 - r
  return `${file}${rank}`
}

function squareToWorld(square){
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0)
  const rank = Number(square[1])
  const row = 8 - rank
  const x = (file - 3.5) * SQUARE
  const z = (row - 3.5) * SQUARE
  return [x, 0.35, z]
}

export default function Board({ disabled = false, onCapture }){
  const gameRef = useRef(null)
  const [boardState, setBoardState] = useState([])
  const [selected, setSelected] = useState(null)
  const [legalMoves, setLegalMoves] = useState([])

  useEffect(()=>{
    gameRef.current = createGame()
    setBoardState(gameRef.current.board())
  },[])

  function handleSquareClick(square){
    if(disabled) return
    if(!gameRef.current) return
    // If a square is already selected and the clicked square is a legal move, make the move
    if(selected && legalMoves.includes(square)){
      const res = gameRef.current.move(selected, square)
      if(res){
        if(res.captured && onCapture){
          const capturedColor = res.color === 'w' ? 'b' : 'w'
          onCapture({
            piece: { type: res.captured, color: capturedColor },
            position: squareToWorld(res.to),
            square: res.to,
            capturedColor,
            capturingColor: res.color,
          })
        }
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
        <mesh
          key={`sq-${r}-${c}`}
          position={[x, 0, z]}
          receiveShadow
          onPointerDown={(e) => {
            e.stopPropagation()
            handleSquareClick(sq)
          }}
        >
          <boxGeometry args={[SQUARE, 0.06, SQUARE]} />
          <meshStandardMaterial color={highlight} metalness={0.2} roughness={0.6} />
        </mesh>
      )

      // pieces: chess.board() returns ranks 8->1 as rows
      if(boardState && boardState.length){
        const piece = boardState[r][c]
        if(piece){
          const y = 0.35
          pieces.push(<Piece key={`pc-${r}-${c}`} piece={piece} position={[x, y, z]} />)
        }
      }
    }
  }

  return <group>{squares}{pieces}</group>
}
