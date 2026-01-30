export const CONTRACT_ADDRESS = "0xedE64A0Da3C4Ed6dF6DaB2595ff0D3d98E8F36Bc";

export const ABI = [
  "function createGame(uint256 buyin2) public payable",
  "function joinGame(uint256 id) public payable",
  "function leavePendingGame() public",
  "function makeMove(uint8 position) public",
  "function getPendingGames() public view returns (tuple(uint256 id, uint256 buyin)[])",
  "function playerToGame(address) public view returns (uint256)",
  "function getBoard() public view returns (uint8[9] memory)",
  "function games(uint256) public view returns (address p1, address p2, address active, bool activeB, uint256 time, uint256 buyin)"
];
