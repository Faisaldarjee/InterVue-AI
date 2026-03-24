import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Brain, History, LogOut, User } from 'lucide-react';

export default function UserNavbar({ user, onLogout, onHome, onOpenHistory, onOpenAuth }) {
    const [showMenu, setShowMenu] = useState(false);
    const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
    const avatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#050816]/72 backdrop-blur-2xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
                <div className="flex items-center gap-3">
                    <button onClick={onHome} className="group flex items-center gap-3 transition">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 shadow-[0_12px_30px_rgba(37,99,235,0.28)]">
                            <Brain size={16} className="text-white" />
                        </div>
                        <div className="hidden text-left sm:block">
                            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-cyan-300/75">Workspace</p>
                            <p className="text-sm font-bold tracking-tight text-white group-hover:text-cyan-100">InterVue AI</p>
                        </div>
                    </button>
                </div>

                <div className="relative flex items-center gap-2.5">
                    {user && (
                        <button
                            onClick={onOpenHistory}
                            className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/8 md:inline-flex"
                        >
                            <History size={14} className="text-cyan-300" />
                            Dashboard
                            <ArrowUpRight size={13} className="text-slate-500" />
                        </button>
                    )}
                    {user ? (
                        <>
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="flex items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 transition hover:border-white/[0.14] hover:bg-white/[0.08]"
                            >
                                {avatar ? (
                                    <img src={avatar} alt="" className="h-8 w-8 rounded-xl object-cover ring-1 ring-white/10" />
                                ) : (
                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/25 to-indigo-500/25">
                                        <User size={14} className="text-blue-300" />
                                    </div>
                                )}
                                <div className="hidden text-left sm:block">
                                    <p className="max-w-[140px] truncate text-sm font-semibold text-white">{displayName}</p>
                                    <p className="max-w-[160px] truncate text-[11px] text-slate-500">{user?.email}</p>
                                </div>
                            </button>

                            {showMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, y: -5, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        className="absolute right-0 top-14 z-50 w-60 rounded-2xl border border-white/10 py-1.5 shadow-2xl"
                                        style={{ background: 'rgba(8,13,28,0.96)', backdropFilter: 'blur(24px)' }}
                                    >
                                        <div className="border-b border-white/[0.06] px-4 py-3">
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300/70">Account</p>
                                            <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                                            <p className="truncate text-xs text-slate-500">{user?.email}</p>
                                        </div>
                                        <div className="p-1.5 space-y-1">
                                            <button
                                                onClick={() => { setShowMenu(false); onOpenHistory ? onOpenHistory() : onHome(); }}
                                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-cyan-300 transition hover:bg-cyan-500/10"
                                            >
                                                <History size={14} />
                                                Dashboard
                                            </button>
                                            <button
                                                onClick={() => { setShowMenu(false); onLogout(); }}
                                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-red-300 transition hover:bg-red-500/10"
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
                            className="min-w-[128px] rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-[0_14px_32px_rgba(34,211,238,0.18)] transition hover:from-cyan-400 hover:to-blue-500"
                        >
                            Log in
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
