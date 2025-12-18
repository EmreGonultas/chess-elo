import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


export default function LandingPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const handleJoinQueue = () => {
        if (isAuthenticated) {
            navigate('/ranked'); // Already logged in, go to dashboard
        } else {
            navigate('/login'); // Not logged in, go to login
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-blue-500/30">


            <main className="relative pt-20 pb-32 overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tight">
                        <span className="bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400">
                            MASTER THE
                        </span>
                        <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 animate-gradient-x">
                            GAME
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto mb-16 leading-relaxed">
                        Compete in global ranked matches or train against our advanced neural network engine.
                    </p>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Ranked Card */}
                        <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 cursor-pointer"
                            onClick={handleJoinQueue}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="bg-blue-500/10 w-16 h-16 rounded-xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                                <span className="text-3xl">🏆</span>
                            </div>
                            <h2 className="text-2xl font-bold mb-3 text-white">Play Ranked</h2>
                            <p className="text-slate-400 mb-8">Climb the ladder from Pulse to Paragon. Prove your worth against real players.</p>
                            <span className="inline-block py-3 px-8 rounded-full bg-blue-600 group-hover:bg-blue-500 text-white font-bold transition-colors">
                                Join Queue
                            </span>
                        </div>

                        {/* Practice Card */}
                        <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-2 cursor-pointer"
                            onClick={() => navigate('/practice')}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="bg-emerald-500/10 w-16 h-16 rounded-xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                                <span className="text-3xl">🤖</span>
                            </div>
                            <h2 className="text-2xl font-bold mb-3 text-white">Practice Bot</h2>
                            <p className="text-slate-400 mb-8">Test your skills against our adaptive AI engine. No limits, no pressure.</p>
                            <span className="inline-block py-3 px-8 rounded-full bg-slate-700 group-hover:bg-emerald-600 text-white font-bold transition-all">
                                Start Training
                            </span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
