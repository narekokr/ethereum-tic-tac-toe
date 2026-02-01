import { ethers } from 'ethers';
import type { PendingGame } from '../hooks/useContract';

interface GameCardProps {
  game: PendingGame;
  onJoin: (id: bigint, buyin: bigint) => void;
}

export function GameCard({ game, onJoin }: GameCardProps) {
  return (
    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-indigo-200 transition">
      <div>
        <p className="font-bold text-slate-800">Game #{game.id.toString()}</p>
        <p className="text-xs text-indigo-500 font-bold">
          {ethers.formatEther(game.buyin)} ETH Stake
        </p>
      </div>
      <button
        onClick={() => onJoin(game.id, game.buyin)}
        className="bg-white text-indigo-600 border border-indigo-100 px-4 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-indigo-50 cursor-pointer"
      >
        Join Match
      </button>
    </div>
  );
}
