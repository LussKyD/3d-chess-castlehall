import { Chess } from 'chess.js'

export function createGame(){
  const chess = new Chess()
  return {
    fen: () => chess.fen(),
    board: () => chess.board(), // 8x8 array, ranks 8->1
    moves: (square) => chess.moves({ square, verbose: true }),
    move: (from, to) => {
      // auto-promote to queen for simplicity
      const m = chess.move({ from, to, promotion: 'q' })
      return m // null if illegal
    },
    undo: () => chess.undo(),
    turn: () => chess.turn(),
    chess
  }
}
