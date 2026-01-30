interface GameBoardProps {
  gameId: number;
  board: number[];
  waitingForOpponent: boolean;
  onMove: (position: number) => void;
  onSync: () => void;
  onLeave: () => void;
}

export function GameBoard({ gameId, board, waitingForOpponent, onMove, onSync, onLeave }: GameBoardProps) {
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
        <h2 className="text-xl font-bold mt-2">Match in Progress</h2>
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

      <button
        onClick={onSync}
        className="text-slate-400 text-xs font-bold hover:text-indigo-500 transition cursor-pointer"
      >
        Manually Sync Board
      </button>
    </div>
  );
}
