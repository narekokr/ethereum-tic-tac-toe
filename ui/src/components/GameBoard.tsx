interface GameBoardProps {
  gameId: number;
  board: number[];
  waitingForOpponent: boolean;
  playerSymbol: 'X' | 'O' | null;
  isMyTurn: boolean;
  canClaimWin: boolean;
  timeRemaining: number | null;
  onMove: (position: number) => void;
  onSync: () => void;
  onLeave: () => void;
  onClaimWin: () => void;
}

export function GameBoard({ gameId, board, waitingForOpponent, playerSymbol, isMyTurn, canClaimWin, timeRemaining, onMove, onSync, onLeave, onClaimWin }: GameBoardProps) {
  if (waitingForOpponent) {
    return (
      <div className="text-center animate-fadeIn">
        <div className="mb-6">
          <span className="bg-indigo-100 text-indigo-700 px-4 py-1 rounded-full text-xs font-bold">
            Game ID: #{gameId}
          </span>
        </div>

        <div className="py-12">
          <div className="flex justify-center mb-6">
            <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-16 w-16"></div>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Waiting for Opponent...</h2>
          <p className="text-sm text-gray-500">Share your Game ID for someone to join</p>
        </div>

        <button
          onClick={onLeave}
          className="bg-rose-50 text-rose-600 py-3 px-6 rounded-2xl font-bold text-sm hover:bg-rose-100 transition cursor-pointer"
        >
          Leave & Refund ETH
        </button>
      </div>
    );
  }

  return (
    <div className="text-center animate-fadeIn">
      <div className="mb-6">
        <span className="bg-indigo-100 text-indigo-700 px-4 py-1 rounded-full text-xs font-bold">
          Game ID: #{gameId}
        </span>
        <div className="mt-3 flex justify-center gap-4">
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
            playerSymbol === 'X'
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-rose-100 text-rose-600'
          }`}>
            You are {playerSymbol}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
            isMyTurn
              ? 'bg-green-100 text-green-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            {isMyTurn ? 'Your turn' : 'Waiting for opponent'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 w-72 mx-auto mb-8">
        {board.map((cell, i) => (
          <div
            key={i}
            onClick={() => onMove(i)}
            className="cell bg-slate-50 border-2 border-white rounded-2xl shadow-inner hover:bg-white hover:border-indigo-200 transition-all active:scale-90 cursor-pointer"
          >
            {cell === 1 ? (
              <span className="text-indigo-600 font-black">X</span>
            ) : cell === 2 ? (
              <span className="text-rose-500 font-black">O</span>
            ) : (
              ''
            )}
          </div>
        ))}
      </div>

      {!isMyTurn && timeRemaining !== null && timeRemaining > 0 && (
        <p className="text-amber-600 text-sm mb-4">
          Opponent has {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')} to make a move
        </p>
      )}

      {canClaimWin && (
        <button
          onClick={onClaimWin}
          className="bg-green-500 text-white py-3 px-6 rounded-2xl font-bold text-sm hover:bg-green-600 transition cursor-pointer mb-4"
        >
          Claim Win (Opponent Timed Out)
        </button>
      )}

      <button
        onClick={onSync}
        className="text-slate-400 text-xs font-bold hover:text-indigo-500 transition cursor-pointer"
      >
        Manually Sync Board
      </button>
    </div>
  );
}
