// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title TicTacToe
 * @dev A simple 1 ETH buy-in TicTacToe game with timeout protection.
 */
contract TicTacToe {
    address public player1;
    address public player2;
    address public activePlayer;
    bool public gameActive;
    
    uint public lastMoveTime;
    uint public timeoutSec = 5 minutes; // Set to 5 mins for realistic block times
    uint public buyin = 1 ether;
    
    // Board: 0 = empty, 1 = Player 1 (X), 2 = Player 2 (O)
    uint8[9] public board;

    event PlayerJoined(address player, uint8 playerNumber);
    event MoveMade(address player, uint8 position);
    event GameOver(address winner, uint prizePool);

    constructor() {}

    /**
     * @dev Players call this to join. The 1 ETH is automatically held by the contract.
     */
    function joinGame() public payable {
        require(!gameActive, "Game is currently in progress");
        require(player2 == address(0), "Wait for the previous game to be reset");
        require(msg.sender != player1, "You are already Player 1");
        require(msg.value == buyin, "Must stake exactly 1 ETH");

        if (player1 == address(0)) {
            player1 = msg.sender;
            emit PlayerJoined(msg.sender, 1);
        } else {
            player2 = msg.sender;
            gameActive = true;
            activePlayer = player1; // Player 1 always starts
            lastMoveTime = block.timestamp;
            emit PlayerJoined(msg.sender, 2);
        }
    }

    /**
     * @dev Submit a move (0-8). Checks for win or draw conditions.
     */
    function makeMove(uint8 position) public {
        require(gameActive, "Game is not active");
        require(msg.sender == activePlayer, "Not your turn");
        require(position < 9, "Invalid position (0-8)");
        require(board[position] == 0, "Spot already taken");

        // Record the move
        board[position] = (msg.sender == player1) ? 1 : 2;
        emit MoveMade(msg.sender, position);
        lastMoveTime = block.timestamp;

        if (checkWinner()) {
            distributeFunds(msg.sender);
        } else if (isBoardFull()) {
            distributeFunds(address(0)); // Signifies a draw
        } else {
            // Switch turns
            activePlayer = (activePlayer == player1) ? player2 : player1;
        }
    }

    /**
     * @dev If a player stops playing, the other player can claim the full prize after the timeout.
     */
    function claimWin() public {
        require(gameActive, "Game is not active");
        require(msg.sender == player1 || msg.sender == player2, "You are not a participant");
        require(msg.sender != activePlayer, "You cannot claim win on your own turn");
        require(block.timestamp > lastMoveTime + timeoutSec, "Timeout has not passed yet");

        distributeFunds(msg.sender);
    }

    /**
     * @dev Internal function to handle payouts and reset state.
     */
    function distributeFunds(address winner) private {
        uint totalPrize = address(this).balance;

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

        resetGame();
    }

    function checkWinner() private view returns (bool) {
        uint8[3][8] memory winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
            [0, 4, 8], [2, 4, 6]             // Diagonals
        ];
        uint8 playerVal = (activePlayer == player1) ? 1 : 2;

        for (uint i = 0; i < 8; i++) {
            if (board[winPatterns[i][0]] == playerVal &&
                board[winPatterns[i][1]] == playerVal &&
                board[winPatterns[i][2]] == playerVal) {
                return true;
            }
        }
        return false;
    }

    function isBoardFull() private view returns (bool) {
        for (uint i = 0; i < 9; i++) {
            if (board[i] == 0) return false;
        }
        return true;
    }

    function resetGame() private {
        delete board; // Resets all 9 elements to 0
        player1 = address(0);
        player2 = address(0);
        activePlayer = address(0);
        gameActive = false;
    }

    function getBoard() public view returns (uint8[9] memory) {
        return board;
    }
    
    // Helper to check time remaining for the UI
    function timeUntilTimeout() public view returns (uint) {
        if (!gameActive || block.timestamp >= lastMoveTime + timeoutSec) return 0;
        return (lastMoveTime + timeoutSec) - block.timestamp;
    }
}