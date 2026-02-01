// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title TicTacToe
 * @dev A simple 1 ETH buy-in TicTacToe game with timeout protection.
 */
contract TicTacToe {
    // address public player1;
    // address public player2;
    // address public activePlayer;
    // bool public gameActive;

    //Pending game (One player created, waiting for another)
    struct PendingGame{
        uint id;
        uint buyin;
    }
    PendingGame[] pendingGames;

    uint nextid = 1;

    struct Game{
        address player1;
        address player2;
        address activePlayer;
        bool gameActive;
        uint lastMoveTime;
        uint buyin;
        uint8[9] board;
    }
    //id to game mapping
    mapping(uint => Game) public games;

    mapping(address => uint) public playerToGame;
    
    // uint public lastMoveTime;
    uint public timeoutSec = 5 minutes; // Set to 5 mins for realistic block times
    // uint public buyin = 1 ether;
    
    // Board: 0 = empty, 1 = Player 1 (X), 2 = Player 2 (O)
    // uint8[9] public board;

    event PlayerJoined(address player, uint8 playerNumber);
    event MoveMade(address player, uint8 position);
    event GameOver(address winner, uint prizePool);

    constructor() {}

    // Creates a game with custom buyin
    function createGame(uint buyin2) public payable {
        require(playerToGame[msg.sender] == 0, "You already participate in a game");
        require(msg.value == buyin2, "You have to pay the buy-in you declared");
        uint8[9] memory board;
        games[nextid] = Game(msg.sender,address(0),msg.sender,false,0,buyin2,board);
        playerToGame[msg.sender] = nextid;
        nextid++;
        updatePendingGames();
    } 

    function leavePendingGame() public {
        uint id = playerToGame[msg.sender];
        require(id != 0, "You aren't currently in a game");
        require(!(games[id].gameActive), "Game already started");
        games[id].player1 = address(0);
        (bool success, ) = (msg.sender).call{value: games[id].buyin}("");
        require(success, "Payout failed");
        playerToGame[msg.sender] = 0;
        updatePendingGames();
    }

    function joinGame(uint id) public payable {
        require(playerToGame[msg.sender] == 0, "You already participate in a game");
        require(games[id].player1 != address(0), "Game not found");
        require(!(games[id].gameActive), "Game already started");
        require(msg.value == games[id].buyin, "You have to pay the exact buy-in");
        games[id].player2 = msg.sender;
        playerToGame[msg.sender] = id;
        games[id].gameActive = true;
        games[id].lastMoveTime = block.timestamp; 
        updatePendingGames();  
    }

    function updatePendingGames() private{
        while(pendingGames.length > 0) pendingGames.pop();
        for(uint i = 1; i<nextid; i++){
            if (games[i].player1 != address(0) && !(games[i].gameActive)){
                pendingGames.push(PendingGame(i,games[i].buyin));
            }
        }
    }

    function getPendingGames() public view returns(PendingGame[] memory){
        return pendingGames;
    }

    /**
     * @dev Players call this to join. The 1 ETH is automatically held by the contract.
     */
    // function joinGame() public payable {
    //     require(!gameActive, "Game is currently in progress");
    //     require(player2 == address(0), "Wait for the previous game to be reset");
    //     require(msg.sender != player1, "You are already Player 1");
    //     require(msg.value == buyin, "Must stake exactly 1 ETH");

    //     if (player1 == address(0)) {
    //         player1 = msg.sender;
    //         emit PlayerJoined(msg.sender, 1);
    //     } else {
    //         player2 = msg.sender;
    //         gameActive = true;
    //         activePlayer = player1; // Player 1 always starts
    //         lastMoveTime = block.timestamp;
    //         emit PlayerJoined(msg.sender, 2);
    //     }
    // }

    /**
     * @dev Submit a move (0-8). Checks for win or draw conditions.
     */
    function makeMove(uint8 position) public {
        uint id = playerToGame[msg.sender];
        require(id != 0 && games[id].gameActive, "You are not participating in an active game");
        require(msg.sender == games[id].activePlayer, "Not your turn");
        require(position < 9, "Invalid position (0-8)");
        require(games[id].board[position] == 0, "Spot already taken");

        // Record the move
        games[id].board[position] = (msg.sender == games[id].player1) ? 1 : 2;
        emit MoveMade(msg.sender, position);
        games[id].lastMoveTime = block.timestamp;

        if (checkWinner()) {
            distributeFunds(msg.sender,id);
        } else if (isBoardFull()) {
            distributeFunds(address(0),id); // Signifies a draw
        } else {
            // Switch turns
            games[id].activePlayer = (games[id].activePlayer == games[id].player1) ? games[id].player2 : games[id].player1;
        }
    }

    /**
     * @dev If a player stops playing, the other player can claim the full prize after the timeout.
     */
    function claimWin() public {
        uint id = playerToGame[msg.sender];
        require(id != 0 && games[id].gameActive, "You are not participating in an active game");
        require(msg.sender == games[id].player1 || msg.sender == games[id].player2, "You are not a participant");
        require(msg.sender != games[id].activePlayer, "You cannot claim win on your own turn");
        require(block.timestamp > games[id].lastMoveTime + timeoutSec, "Timeout has not passed yet");

        distributeFunds(msg.sender,id);
    }

    /**
     * @dev Internal function to handle payouts and reset state.
     */
    function distributeFunds(address winner, uint id) private {
        uint totalPrize = games[id].buyin*2;
        address player1 = games[id].player1;
        address player2 = games[id].player2;

        if (winner != address(0)) {
            // Pay winner
            (bool success, ) = winner.call{value: totalPrize}("");
            require(success, "Payout failed");
            emit GameOver(winner, totalPrize);
        } else {
            // Draw: Refund 1 ETH to each
            uint half = totalPrize / 2;
            (bool s1, ) = player1.call{value: half}("");
            (bool s2, ) = player2.call{value: half}("");
            require(s1 && s2, "Refund failed");
            emit GameOver(address(0), 0);
        }
        
        playerToGame[player1] = 0;
        playerToGame[player2] = 0;
        games[id].player1 = address(0);
        games[id].player2 = address(0);
        // resetGame();
    }

    function checkWinner() private view returns (bool) {
        uint id = playerToGame[msg.sender];
        // Load board into memory for cheaper access
        uint8[9] memory b = games[id].board;
        // Determine if we are checking for Player 1 (1) or Player 2 (2)
        uint8 p = (games[id].activePlayer == games[id].player1) ? 1 : 2;

        // Mathematical Calculation (Bitmasking):
        // Convert the board state into a single binary integer (mask).
        // If player occupies position 'i', we add 2^i to the mask.
        // This is done using bitwise OR (|) and bit shifting (<<).
        uint16 mask = 
            (b[0] == p ? uint16(1) : 0)      | 
            (b[1] == p ? uint16(2) : 0)      | 
            (b[2] == p ? uint16(4) : 0)      | 
            (b[3] == p ? uint16(8) : 0)      | 
            (b[4] == p ? uint16(16) : 0)     | 
            (b[5] == p ? uint16(32) : 0)     | 
            (b[6] == p ? uint16(64) : 0)     | 
            (b[7] == p ? uint16(128) : 0)    | 
            (b[8] == p ? uint16(256) : 0);

        // Check against the 8 winning patterns:
        // Rows:       0,1,2 (7)   | 3,4,5 (56)   | 6,7,8 (448)
        // Columns:    0,3,6 (73)  | 1,4,7 (146)  | 2,5,8 (292)
        // Diagonals:  0,4,8 (273) | 2,4,6 (84)
        return (
            (mask & 7 == 7)     || (mask & 56 == 56)   || (mask & 448 == 448) || 
            (mask & 73 == 73)   || (mask & 146 == 146) || (mask & 292 == 292) ||
            (mask & 273 == 273) || (mask & 84 == 84)
        );
    }

    function isBoardFull() private view returns (bool) {
        for (uint i = 0; i < 9; i++) {
            if (games[playerToGame[msg.sender]].board[i] == 0) return false;
        }
        return true;
    }

    // function resetGame() private {
    //     delete board; // Resets all 9 elements to 0
    //     player1 = address(0);
    //     player2 = address(0);
    //     activePlayer = address(0);
    //     gameActive = false;
    // }

    function getBoard() public view returns (uint8[9] memory) {
        uint id = playerToGame[msg.sender];
        require(id != 0 && games[id].gameActive, "You are not participating in an active game");
        return games[id].board;
    }
    
    // Helper to check time remaining for the UI
    function timeUntilTimeout() public view returns (uint) {
        uint id = playerToGame[msg.sender];
        if (!games[id].gameActive || block.timestamp >= games[id].lastMoveTime + timeoutSec) return 0;
        return (games[id].lastMoveTime + timeoutSec) - block.timestamp;
    }
}