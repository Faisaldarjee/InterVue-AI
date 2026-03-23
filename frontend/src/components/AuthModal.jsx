import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import AuthPages from './AuthPages';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, message }) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl overflow-hidden"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
                    >
                        <X size={18} />
                    </button>

                    {message && (
                        <div className="pt-6 px-6 pb-2 text-center">
                            <p className="text-indigo-400 font-medium text-sm bg-indigo-500/10 inline-block px-3 py-1 rounded-full">{message}</p>
                        </div>
                    )}

                    <div className="max-h-[85vh] overflow-y-auto custom-scrollbar">
                        {/* We wrap AuthPages so it handles its own logic inside our modal */}
                        {/* We might need to override some of AuthPages's full-screen styles by targeting its wrapper */}
                        <div className="[&>div]:min-h-0 [&>div]:bg-transparent [&>div]:py-0 [&_p.text-slate-400]:text-xs">
                            <AuthPages onAuthSuccess={onAuthSuccess} />
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
