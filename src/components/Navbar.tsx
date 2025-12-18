import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRankInfo } from '../utils/rank-utils';
import { useState } from 'react';

export default function Navbar() {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isActive = (path: string) => location.pathname === path;

    const navLinks = [
        { path: '/', label: 'HOME' },
        { path: '/ranked', label: 'RANKED' },
        { path: '/leaderboard', label: 'LEADERBOARD' },
        { path: '/practice', label: 'PRACTICE' },
        { path: '/social', label: 'SOCIAL' },
    ];

    return (
        <nav className="w-full bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
            {/* Logo */}
            <Link to="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 font-mono tracking-tighter hover:opacity-80 transition-opacity">
                CHESS ELO
            </Link>

            {/* Desktop Links - Hidden on mobile/tablet */}
            <div className="hidden lg:flex gap-8">
                {navLinks.map(link => (
                    <Link
                        key={link.path}
                        to={link.path}
                        className={`text-sm font-bold tracking-wide transition-colors ${isActive(link.path) || (link.path === '/ranked' && isActive('/dashboard'))
                            ? 'text-white'
                            : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        {link.label}
                    </Link>
                ))}
            </div>

            {/* Desktop Auth Buttons - Hidden on mobile/tablet */}
            <div className="hidden lg:flex gap-4 items-center">
                <AuthButtons />
            </div>

            {/* Mobile Hamburger - Shown on mobile/tablet */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden text-white text-3xl focus:outline-none"
                aria-label="Toggle menu"
            >
                {isMobileMenuOpen ? '✕' : '☰'}
            </button>

            {/* Mobile Menu Overlay and Panel */}
            {isMobileMenuOpen && (
                <>
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    {/* Slide-in Menu */}
                    <div className="fixed top-0 right-0 h-full w-64 bg-slate-900 shadow-2xl z-50 lg:hidden animate-slide-in">
                        {/* Close Button */}
                        <div className="flex justify-end p-4">
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-white text-3xl"
                            >
                                ✕
                            </button>
                        </div>

                        {/* User Info (if authenticated) */}
                        <div className="px-6 py-4 border-b border-slate-700">
                            <MobileAuthInfo onClose={() => setIsMobileMenuOpen(false)} />
                        </div>

                        {/* Navigation Links */}
                        <div className="flex flex-col py-4">
                            {navLinks.map(link => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`px-6 py-4 text-lg font-bold transition-colors ${isActive(link.path) || (link.path === '/ranked' && isActive('/dashboard'))
                                        ? 'text-white bg-slate-800'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </nav>
    );
}

function AuthButtons() {
    const { isAuthenticated, logout, user } = useAuth();
    const navigate = useNavigate();
    const rank = getRankInfo(user?.elo || 800);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (isAuthenticated) {
        return (
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 bg-slate-800/50 py-1.5 px-4 rounded-full border border-slate-700">
                    <div className={`w-2 h-2 rounded-full ${rank.bgColor} animate-pulse`} />
                    <span className="text-slate-200 font-bold text-sm tracking-wide">
                        {user?.username || 'Loading...'}
                    </span>
                    <span className="text-slate-500 text-xs border-l border-slate-700 pl-3">
                        {user?.elo || 800} ELO
                    </span>
                </div>

                <button
                    onClick={handleLogout}
                    className="group flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors text-sm font-medium"
                    title="Logout"
                >
                    <span>Logout</span>
                </button>
            </div>
        );
    }

    return (
        <div className="flex gap-4">
            <Link
                to="/login"
                className="px-4 py-2 text-sm font-bold text-slate-300 hover:text-white transition-colors"
            >
                Login
            </Link>
            <Link
                to="/register"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-md transition-all shadow-lg hover:shadow-blue-500/25"
            >
                Sign Up
            </Link>
        </div>
    );
}

function MobileAuthInfo({ onClose }: { onClose: () => void }) {
    const { isAuthenticated, logout, user } = useAuth();
    const navigate = useNavigate();
    const rank = getRankInfo(user?.elo || 800);

    const handleLogout = () => {
        logout();
        navigate('/');
        onClose();
    };

    if (isAuthenticated) {
        return (
            <>
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-3 h-3 rounded-full ${rank.bgColor} animate-pulse`} />
                    <div>
                        <div className="text-white font-bold text-lg">{user?.username}</div>
                        <div className="text-slate-400 text-sm">{user?.elo} ELO</div>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-md transition-colors"
                >
                    Logout
                </button>
            </>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <Link
                to="/login"
                onClick={onClose}
                className="w-full px-4 py-2 text-center text-white font-bold bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
            >
                Login
            </Link>
            <Link
                to="/register"
                onClick={onClose}
                className="w-full px-4 py-2 text-center bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-md transition-colors"
            >
                Sign Up
            </Link>
        </div>
    );
}
