import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, History, LogOut, User } from 'lucide-react';

export default function UserNavbar({ user, onLogout, onHome, onOpenHistory, onOpenAuth }) {
    const [showMenu, setShowMenu] = useState(false);
    const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
    const avatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-slate-950/70 backdrop-blur-xl border-b border-white/[0.06]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
                <div className="flex items-center">
                    <button onClick={onHome} className="flex items-center gap-2 hover:opacity-80 transition">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Brain size={16} className="text-white" />
                        </div>
                        <span className="text-white font-bold text-sm tracking-tight hidden sm:block">InterVue AI</span>
                    </button>
                </div>

                <div className="relative">
                    {user ? (
                        <>
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="flex items-center gap-2.5 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl transition"
                            >
                                {avatar ? (
                                    <img src={avatar} alt="" className="w-7 h-7 rounded-lg object-cover" />
                                ) : (
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center">
                                        <User size={14} className="text-blue-300" />
                                    </div>
                                )}
                                <span className="text-white text-sm font-medium max-w-[120px] truncate hidden sm:block">{displayName}</span>
                            </button>

                            {showMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, y: -5, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        className="absolute right-0 top-12 w-52 py-1.5 rounded-xl border border-white/10 shadow-2xl z-50"
                                        style={{ background: 'rgba(15,23,42,0.97)', backdropFilter: 'blur(20px)' }}
                                    >
                                        <div className="px-4 py-2.5 border-b border-white/[0.06]">
                                            <p className="text-white text-sm font-semibold truncate">{displayName}</p>
                                            <p className="text-slate-500 text-xs truncate">{user?.email}</p>
                                        </div>
                                        <div className="p-1.5 space-y-1">
                                            <button
                                                onClick={() => { setShowMenu(false); onOpenHistory ? onOpenHistory() : onHome(); }}
                                                className="w-full px-3 py-2 text-left text-blue-400 hover:bg-blue-500/10 rounded-lg transition flex items-center gap-2 text-sm"
                                            >
                                                <History size={14} />
                                                Dashboard
                                            </button>
                                            <button
                                                onClick={() => { setShowMenu(false); onLogout(); }}
                                                className="w-full px-3 py-2 text-left text-red-400 hover:bg-red-500/10 rounded-lg transition flex items-center gap-2 text-sm"
                                            >
                                                <LogOut size={14} />
                                                Sign Out
                                            </button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </>
                    ) : (
                        <button
                            onClick={onOpenAuth}
                            className="px-5 py-2 min-w-[120px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl transition shadow-lg shadow-blue-500/20"
                        >
                            Log in
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
