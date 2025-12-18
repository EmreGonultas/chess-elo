export interface RankInfo {
    name: string;
    tier: string;
    asset: string;
    textColor: string;
    bgColor: string; // For dots/badges
    isRainbow?: boolean; // For Paragon RGB effect
}

export const getRankInfo = (elo: number): RankInfo => {
    if (elo >= 2500) {
        return {
            name: 'Paragon',
            tier: 'V',
            asset: '/rank_assets/Paragon.png',
            // Animated RGB cycling glow effect
            textColor: 'animate-rgb-text font-bold',
            bgColor: 'bg-gradient-to-r from-red-500 via-yellow-400 to-blue-500',
            isRainbow: true
        };
    }
    if (elo >= 2000) {
        return {
            name: 'Ascendant',
            tier: 'IV',
            asset: '/rank_assets/Ascendant.png',
            // Red with strong red glow
            textColor: 'text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]',
            bgColor: 'bg-red-500'
        };
    }
    if (elo >= 1500) {
        return {
            name: 'Eclipse',
            tier: 'III',
            asset: '/rank_assets/Eclipse.png',
            // Purple with medium purple glow
            textColor: 'text-purple-400 drop-shadow-[0_0_10px_rgba(192,132,252,0.7)]',
            bgColor: 'bg-purple-400'
        };
    }
    if (elo >= 1000) {
        return {
            name: 'Rift',
            tier: 'II',
            asset: '/rank_assets/Rift.png',
            // Green (swapped from blue)
            textColor: 'text-emerald-400',
            bgColor: 'bg-emerald-400'
        };
    }
    return {
        name: 'Pulse',
        tier: 'I',
        asset: '/rank_assets/Pulse.png',
        // Blue (swapped from green, entry level)
        textColor: 'text-blue-400',
        bgColor: 'bg-blue-400'
    };
};
