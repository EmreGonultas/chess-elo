/**
 * Matchmaking Queue System
 * Handles player queuing and pairing for ranked matches
 */

export interface QueuedPlayer {
    userId: string;
    username: string;
    elo: number;
    socketId: string;
    joinedAt: Date;
    timeControl: number; // milliseconds (300000 = 5min, 600000 = 10min)
}

export interface MatchPair {
    player1: QueuedPlayer;
    player2: QueuedPlayer;
}

export class MatchmakingQueue {
    private queue: QueuedPlayer[] = [];

    /**
     * Add a player to the matchmaking queue
     */
    addPlayer(userId: string, username: string, elo: number, socketId: string, timeControl: number = 600000): void {
        // Check if player already in queue
        const existing = this.queue.find(p => p.userId === userId);
        if (existing) {
            console.log(`Player ${username} already in queue`);
            return;
        }

        const player: QueuedPlayer = {
            userId,
            username,
            elo,
            socketId,
            joinedAt: new Date(),
            timeControl
        };

        this.queue.push(player);
        console.log(`Player ${username} (${elo} ELO, ${timeControl / 60000}min) joined queue. Queue size: ${this.queue.length}`);
    }

    /**
     * Remove a player from the queue
     */
    removePlayer(userId: string): boolean {
        const index = this.queue.findIndex(p => p.userId === userId);
        if (index !== -1) {
            const removed = this.queue.splice(index, 1)[0];
            console.log(`Player ${removed.username} left queue. Queue size: ${this.queue.length}`);
            return true;
        }
        return false;
    }

    /**
     * Try to match two players from the queue
     * Matches players with the same time control preference
     */
    tryMatch(): MatchPair | null {
        if (this.queue.length >= 2) {
            // Try to find two players with matching time control
            for (let i = 0; i < this.queue.length; i++) {
                for (let j = i + 1; j < this.queue.length; j++) {
                    if (this.queue[i].timeControl === this.queue[j].timeControl) {
                        // Remove in reverse order to maintain indices
                        const player2 = this.queue.splice(j, 1)[0];
                        const player1 = this.queue.splice(i, 1)[0];

                        console.log(`✅ Matched ${player1.username} (${player1.elo}) vs ${player2.username} (${player2.elo}) - ${player1.timeControl / 60000}min time control`);

                        return { player1, player2 };
                    }
                }
            }
            console.log('⏳ No matching time controls in queue. Waiting for more players...');
        }
        return null;
    }

    /**
     * Get player's position in queue
     */
    getPosition(userId: string): number {
        const index = this.queue.findIndex(p => p.userId === userId);
        return index !== -1 ? index + 1 : -1;
    }

    /**
     * Get current queue size
     */
    getSize(): number {
        return this.queue.length;
    }

    /**
     * Remove player by socket ID (for disconnect handling)
     */
    removeBySocketId(socketId: string): boolean {
        const index = this.queue.findIndex(p => p.socketId === socketId);
        if (index !== -1) {
            const removed = this.queue.splice(index, 1)[0];
            console.log(`Player ${removed.username} removed from queue (disconnect)`);
            return true;
        }
        return false;
    }
}
