import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, ABI } from '../config/contract';

export function getProvider() {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }
  return new ethers.BrowserProvider(window.ethereum);
}

export async function getContract(withSigner = false) {
  const provider = getProvider();
  if (withSigner) {
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  }
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
}

export async function connectWallet(): Promise<string> {
  const provider = getProvider();
  const accounts = await provider.send("eth_requestAccounts", []);
  return accounts[0];
}

export async function getConnectedAccount(): Promise<string | null> {
  try {
    const provider = getProvider();
    const accounts = await provider.listAccounts();
    if (accounts.length > 0) {
      return accounts[0].address;
    }
  } catch {
    // No wallet connected
  }
  return null;
}

export async function getPlayerGameId(address: string): Promise<number> {
  try {
    const contract = await getContract();
    const id = await contract.playerToGame(address);
    return Number(id);
  } catch {
    // Contract reverts if player has no game
    return 0;
  }
}

export async function getBoard(): Promise<number[]> {
  const contract = await getContract(true); // Need signer for msg.sender
  const board = await contract.getBoard();
  return Array.from(board).map((cell) => Number(cell));
}

export interface GameDetails {
  player1: string;
  player2: string;
  activePlayer: string;
  gameActive: boolean;
  lastMoveTime: bigint;
  buyin: bigint;
}

export async function getGameDetails(gameId: number): Promise<GameDetails | null> {
  try {
    const contract = await getContract();
    const game = await contract.games(gameId);
    return {
      player1: game[0],
      player2: game[1],
      activePlayer: game[2],
      gameActive: game[3],
      lastMoveTime: game[4],
      buyin: game[5],
    };
  } catch (e) {
    console.error("Failed to get game details:", e);
    return null;
  }
}

export function isGameActive(gameDetails: GameDetails | null): boolean {
  if (!gameDetails) return false;
  // gameActive is set to true when player 2 joins
  return gameDetails.gameActive;
}

export interface PendingGame {
  id: bigint;
  buyin: bigint;
}

export async function getPendingGames(): Promise<PendingGame[]> {
  const contract = await getContract();
  const list = await contract.getPendingGames();
  return list.map((g: [bigint, bigint]) => ({ id: g[0], buyin: g[1] }));
}

export async function createGame(buyinEth: string): Promise<void> {
  const contract = await getContract(true);
  const value = ethers.parseEther(buyinEth);
  const tx = await contract.createGame(value, { value });
  await tx.wait();
}

export async function joinGame(id: bigint, buyin: bigint): Promise<void> {
  const contract = await getContract(true);
  const tx = await contract.joinGame(id, { value: buyin });
  await tx.wait();
}

export async function leavePendingGame(): Promise<void> {
  const contract = await getContract(true);
  const tx = await contract.leavePendingGame();
  await tx.wait();
}

export async function makeMove(position: number): Promise<void> {
  const contract = await getContract(true);
  const tx = await contract.makeMove(position);
  await tx.wait();
}
