// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TicTacToe {
    address public player1;
    address public player2;
    address public activePlayer;
    //bool public gameStarted;      I don't understand use of gameStarted because gameActive should do the same (Maybe I'm wrong)
    bool public gameActive;
    uint public lastMoveTime;
    uint public timeoutSec = 10;
    uint public buyin = 1 ether;
    
    // Board: 0 = empty, 1 = Player 1 (X), 2 = Player 2 (O)
    uint8[9] public board;

    event PlayerJoined(address player, uint8 playerNumber);
    event MoveMade(address player, uint8 position);
    event GameOver(address winner);

    // No arguments needed in the constructor anymore
    constructor() {}

    // Players call this to join the game
    function joinGame() public payable {
        //require(!gameStarted, "Game already full");
        require(!gameActive, "Game already full");
        require(msg.sender != player1, "Already joined");
        require(msg.value == buyin, "You must pay the buy-in");

        address(this).call{value: msg.value};

        if (player1 == address(0)) {
            player1 = msg.sender;
            emit PlayerJoined(msg.sender, 1);
        } else {
            player2 = msg.sender;
            //gameStarted = true;
            gameActive = true;
            activePlayer = player1; // Player 1 starts
            emit PlayerJoined(msg.sender, 2);
            lastMoveTime = block.timestamp;
        }
    }

    function makeMove(uint8 position) public {
        require(gameActive, "Game is not active");
        require(msg.sender == activePlayer, "Not your turn");
        require(position < 9, "Invalid position");
        require(board[position] == 0, "Spot already taken");

        board[position] = (msg.sender == player1) ? 1 : 2;
        emit MoveMade(msg.sender, position);

        lastMoveTime = block.timestamp;
        if (checkWinner()) {
            msg.sender.call{value: address(this).balance}("");
            emit GameOver(msg.sender);
            resetGame();
        } else if (isBoardFull()) {
            player1.call{value: address(this).balance/2}("");
            player2.call{value: address(this).balance}("");
            emit GameOver(address(0)); // Draw
            resetGame();
        } else {
            activePlayer = (activePlayer == player1) ? player2 : player1;
        }
    }

    function checkWinner() private view returns (bool) {
        uint8[3][8] memory winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
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

    function getBoard() public view returns (uint8[9] memory) {
        return board;
    }

    function claimWin() public {
        require(gameActive == true, "Game is not active");
        require(msg.sender == player1 || msg.sender == player2, "You are not playing");
        require(msg.sender != activePlayer, "It's your turn");
        require(elapsedTime() > timeoutSec, "Opponent hasn't time out yet");  
        msg.sender.call{value: address(this).balance}("");
        emit GameOver(msg.sender);
        resetGame();
    }

    // Stop game, clear board and clear players
    function resetGame() private {
        gameActive = false;
        for (uint i=0; i<=8; i++){
            board[i] = 0;
        }
        player1 = address(0);
        player2 = address(0);
        activePlayer = address(0);
    }

    function elapsedTime() public view returns(uint){
        require(gameActive == true, "Game is not active");
        return block.timestamp-lastMoveTime;
    }
}