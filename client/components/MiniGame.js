'use client';
import { useState } from 'react';

// Tic-Tac-Toe Game
function TicTacToe({ onClose }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isX, setIsX] = useState(true);
  const [winner, setWinner] = useState(null);

  const checkWinner = (squares) => {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const [a,b,c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) return squares[a];
    }
    return squares.every(s => s) ? 'Draw' : null;
  };

  const handleClick = (i) => {
    if (board[i] || winner) return;
    const newBoard = [...board];
    newBoard[i] = isX ? 'X' : 'O';
    setBoard(newBoard);
    setIsX(!isX);
    setWinner(checkWinner(newBoard));
  };

  const reset = () => { setBoard(Array(9).fill(null)); setIsX(true); setWinner(null); };

  return (
    <div className="p-4">
      <div className="text-center mb-4">
        {winner
          ? <p className="text-white font-bold text-lg">{winner === 'Draw' ? '🤝 Draw!' : `🎉 ${winner} Wins!`}</p>
          : <p className="text-white/60 text-sm">Turn: <span className={`font-bold ${isX ? 'text-purple-400' : 'text-pink-400'}`}>{isX ? 'X' : 'O'}</span></p>
        }
      </div>
      <div className="grid grid-cols-3 gap-2 w-48 mx-auto mb-4">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            className={`w-14 h-14 rounded-2xl border text-2xl font-bold transition-all ${
              cell === 'X' ? 'bg-purple-500/20 border-purple-400 text-purple-400' :
              cell === 'O' ? 'bg-pink-500/20 border-pink-400 text-pink-400' :
              'bg-white/5 border-white/10 hover:border-white/30 text-transparent hover:text-white/10'
            }`}
          >
            {cell || '·'}
          </button>
        ))}
      </div>
      <button onClick={reset} className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm transition-colors">
        🔄 New Game
      </button>
    </div>
  );
}

// Simple Chess (display only — for full game use chess.js)
function ChessBoard({ onClose }) {
  const initialBoard = [
    ['♜','♞','♝','♛','♚','♝','♞','♜'],
    ['♟','♟','♟','♟','♟','♟','♟','♟'],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    ['♙','♙','♙','♙','♙','♙','♙','♙'],
    ['♖','♘','♗','♕','♔','♗','♘','♖'],
  ];

  const [board, setBoard] = useState(initialBoard);
  const [selected, setSelected] = useState(null);
  const [turn, setTurn] = useState('white');

  const isWhitePiece = (p) => p && '♙♖♘♗♕♔'.includes(p);
  const isBlackPiece = (p) => p && '♟♜♞♝♛♚'.includes(p);

  const handleCellClick = (row, col) => {
    const piece = board[row][col];
    if (selected) {
      const [sr, sc] = selected;
      if (sr === row && sc === col) { setSelected(null); return; }
      const newBoard = board.map(r => [...r]);
      newBoard[row][col] = newBoard[sr][sc];
      newBoard[sr][sc] = null;
      setBoard(newBoard);
      setSelected(null);
      setTurn(t => t === 'white' ? 'black' : 'white');
    } else {
      if (piece && ((turn === 'white' && isWhitePiece(piece)) || (turn === 'black' && isBlackPiece(piece)))) {
        setSelected([row, col]);
      }
    }
  };

  return (
    <div className="p-3">
      <p className="text-center text-white/60 text-xs mb-2">Turn: <span className={`font-bold ${turn === 'white' ? 'text-white' : 'text-gray-400'}`}>{turn}</span></p>
      <div className="grid grid-cols-8 border border-white/20 rounded-xl overflow-hidden w-64 mx-auto">
        {board.map((row, ri) => row.map((cell, ci) => {
          const isLight = (ri + ci) % 2 === 0;
          const isSelected = selected?.[0] === ri && selected?.[1] === ci;
          return (
            <button
              key={`${ri}-${ci}`}
              onClick={() => handleCellClick(ri, ci)}
              className={`w-8 h-8 flex items-center justify-center text-lg transition-all ${
                isSelected ? 'bg-yellow-400/60' :
                isLight ? 'bg-[#f0d9b5]' : 'bg-[#b58863]'
              } hover:brightness-110`}
            >
              {cell}
            </button>
          );
        }))}
      </div>
      <button onClick={() => setBoard(initialBoard)} className="w-full mt-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm transition-colors">
        🔄 Reset Board
      </button>
    </div>
  );
}

export default function MiniGame({ onClose }) {
  const [game, setGame] = useState(null);

  const GAMES = [
    { id: 'tictactoe', name: 'Tic-Tac-Toe', emoji: '⭕', desc: 'Classic X vs O' },
    { id: 'chess', name: 'Chess', emoji: '♟️', desc: 'Strategy board game' },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-3xl w-full max-w-sm">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {game && (
              <button onClick={() => setGame(null)} className="text-white/40 hover:text-white mr-1">←</button>
            )}
            <h3 className="text-white font-bold">🎮 Mini Games</h3>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
        </div>

        {!game ? (
          <div className="p-4 space-y-3">
            {GAMES.map((g) => (
              <button
                key={g.id}
                onClick={() => setGame(g.id)}
                className="w-full flex items-center gap-4 bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-400/50 rounded-2xl p-4 transition-all text-left"
              >
                <span className="text-4xl">{g.emoji}</span>
                <div>
                  <p className="text-white font-semibold">{g.name}</p>
                  <p className="text-white/40 text-xs">{g.desc}</p>
                </div>
                <span className="ml-auto text-white/30">→</span>
              </button>
            ))}
          </div>
        ) : game === 'tictactoe' ? (
          <TicTacToe onClose={() => setGame(null)} />
        ) : (
          <ChessBoard onClose={() => setGame(null)} />
        )}
      </div>
    </div>
  );
}