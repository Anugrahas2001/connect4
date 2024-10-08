"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const socket_io_1 = require("socket.io");
const http_1 = __importDefault(require("http"));
const app = (0, express_1.default)();
const port = 3000;
console.log(port, "3000");
app.use((0, cors_1.default)());
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});
let game = {
    board: Array(6)
        .fill(null)
        .map(() => Array(7).fill(null)),
    players: {},
    currentPlayer: "red",
};
console.log(game.board, "board");
io.on("connection", (socket) => {
    console.log(`Player is connected with id ${socket.id}`);
    socket.on("joinGame", () => {
        let playersCount = Object.keys(game.players).length;
        console.log(playersCount, "count");
        if (playersCount < 2) {
            console.log("started");
            const color = playersCount === 0 ? "red" : "yellow";
            console.log(color, "checking");
            game.players[socket.id] = color;
            console.log(`player ${socket.id} joined as color ${color}`);
            socket.emit("playerColor", { color });
            if (Object.keys(game.players).length === 2) {
                console.log("Two players joined");
                io.emit("opponentJoined");
            }
        }
    });
    socket.on("makeMove", ({ column }) => {
        console.log(column, "column");
        let gameBoard = game.board;
        let currentPlayer = game.players[socket.id];
        let row = -1;
        for (let r = game.board.length - 1; r >= 0; r--) {
            if (!gameBoard[r][column]) {
                row = r;
                break;
            }
        }
        if (row != -1) {
            gameBoard[row][column] = currentPlayer;
            console.log("updated gameBoard", gameBoard);
            io.emit("updatedBoard", {
                board: gameBoard,
                currentPlayer: currentPlayer === "red" ? "yellow" : "red",
            });
        }
        const winner = checkWinner(gameBoard);
        if (winner) {
            io.emit("gameOver", { winner });
        }
        else {
            game.currentPlayer = currentPlayer === "red" ? "yellow" : "red";
        }
    });
    socket.on("disconnect", () => {
        console.log(`player with id ${socket.id} disconnected`);
        delete game.players[socket.id];
    });
    socket.on("newGame", () => {
        (game.board = Array(6)
            .fill(null)
            .map(() => Array(7).fill(null))),
            (game.currentPlayer = "red");
        io.emit("updatedBoard", {
            board: game.board,
            currentPlayer: game.currentPlayer,
        });
    });
});
const checkWinner = (board) => {
    const rows = board.length;
    const cols = board[0].length;
    const checkSequence = (sequence) => {
        return sequence.every((cell) => cell !== null && cell === sequence[0]);
    };
    //horizontal check
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols - 3; col++) {
            const sequence = [
                board[row][col],
                board[row][col + 1],
                board[row][col + 2],
                board[row][col + 3],
            ];
            if (checkSequence(sequence)) {
                return board[row][col];
            }
        }
    }
    //vertical check
    for (let row = 0; row < rows - 3; row++) {
        for (let col = 0; col < cols; col++) {
            const sequence = [
                board[row][col],
                board[row + 1][col],
                board[row + 2][col],
                board[row + 3][col],
            ];
            if (checkSequence(sequence)) {
                return board[row][col];
            }
        }
    }
    //diagonal check (bottom to top)
    for (let row = 0; row < rows - 3; row++) {
        for (let col = 0; col < cols - 3; col++) {
            const sequence = [
                board[row][col],
                board[row + 1][col + 1],
                board[row + 2][col + 2],
                board[row + 3][col + 3],
            ];
            if (checkSequence(sequence)) {
                return board[row][col];
            }
        }
    }
    //diagonal check (top to bottom)
    for (let row = 3; row < rows; row++) {
        for (let col = 0; col < cols - 3; col++) {
            const sequence = [
                board[row][col],
                board[row - 1][col + 1],
                board[row - 2][col + 2],
                board[row - 3][col + 3],
            ];
            if (checkSequence(sequence)) {
                return board[row][col];
            }
        }
    }
    return null;
};
server.listen(3000, () => console.log(`Server is running at port 3000`));
