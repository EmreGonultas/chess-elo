import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GamePage from './pages/GamePage';
import DashboardPage from './pages/DashboardPage';
import LeaderboardPage from './pages/LeaderboardPage';
import LandingPage from './pages/LandingPage';
import MultiplayerGamePage from './pages/MultiplayerGamePage';
import SocialPage from './pages/SocialPage';
import AdminPage from './pages/AdminPage';
import Navbar from './components/Navbar';
import { useEffect } from 'react';

// Layout with Navbar and navigation event listener
const Layout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for custom navigation events from SocketContext
    const handleNavigateToGame = (event: CustomEvent) => {
      console.log('📱 navigate-to-game event received, navigating...');
      const { gameState } = event.detail;
      navigate('/game', { state: { gameState } });
    };

    window.addEventListener('navigate-to-game', handleNavigateToGame as EventListener);
    return () => window.removeEventListener('navigate-to-game', handleNavigateToGame as EventListener);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <Outlet />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
            {/* Public Routes with Navbar */}
            <Route element={<Layout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/practice" element={<GamePage />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/ranked" element={<DashboardPage />} />
                <Route path="/dashboard" element={<Navigate to="/ranked" replace />} />
                <Route path="/social" element={<SocialPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/game" element={<MultiplayerGamePage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Route>
            </Route>

            {/* Auth Pages */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}
