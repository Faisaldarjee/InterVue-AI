import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader, AlertCircle, Brain, Sparkles } from 'lucide-react';
import { signUpWithEmail, signInWithEmail, signInWithGoogle } from '../utils/supabaseClient';

// ==================== AUTH PAGES ====================
export default function AuthPages({ onAuthSuccess }) {
    const [mode, setMode] = useState('login'); // login | signup
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (mode === 'signup') {
                if (!fullName.trim()) {
                    setError('Please enter your name');
                    setLoading(false);
                    return;
                }
                if (password.length < 6) {
                    setError('Password must be at least 6 characters');
                    setLoading(false);
                    return;
                }
                const { data, error: authError } = await signUpWithEmail(email, password, fullName);
                if (authError) throw authError;

                if (data?.user?.identities?.length === 0) {
                    setError('An account with this email already exists');
                } else if (data?.session) {
                    onAuthSuccess(data.session);
                } else {
                    setSuccess('Account created! Check your email for verification link.');
                }
            } else {
                const { data, error: authError } = await signInWithEmail(email, password);
                if (authError) throw authError;
                if (data?.session) {
                    onAuthSuccess(data.session);
                }
            }
        } catch (err) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        setError('');
        setGoogleLoading(true);
        try {
            const { error: authError } = await signInWithGoogle();
            if (authError) throw authError;
            // Google OAuth redirects, so no need to handle success here
        } catch (err) {
            setError(err.message || 'Google sign-in failed');
            setGoogleLoading(false);
        }
    };

    const pageVariants = {
        initial: { opacity: 0, x: mode === 'signup' ? 30 : -30 },
        animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
        exit: { opacity: 0, x: mode === 'signup' ? -30 : 30, transition: { duration: 0.2 } },
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4 overflow-hidden">
            {/* Animated Background Orbs */}
            <div className="fixed inset-0 overflow-hidden -z-10">
                <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-blue-600 rounded-full mix-blend-multiply filter blur-[120px] opacity-25 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-purple-600 rounded-full mix-blend-multiply filter blur-[120px] opacity-25 animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-600 rounded-full mix-blend-multiply filter blur-[120px] opacity-15 animate-pulse" style={{ animationDelay: '4s' }}></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo Header */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                        style={{
                            background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(168,85,247,0.3))',
                            border: '1px solid rgba(59,130,246,0.4)',
                            backdropFilter: 'blur(10px)',
                        }}
                    >
                        <Brain size={32} className="text-blue-400" />
                    </motion.div>
                    <h1 className="text-3xl font-bold text-white mb-1">InterVue AI</h1>
                    <p className="text-slate-400 text-sm">
                        {mode === 'login' ? 'Welcome back! Sign in to continue.' : 'Create your account to get started.'}
                    </p>
                </div>

                {/* Auth Card */}
                <div
                    style={{
                        background: 'linear-gradient(135deg, rgba(15,23,42,0.8) 0%, rgba(30,58,138,0.3) 50%, rgba(15,23,42,0.8) 100%)',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        border: '1px solid rgba(59,130,246,0.2)',
                        borderRadius: '24px',
                        padding: '32px',
                    }}
                >
                    {/* Google OAuth Button */}
                    <button
                        onClick={handleGoogleAuth}
                        disabled={googleLoading}
                        className="w-full py-3.5 bg-white hover:bg-gray-50 text-gray-800 font-semibold rounded-xl transition-all flex items-center justify-center gap-3 mb-6 disabled:opacity-50 group shadow-lg"
                    >
                        {googleLoading ? (
                            <Loader size={20} className="animate-spin" />
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                        )}
                        <span className="group-hover:translate-x-0.5 transition-transform">Continue with Google</span>
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 h-px bg-slate-700"></div>
                        <span className="text-slate-500 text-xs font-medium">or continue with email</span>
                        <div className="flex-1 h-px bg-slate-700"></div>
                    </div>

                    {/* Form */}
                    <AnimatePresence mode="wait">
                        <motion.form
                            key={mode}
                            variants={pageVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            onSubmit={handleEmailAuth}
                            className="space-y-4"
                        >
                            {/* Name Field (signup only) */}
                            {mode === 'signup' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                                    <div className="relative">
                                        <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Faisal Darjee"
                                            className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {/* Email Field */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        required
                                        className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                                <div className="relative">
                                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                        className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-11 pr-12 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-2.5 rounded-xl border border-red-400/20 text-sm"
                                >
                                    <AlertCircle size={16} className="flex-shrink-0" />
                                    <span>{error}</span>
                                </motion.div>
                            )}

                            {/* Success */}
                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 text-green-400 bg-green-400/10 px-4 py-2.5 rounded-xl border border-green-400/20 text-sm"
                                >
                                    <Sparkles size={16} className="flex-shrink-0" />
                                    <span>{success}</span>
                                </motion.div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group shadow-lg shadow-blue-900/20"
                            >
                                {loading ? (
                                    <>
                                        <Loader size={20} className="animate-spin" />
                                        {mode === 'login' ? 'Signing In...' : 'Creating Account...'}
                                    </>
                                ) : (
                                    <>
                                        {mode === 'login' ? 'Sign In' : 'Create Account'}
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </motion.form>
                    </AnimatePresence>

                    {/* Toggle Login/Signup */}
                    <div className="text-center mt-6">
                        <p className="text-slate-500 text-sm">
                            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                            <button
                                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess(''); }}
                                className="text-blue-400 hover:text-blue-300 font-semibold ml-1.5 transition"
                            >
                                {mode === 'login' ? 'Sign Up' : 'Sign In'}
                            </button>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-600 text-xs mt-6">
                    Powered by InterVue AI
                </p>
            </motion.div>
        </div>
    );
}
