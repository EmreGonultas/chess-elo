import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { ChallengeToast } from '../components/ChallengeToast';

interface SocketContextType {
    socket: Socket | null;
    connected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    connected: false
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
    children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const [challengeToast, setChallengeToast] = useState<{
        show: boolean;
        challengerId: string;
        challengeId: string;
        challengerName: string;
        timeControl: number;
    } | null>(null);
    const { user, isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated && user) {
            // Connect to Socket.io server
            const newSocket = io('http://192.168.1.18:3000', {
                autoConnect: true,
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5
            });

            newSocket.on('connect', () => {
                console.log('✅ Connected to server:', newSocket.id);
                setConnected(true);

                // Register user for friend notifications globally
                // This ensures user shows as "online" regardless of which page they're on
                newSocket.emit('register_user', { userId: user.id });
                console.log('📝 Registered user globally for online status');
            });

            newSocket.on('disconnect', () => {
                console.log('❌ Disconnected from server');
                setConnected(false);
            });

            newSocket.on('error', (error) => {
                console.error('Socket error:', error);
            });

            // Global challenge notification - works even when not on Social page
            newSocket.on('challenge_received', (data: { challengeId: string, challengerId: string, challengerName: string, timeControl: number }) => {
                console.log('🎯 Challenge received from:', data.challengerName);

                // Store socket globally for toast to use
                (window as any).socketInstance = newSocket;

                // Only show toast if NOT on Social page
                // Social page has its own modal
                const isOnSocialPage = window.location.pathname === '/social';

                if (!isOnSocialPage) {
                    // Show toast notification with all data
                    setChallengeToast({
                        show: true,
                        challengerId: data.challengerId,
                        challengeId: data.challengeId,
                        challengerName: data.challengerName,
                        timeControl: data.timeControl
                    });
                }

                // Note: SocialPage will also handle the modal if user is on that page
            });

            // Listen for game_start to navigate user who accepted from toast
            newSocket.on('game_start', (data: any) => {
                console.log('🎮 game_start event received!', {
                    pathname: window.location.pathname,
                    gameId: data.gameId,
                    fullData: data
                });

                const isOnSocialPage = window.location.pathname === '/social';
                const isOnGamePage = window.location.pathname === '/game';

                console.log('Page check:', { isOnSocialPage, isOnGamePage });

                // Only handle if NOT already on Social or Game page
                // Social page has its own handler, Game page is already there
                if (!isOnSocialPage && !isOnGamePage) {
                    console.log('✅ Game starting from toast, navigating...');
                    console.log('Game data received:', {
                        gameId: data.gameId,
                        whiteUserId: data.white?.userId,
                        blackUserId: data.black?.userId
                    });
                    console.log('Current user from context:', user);

                    // Close toast
                    setChallengeToast(null);

                    // Determine player color - use user.id from context, fallback to localStorage
                    let userId = user?.id;
                    if (!userId) {
                        console.warn('⚠️ User not in context, falling back to localStorage');
                        const storedUser = localStorage.getItem('user');
                        if (storedUser) {
                            userId = JSON.parse(storedUser).id;
                        }
                    }

                    const playerColor = data.white.userId === userId ? 'white' : 'black';

                    console.log('Determined player color:', playerColor, {
                        whiteUserId: data.white.userId,
                        blackUserId: data.black.userId,
                        currentUserId: userId
                    });

                    const gameState = {
                        gameId: data.gameId,  // THIS IS CRITICAL
                        playerColor,
                        timeControl: data.timeControl,
                        opponent: playerColor === 'white' ? {
                            username: data.black.username,
                            elo: data.black.elo
                        } : {
                            username: data.white.username,
                            elo: data.white.elo
                        },
                        whitePlayer: {
                            username: data.white.username,
                            elo: data.white.elo
                        },
                        blackPlayer: {
                            username: data.black.username,
                            elo: data.black.elo
                        }
                    };

                    console.log('🔑 Built gameState with gameId:', gameState.gameId, 'Full gameState:', gameState);

                    // Store in sessionStorage AND location state
                    sessionStorage.setItem('pendingGameState', JSON.stringify(gameState));
                    console.log('💾 Stored in sessionStorage:', JSON.parse(sessionStorage.getItem('pendingGameState')!));

                    console.log('About to navigate to /game WITHOUT page reload...');

                    // CRITICAL: Use navigate through React Router to preserve socket connection
                    // Dispatch custom event that a component with useNavigate will handle
                    window.dispatchEvent(new CustomEvent('navigate-to-game', {
                        detail: { gameState }
                    }));
                } else {
                    console.log('❌ Skipping navigation - already on Social or Game page');
                }
            });

            // Listen for challenge declined
            newSocket.on('challenge_declined', ({ message }: { message: string }) => {
                console.log('Challenge declined:', message);
                // Hide toast
                setChallengeToast(null);
                // Could show a toast notification here if needed
            });

            setSocket(newSocket);

            return () => {
                newSocket.close();
            };
        } else {
            // Disconnect if logged out
            if (socket) {
                socket.close();
                setSocket(null);
                setConnected(false);
            }
        }
    }, [isAuthenticated, user]);

    return (
        <SocketContext.Provider value={{ socket, connected }}>
            {children}
            {challengeToast && (
                <ChallengeToast
                    challengerId={challengeToast.challengerId}
                    challengeId={challengeToast.challengeId}
                    challengerName={challengeToast.challengerName}
                    timeControl={challengeToast.timeControl}
                    onClose={() => setChallengeToast(null)}
                />
            )}
        </SocketContext.Provider>
    );
};
