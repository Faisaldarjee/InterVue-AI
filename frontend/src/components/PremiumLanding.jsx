import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles, CheckCircle2, FileText, Bot, Zap, Shield, Play } from 'lucide-react';

export default function PremiumLanding({ onLoginClick, onRegisterClick }) {
    const [scrolled, setScrolled] = useState(false);
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
    const y2 = useTransform(scrollY, [0, 1000], [0, -200]);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navNav = (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#030712]/80 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-6'}`}>
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
                        <Sparkles size={16} className="text-white" />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">InterVue AI</span>
                </div>
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
                    <a href="#features" className="hover:text-white transition-colors">Features</a>
                    <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
                    <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={onLoginClick} className="text-sm font-medium text-gray-300 hover:text-white transition-colors hidden sm:block">Log in</button>
                    <button onClick={onRegisterClick} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-bold hover:bg-gray-100 transition-transform hover:scale-105 active:scale-95 flex items-center gap-2">
                        Get Started <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </nav>
    );

    const hero = (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
            {/* Background elements */}
            <div className="absolute inset-0 bg-[#030712]" />
            <motion.div style={{ y: y1 }} className="absolute -top-[30%] -right-[10%] w-[1000px] h-[1000px] rounded-full bg-indigo-900/20 blur-[120px]" />
            <motion.div style={{ y: y2 }} className="absolute -bottom-[30%] -left-[10%] w-[800px] h-[800px] rounded-full bg-purple-900/20 blur-[120px]" />

            <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
                    <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    <span className="text-sm text-gray-300 font-medium">InterVue AI Platform is Live</span>
                </motion.div>

                <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }} className="text-6xl md:text-8xl font-black text-white tracking-tight leading-[1.1] mb-8">
                    Master the Interview.<br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                        Land the Job.
                    </span>
                </motion.h1>

                <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }} className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                    The ultimate AI ecosystem for ambitious professionals. Perfect your resume, practice realistic interviews, and get hired faster than ever.
                </motion.p>

                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button onClick={onRegisterClick} className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-black font-bold text-lg hover:bg-gray-100 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                        Start for free <ArrowRight size={20} />
                    </button>
                    <button onClick={onRegisterClick} className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 text-white font-bold text-lg border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-2 backdrop-blur-md">
                        <Play size={20} className="fill-white" /> Watch Demo
                    </button>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.6, ease: "easeOut" }} className="mt-24 relative mx-auto max-w-5xl">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent z-10 pointer-events-none h-full w-full" />
                    <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=2000&q=80" alt="App Dashboard" className="rounded-2xl border border-white/10 shadow-[0_0_100px_rgba(99,102,241,0.2)] opacity-80" />
                </motion.div>
            </div>
        </section>
    );

    const features = (
        <section id="features" className="py-32 bg-[#030712] border-y border-white/5 relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Everything you need to win</h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">We've built a comprehensive suite of tools designed to give you an unfair advantage in the hiring process.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { icon: <Bot size={32} />, title: "AI Mock Interviews", desc: "Realistic video & voice interviews with adaptive AI that tailors questions to your job description.", color: "text-blue-400", bg: "bg-blue-400/10" },
                        { icon: <FileText size={32} />, title: "Smart Resume Builder", desc: "Craft stunning resumes with ATS-optimized templates and AI-enhanced bullet points.", color: "text-purple-400", bg: "bg-purple-400/10" },
                        { icon: <Zap size={32} />, title: "Rapid Fire Mode", desc: "High-pressure, 60-second questions to sharpen your quick-thinking and communication skills.", color: "text-amber-400", bg: "bg-amber-400/10" }
                    ].map((f, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors relative overflow-hidden group">
                            <div className={`w-16 h-16 rounded-2xl ${f.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                <div className={f.color}>{f.icon}</div>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">{f.title}</h3>
                            <p className="text-gray-400 leading-relaxed">{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );

    const metrics = (
        <section className="py-24 bg-[#030712] relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { label: "Interviews Completed", value: "2M+" },
                        { label: "Avg. Salary Increase", value: "24%" },
                        { label: "User Satisfaction", value: "4.9/5" },
                        { label: "Active Users", value: "50k+" }
                    ].map((m, i) => (
                        <div key={i} className="text-center px-4">
                            <h4 className="text-4xl md:text-5xl font-black text-white mb-2">{m.value}</h4>
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">{m.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );

    const cta = (
        <section className="py-32 relative overflow-hidden bg-[#030712]">
            <div className="absolute inset-0 bg-gradient-to-b from-[#030712] to-indigo-950/20" />
            <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
                <h2 className="text-5xl md:text-6xl font-black text-white mb-8">Ready to step up your career?</h2>
                <p className="text-xl text-gray-400 mb-12">Join thousands of professionals landing their dream jobs with InterVue AI.</p>
                <button onClick={onRegisterClick} className="px-10 py-5 rounded-full bg-white text-black font-bold text-lg hover:bg-gray-100 transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                    Create your free account
                </button>
            </div>
        </section>
    );

    const footer = (
        <footer className="py-12 border-t border-white/5 bg-[#030712]">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-2 opacity-50">
                    <Sparkles size={16} className="text-white" />
                    <span className="text-lg font-bold text-white">InterVue AI</span>
                </div>
                <p className="text-gray-600 text-sm">© 2026 InterVue AI. All rights reserved.</p>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                    <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
                    <span className="hover:text-white transition-colors cursor-pointer">Terms</span>
                </div>
            </div>
        </footer>
    );

    return (
        <div className="min-h-screen bg-[#030712] selection:bg-indigo-500/30 overflow-hidden font-sans">
            {navNav}
            {hero}
            {metrics}
            {features}
            {cta}
            {footer}
        </div>
    );
}
