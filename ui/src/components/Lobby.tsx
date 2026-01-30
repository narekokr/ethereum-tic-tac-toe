import type { PendingGame } from '../hooks/useContract';
import { GameCard } from './GameCard';

interface LobbyProps {
  games: PendingGame[];
  onCreateGame: () => void;
  onJoinGame: (id: bigint, buyin: bigint) => void;
}

export function Lobby({ games, onCreateGame, onJoinGame }: LobbyProps) {
  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-slate-700">Open Lobby</h2>
        <button
          onClick={onCreateGame}
          className="bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-700 cursor-pointer"
        >
          Create Game
        </button>
      </div>
      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
        {games.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl">
            <p className="text-gray-400">No pending games found</p>
          </div>
        ) : (
          games.map((game) => (
            <GameCard key={game.id.toString()} game={game} onJoin={onJoinGame} />
          ))
        )}
      </div>
    </div>
  );
}
