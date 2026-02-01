interface HeaderProps {
  account: string | null;
  onConnect: () => void;
}

export function Header({ account, onConnect }: HeaderProps) {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tighter">TIC-TAC-TOE</h1>
        <div className="h-1 w-12 bg-indigo-500 rounded-full"></div>
      </div>
      {!account ? (
        <button
          onClick={onConnect}
          className="bg-indigo-600 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-indigo-200 hover:scale-105 transition cursor-pointer"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="text-right">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Connected As</p>
          <p className="text-xs font-mono font-bold text-indigo-600">
            {account.slice(0, 6)}...{account.slice(-4)}
          </p>
        </div>
      )}
    </div>
  );
}
