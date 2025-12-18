import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { MultiplayerChessBoard } from '../components/MultiplayerChessBoard';
import { Chess } from 'chess.js';

interface GameState {
    gameId: string;
    playerColor: 'white' | 'black';
    timeControl?: number; // Time control in milliseconds
    opponent: {
        username: string;
        elo: number;
    };
    whitePlayer: {
        username: string;
        elo: number;
    };
    blackPlayer: {
        username: string;
        elo: number;
    };
}

interface GameEndData {
    winner: 'white' | 'black' | 'draw';
    reason: string;
    white: {
        username: string;
        oldElo: number;
        newElo: number;
        change: number;
    };
    black: {
        username: string;
        oldElo: number;
        newElo: number;
        change: number;
    };
}

export default function MultiplayerGamePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { socket, connected } = useSocket();

    // Check for game state from location.state OR sessionStorage (from toast acceptance)
    const loadGameState = (): GameState | null => {
        if (location.state?.gameState) {
            return location.state.gameState;
        }

        const pending = sessionStorage.getItem('pendingGameState');
        if (pending) {
            sessionStorage.removeItem('pendingGameState');
            return JSON.parse(pending);
        }

        return null;
    };

    const [gameState] = useState<GameState | null>(loadGameState());

    // Debug: Log gameState on mount
    useEffect(() => {
        console.log('🎮 MultiplayerGamePage mounted with gameState:', gameState);
    }, []);

    const [chess] = useState(new Chess());
    const [fen, setFen] = useState(chess.fen());
    const [turn, setTurn] = useState<'w' | 'b'>('w');
    const [gameEnded, setGameEnded] = useState(false);
    const [gameEndData, setGameEndData] = useState<GameEndData | null>(null);
    const [isResigning, setIsResigning] = useState(false);
    const [showResignConfirm, setShowResignConfirm] = useState(false);

    // Timer state - initialize from gameState if available
    const [whiteTime, setWhiteTime] = useState(gameState?.timeControl || 0);
    const [blackTime, setBlackTime] = useState(gameState?.timeControl || 0);
    const [timeControl, setTimeControl] = useState(gameState?.timeControl || 0);

    // Track last turn change to prevent timer drift
    const lastTurnChangeRef = useRef<number>(Date.now());

    // Removed aggressive redirect check - if user navigates here, trust the navigation
    // If gameState is missing, socket listeners will handle it

    useEffect(() => {
        if (!socket || !connected || !gameState) {
            console.log('⚠️ Waiting for socket/gameState...', { socket: !!socket, connected, gameState: !!gameState });
            return;
        }

        console.log('Game page mounted with socket:', socket.id, 'gameId:', gameState.gameId);

        // Join the game room on the server
        console.log('📥 Joining game room with gameId:', gameState.gameId);
        socket.emit('join_game', { gameId: gameState.gameId });

        // Listen for game start
        socket.on('game_start', (data) => {
            console.log('Game started:', data);
            chess.load(data.fen);
            setFen(data.fen);
            setTurn(chess.turn());

            // Initialize timer from server
            if (data.timeControl) {
                setTimeControl(data.timeControl);
                setWhiteTime(data.whiteTime || data.timeControl);
                setBlackTime(data.blackTime || data.timeControl);
            }
        });

        // Listen for moves
        socket.on('move_made', (data) => {
            console.log('Move made:', data);
            chess.load(data.fen);
            setFen(data.fen);
            setTurn(data.turn);

            // CRITICAL: Update timer from server IMMEDIATELY to prevent desync
            // This ensures the frozen timer shows the correct value
            if (data.whiteTime !== undefined && data.blackTime !== undefined) {
                setWhiteTime(data.whiteTime);
                setBlackTime(data.blackTime);
                // Reset timer sync timestamp
                lastTurnChangeRef.current = Date.now();
            }
        });

        // Listen for invalid moves
        socket.on('invalid_move', (data) => {
            alert(`Invalid move: ${data.error}`);
        });

        // Listen for game end
        socket.on('game_over', (data: GameEndData) => {
            console.log('Game over received:', data);
            setShowResignConfirm(false);
            setIsResigning(false);
            setGameEnded(true);
            setGameEndData(data);
        });

        socket.on('error', (data) => {
            console.error('Socket error:', data);
            setIsResigning(false);
        });

        return () => {
            socket.off('game_start');
            socket.off('move_made');
            socket.off('invalid_move');
            socket.off('game_over');
            socket.off('error');
        };
    }, [socket, connected, gameState, navigate, chess]);

    // Client-side timer display - only for visual countdown
    // Server is authoritative for time
    useEffect(() => {
        if (gameEnded || !timeControl) return;

        const interval = setInterval(() => {
            // Only decrement the time for the player whose turn it is
            if (turn === 'w') {
                setWhiteTime(prev => {
                    const newTime = Math.max(0, prev - 1000);
                    // Check for timeout
                    if (newTime === 0 && prev > 0) {
                        console.log('White ran out of time!');
                    }
                    return newTime;
                });
            } else {
                setBlackTime(prev => {
                    const newTime = Math.max(0, prev - 1000);
                    // Check for timeout
                    if (newTime === 0 && prev > 0) {
                        console.log('Black ran out of time!');
                    }
                    return newTime;
                });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [turn, gameEnded, timeControl]);

    const handleMove = (from: string, to: string, promotion?: string) => {
        if (!socket || !gameState || gameEnded) return;

        // Emit move to server
        console.log('Sending move to server:', { gameId: gameState.gameId, from, to, promotion });
        socket.emit('make_move', {
            gameId: gameState.gameId,
            from,
            to,
            promotion
        });
    };

    const handleResignClick = () => {
        if (!socket || !gameState || gameEnded || isResigning) {
            return;
        }
        // Show custom confirm dialog
        setShowResignConfirm(true);
    };

    const confirmResign = () => {
        if (!socket || !gameState) return;

        console.log('Confirming resignation for game:', gameState.gameId);
        setIsResigning(true);
        setShowResignConfirm(false);
        socket.emit('resign', { gameId: gameState.gameId });
    };

    const cancelResign = () => {
        setShowResignConfirm(false);
    };

    const handleCloseGameEnd = () => {
        navigate('/ranked');
    };

    if (!gameState) {
        return null;
    }

    const isMyTurn = (turn === 'w' && gameState.playerColor === 'white') ||
        (turn === 'b' && gameState.playerColor === 'black');

    // Format time as MM:SS
    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white md:p-8">
            <div className="max-w-6xl mx-auto px-2 md:px-0">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-8 gap-2">
                    <h1 className="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                        Chess ELO <span className="text-slate-500 text-sm md:text-lg font-normal ml-2">/ Live Game</span>
                    </h1>
                    <div className="text-xs md:text-sm text-slate-400">
                        {connected ? '🟢 Connected' : '🔴 Disconnected'}
                    </div>
                </header>

                {/* Mobile: Stack layout vertically, Desktop: Side by side */}
                <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 md:gap-6">
                    {/* Player info above board on mobile */}
                    <div className="lg:hidden space-y-3">
                        {/* Black Player (opponent on mobile if you're white) */}
                        <div className={`bg-slate-900/50 border rounded-xl p-3 ${gameState.playerColor === 'black' ? 'border-blue-500' : 'border-slate-700'
                            } ${turn === 'b' && !gameEnded ? 'ring-2 ring-blue-400' : ''}`}>
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="text-xs text-slate-400">⚫ Black</div>
                                    <div className="font-bold">{gameState.blackPlayer.username}</div>
                                    <div className="text-sm text-slate-400">{gameState.blackPlayer.elo} ELO</div>
                                </div>
                                {timeControl > 0 && (
                                    <div className={`text-xl md:text-2xl font-mono font-bold ${turn === 'b' && !gameEnded ? 'text-blue-400' : 'text-slate-400'
                                        }`}>
                                        🕐 {formatTime(blackTime)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Chess Board */}
                    <div className="lg:col-span-2 flex justify-center">
                        <div className="w-full max-w-full lg:max-w-[600px]">
                            <MultiplayerChessBoard
                                position={fen}
                                onMove={handleMove}
                                playerColor={gameState.playerColor === 'white' ? 'w' : 'b'}
                                isMyTurn={isMyTurn}
                            />
                        </div>
                    </div>

                    {/* Player info below board on mobile, sidebar on desktop */}
                    <div className="lg:hidden space-y-3">
                        {/* Turn indicator on mobile */}
                        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-center">
                            <div className="text-xs text-slate-400 mb-1">Turn</div>
                            <div className={`text-lg font-bold ${isMyTurn ? 'text-green-400' : 'text-slate-400'}`}>
                                {turn === 'w' ? '⚪ White' : '⚫ Black'}
                            </div>
                            {isMyTurn && (
                                <div className="text-xs text-green-400 mt-1">Your turn!</div>
                            )}
                        </div>

                        {/* White Player */}
                        <div className={`bg-slate-900/50 border rounded-xl p-3 ${gameState.playerColor === 'white' ? 'border-blue-500' : 'border-slate-700'
                            } ${turn === 'w' && !gameEnded ? 'ring-2 ring-blue-400' : ''}`}>
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="text-xs text-slate-400">⚪ White</div>
                                    <div className="font-bold">{gameState.whitePlayer.username}</div>
                                    <div className="text-sm text-slate-400">{gameState.whitePlayer.elo} ELO</div>
                                </div>
                                {timeControl > 0 && (
                                    <div className={`text-xl md:text-2xl font-mono font-bold ${turn === 'w' && !gameEnded ? 'text-blue-400' : 'text-slate-400'
                                        }`}>
                                        🕐 {formatTime(whiteTime)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Desktop Sidebar - Hidden on mobile */}
                    <div className="hidden lg:block space-y-4">
                        {/* Black Player Info */}
                        <div className={`bg-slate-900/50 border rounded-xl p-4 ${gameState.playerColor === 'black' ? 'border-blue-500' : 'border-slate-700'
                            } ${turn === 'b' && !gameEnded ? 'ring-2 ring-blue-400' : ''}`}>
                            <div className="text-sm text-slate-400 mb-1">⚫ Black</div>
                            <div className="font-bold">{gameState.blackPlayer.username}</div>
                            <div className="text-sm text-slate-400">{gameState.blackPlayer.elo} ELO</div>

                            {/* Timer */}
                            {timeControl > 0 && (
                                <div className={`mt-2 text-2xl font-mono font-bold ${turn === 'b' && !gameEnded ? 'text-blue-400' : 'text-slate-400'
                                    }`}>
                                    🕐 {formatTime(blackTime)}
                                </div>
                            )}
                        </div>

                        {/* Turn Indicator */}
                        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-center">
                            <div className="text-sm text-slate-400 mb-2">Turn</div>
                            <div className={`text-xl font-bold ${isMyTurn ? 'text-green-400' : 'text-slate-400'}`}>
                                {turn === 'w' ? '⚪ White' : '⚫ Black'}
                            </div>
                            {isMyTurn && (
                                <div className="text-sm text-green-400 mt-1">Your turn!</div>
                            )}
                        </div>

                        {/* White Player Info */}
                        <div className={`bg-slate-900/50 border rounded-xl p-4 ${gameState.playerColor === 'white' ? 'border-blue-500' : 'border-slate-700'
                            } ${turn === 'w' && !gameEnded ? 'ring-2 ring-blue-400' : ''}`}>
                            <div className="text-sm text-slate-400 mb-1">⚪ White</div>
                            <div className="font-bold">{gameState.whitePlayer.username}</div>
                            <div className="text-sm text-slate-400">{gameState.whitePlayer.elo} ELO</div>

                            {/* Timer */}
                            {timeControl > 0 && (
                                <div className={`mt-2 text-2xl font-mono font-bold ${turn === 'w' && !gameEnded ? 'text-blue-400' : 'text-slate-400'
                                    }`}>
                                    🕐 {formatTime(whiteTime)}
                                </div>
                            )}
                        </div>

                        {/* Resign Button - Desktop */}
                        {!gameEnded && (
                            <button
                                onClick={handleResignClick}
                                disabled={isResigning}
                                className={`w-full px-4 py-3 rounded-lg font-bold transition-all ${isResigning
                                    ? 'bg-slate-600 cursor-not-allowed'
                                    : 'bg-red-600 hover:bg-red-500'
                                    }`}
                            >
                                {isResigning ? '⏳ Resigning...' : '🏳️ Resign'}
                            </button>
                        )}
                    </div>

                    {/* Resign Button - Mobile */}
                    <div className="lg:hidden">
                        {!gameEnded && (
                            <button
                                onClick={handleResignClick}
                                disabled={isResigning}
                                className={`w-full px-4 py-3 rounded-lg font-bold transition-all ${isResigning
                                    ? 'bg-slate-600 cursor-not-allowed'
                                    : 'bg-red-600 hover:bg-red-500'
                                    }`}
                            >
                                {isResigning ? '⏳ Resigning...' : '🏳️ Resign'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Resign Confirmation Modal */}
            {showResignConfirm && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-sm w-full mx-4">
                        <h2 className="text-xl font-bold mb-4 text-center">🏳️ Resign Game?</h2>
                        <p className="text-slate-400 text-center mb-6">
                            Are you sure you want to resign? This will count as a loss.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={cancelResign}
                                className="flex-1 bg-slate-700 hover:bg-slate-600 px-4 py-3 rounded-lg font-bold transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmResign}
                                className="flex-1 bg-red-600 hover:bg-red-500 px-4 py-3 rounded-lg font-bold transition-all"
                            >
                                Resign
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Game End Modal */}
            {gameEnded && gameEndData && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 max-w-md w-full mx-4">
                        <h2 className="text-3xl font-bold mb-4 text-center">
                            {gameEndData.winner === 'draw' ? '🤝 Draw!' :
                                (gameEndData.winner === gameState.playerColor ? '🎉 You Won!' : '😔 You Lost')}
                        </h2>
                        <div className="text-center text-slate-400 mb-6">
                            Game ended by {gameEndData.reason}
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="bg-slate-800 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold">{gameEndData.white.username}</span>
                                    <span className="text-slate-400">⚪ White</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-2xl font-bold text-emerald-400">
                                        {gameEndData.white.newElo}
                                    </span>
                                    <span className={`text-lg ${gameEndData.white.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {gameEndData.white.change > 0 ? '+' : ''}{gameEndData.white.change}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-slate-800 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold">{gameEndData.black.username}</span>
                                    <span className="text-slate-400">⚫ Black</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-2xl font-bold text-emerald-400">
                                        {gameEndData.black.newElo}
                                    </span>
                                    <span className={`text-lg ${gameEndData.black.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {gameEndData.black.change > 0 ? '+' : ''}{gameEndData.black.change}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleCloseGameEnd}
                            className="w-full bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg font-bold transition-all"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
