import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Lobby } from './components/Lobby';
import { GameBoard } from './components/GameBoard';
import { LoadingOverlay } from './components/LoadingOverlay';
import {
  connectWallet,
  getConnectedAccount,
  getPlayerGameId,
  getBoard,
  getPendingGames,
  getGameDetails,
  isGameActive,
  createGame,
  joinGame,
  leavePendingGame,
  makeMove,
  claimWin,
  getTimeUntilTimeout,
  type PendingGame,
} from './hooks/useContract';

function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [pendingGames, setPendingGames] = useState<PendingGame[]>([]);
  const [currentGameId, setCurrentGameId] = useState(0);
  const [board, setBoard] = useState<number[]>(Array(9).fill(0));
  const [loading, setLoading] = useState(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [playerSymbol, setPlayerSymbol] = useState<'X' | 'O' | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [canClaimWin, setCanClaimWin] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const loadLobby = useCallback(async () => {
    try {
      const list = await getPendingGames();
      setPendingGames(list);
    } catch (e) {
      console.error("Lobby error", e);
    }
  }, []);

  const fetchBoard = useCallback(async () => {
    try {
      const b = await getBoard();
      setBoard(b);
    } catch {
      // Game might have ended - will be handled by next sync
    }
  }, []);

  const syncStatus = useCallback(async (addr: string) => {
    try {
      const numericId = await getPlayerGameId(addr);
      console.log("Current Game ID for user:", numericId);

      if (numericId !== 0) {
        setCurrentGameId(numericId);
        const gameDetails = await getGameDetails(numericId);
        const gameStarted = isGameActive(gameDetails);
        setWaitingForOpponent(!gameStarted);

        if (gameStarted && gameDetails) {
          const isPlayer1 = gameDetails.player1.toLowerCase() === addr.toLowerCase();
          setPlayerSymbol(isPlayer1 ? 'X' : 'O');
          const myTurn = gameDetails.activePlayer.toLowerCase() === addr.toLowerCase();
          setIsMyTurn(myTurn);
          setCanClaimWin(false); // Reset on game start
          const timeLeft = await getTimeUntilTimeout();
          setTimeRemaining(timeLeft);
          const b = await getBoard();
          setBoard(b);
        }
      } else {
        setCurrentGameId(0);
        setWaitingForOpponent(false);
        setPlayerSymbol(null);
        setIsMyTurn(false);
        void loadLobby();
      }
    } catch (e) {
      console.error("Sync failed", e);
    }
  }, [loadLobby]);

  // Auto-connect on load
  useEffect(() => {
    const autoConnect = async () => {
      const addr = await getConnectedAccount();
      if (addr) {
        setAccount(addr);
        await syncStatus(addr);
      }
    };
    void autoConnect();
  }, [syncStatus]);

  // Check for opponent joining
  const checkForOpponent = useCallback(async () => {
    if (currentGameId === 0 || !account) return;
    const gameDetails = await getGameDetails(currentGameId);
    const gameStarted = isGameActive(gameDetails);
    if (gameStarted && waitingForOpponent && gameDetails) {
      setWaitingForOpponent(false);
      const isPlayer1 = gameDetails.player1.toLowerCase() === account.toLowerCase();
      setPlayerSymbol(isPlayer1 ? 'X' : 'O');
      setIsMyTurn(gameDetails.activePlayer.toLowerCase() === account.toLowerCase());
      setCanClaimWin(false); // Reset when game starts
      const timeLeft = await getTimeUntilTimeout();
      setTimeRemaining(timeLeft);
      const b = await getBoard();
      setBoard(b);
    }
  }, [currentGameId, waitingForOpponent, account]);

  // Polling for updates
  useEffect(() => {
    const poll = async () => {
      if (currentGameId === 0) {
        void loadLobby();
      } else if (waitingForOpponent) {
        void checkForOpponent();
      } else {
        // Check if game still active before fetching board
        if (account) {
          const gameId = await getPlayerGameId(account);
          if (gameId === 0) {
            // Game ended (opponent won or draw)
            alert("Game Over!");
            setCurrentGameId(0);
            setBoard(Array(9).fill(0));
            setWaitingForOpponent(false);
            setPlayerSymbol(null);
            setIsMyTurn(false);
            setCanClaimWin(false);
            setTimeRemaining(null);
            void loadLobby();
            return;
          }
          // Update turn status and timeout
          const gameDetails = await getGameDetails(gameId);
          if (gameDetails) {
            const myTurn = gameDetails.activePlayer.toLowerCase() === account.toLowerCase();
            setIsMyTurn(myTurn);

            // Check timeout - can only claim if it's NOT your turn and timeout confirmed
            const timeLeft = await getTimeUntilTimeout();
            console.log("DEBUG timeout:", {
              myTurn,
              timeLeft,
              lastMoveTime: Number(gameDetails.lastMoveTime),
              now: Math.floor(Date.now() / 1000),
              canClaim: !myTurn && timeLeft !== null && timeLeft === 0
            });
            setTimeRemaining(timeLeft);
            // Only allow claim if we got a valid response (not null) and it's 0
            setCanClaimWin(!myTurn && timeLeft !== null && timeLeft === 0);
          }
        }
        void fetchBoard();
      }
    };

    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [currentGameId, waitingForOpponent, account, loadLobby, fetchBoard, checkForOpponent]);

  const handleConnect = async () => {
    if (!window.ethereum) {
      alert("Install MetaMask");
      return;
    }
    try {
      const addr = await connectWallet();
      setAccount(addr);
      await syncStatus(addr);
    } catch (e) {
      console.error("Connect failed", e);
    }
  };

  const handleCreateGame = async () => {
    const buyin = prompt("Enter stake in ETH (e.g. 0.1)", "0.1");
    if (!buyin) return;

    setLoading(true);
    try {
      await createGame(buyin);
      if (account) await syncStatus(account);
    } catch (e) {
      alert("Error creating game");
      console.error(e);
    }
    setLoading(false);
  };

  const handleJoinGame = async (id: bigint, buyin: bigint) => {
    setLoading(true);
    try {
      await joinGame(id, buyin);
      if (account) await syncStatus(account);
    } catch (e) {
      alert("Error joining game");
      console.error(e);
    }
    setLoading(false);
  };

  const handleLeave = async () => {
    setLoading(true);
    try {
      await leavePendingGame();
      setCurrentGameId(0);
      setBoard(Array(9).fill(0));
      setWaitingForOpponent(false);
      setPlayerSymbol(null);
      setIsMyTurn(false);
      setCanClaimWin(false);
      setTimeRemaining(null);
    } catch (e) {
      alert("Cannot leave active game");
      console.error(e);
    }
    setLoading(false);
  };

  const handleClaimWin = async () => {
    setLoading(true);
    try {
      await claimWin();
      alert("You claimed the win!");
      setCurrentGameId(0);
      setBoard(Array(9).fill(0));
      setWaitingForOpponent(false);
      setPlayerSymbol(null);
      setIsMyTurn(false);
      setCanClaimWin(false);
      setTimeRemaining(null);
      void loadLobby();
    } catch (e) {
      alert("Cannot claim win yet");
      console.error(e);
    }
    setLoading(false);
  };

  const handleMove = async (i: number) => {
    if (board[i] !== 0) return;

    setLoading(true);
    try {
      await makeMove(i);
      // Check if game still exists (might have ended with this move)
      if (account) {
        const gameId = await getPlayerGameId(account);
        if (gameId === 0) {
          // Game ended - return to lobby
          alert("Game Over!");
          setCurrentGameId(0);
          setBoard(Array(9).fill(0));
          setWaitingForOpponent(false);
          setPlayerSymbol(null);
          setIsMyTurn(false);
          setCanClaimWin(false);
          setTimeRemaining(null);
          void loadLobby();
        } else {
          setIsMyTurn(false); // After making a move, it's opponent's turn
          await fetchBoard();
        }
      }
    } catch (e) {
      alert("Not your turn!");
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-indigo-900 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="glass p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          <Header account={account} onConnect={handleConnect} />

          {account && (
            currentGameId === 0 ? (
              <Lobby
                games={pendingGames}
                onCreateGame={handleCreateGame}
                onJoinGame={handleJoinGame}
              />
            ) : (
              <GameBoard
                gameId={currentGameId}
                board={board}
                waitingForOpponent={waitingForOpponent}
                playerSymbol={playerSymbol}
                isMyTurn={isMyTurn}
                canClaimWin={canClaimWin}
                timeRemaining={timeRemaining}
                onMove={handleMove}
                onSync={fetchBoard}
                onLeave={handleLeave}
                onClaimWin={handleClaimWin}
              />
            )
          )}

          {loading && <LoadingOverlay />}
        </div>
      </div>
    </div>
  );
}

export default App;
