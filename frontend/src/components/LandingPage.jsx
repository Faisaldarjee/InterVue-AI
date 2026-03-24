import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    AlertCircle, ArrowRight, BookOpen, Brain, Briefcase, CheckCircle,
    ChevronRight, FileText, Flame, Mic, PenTool, Shield, Sparkles,
    Star, Target, TrendingUp, Upload, Users, Zap
} from 'lucide-react';
import apiClient from '../utils/apiClient';
import { getStats } from '../utils/historyManager';

/* ═══════════════════════════════════════════════════════════════
   NOTIFICATION
   ═══════════════════════════════════════════════════════════════ */
function Notification({ message, type, onClose }) {
    React.useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, [onClose]);
    const isErr = type === 'error';
    return (
        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
            className={`fixed top-20 right-4 max-w-sm border p-4 rounded-2xl flex gap-3 z-[60] backdrop-blur-xl shadow-2xl text-sm font-medium ${isErr ? 'bg-red-500/10 border-red-500/25 text-red-300' : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'}`}>
            {isErr ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            <span>{message}</span>
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function LandingPage({
    isAuthenticated, userName, onStartInterview, onStartRapidFire,
    onStartResumeScorer, onStartResumeBuilder, onStartHistory,
}) {
    const [resumeFile, setResumeFile] = useState(null);
    const [jobRole, setJobRole] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const historyStats = getStats();
    const setupProgress = useMemo(() => {
        let p = 0;
        if (resumeFile) p++;
        if (jobRole.trim()) p++;
        if (jobDescription.trim()) p++;
        return p;
    }, [jobDescription, jobRole, resumeFile]);

    /* ─── Prep Modes ─── */
    const modes = [
        { title: 'Standard Interview', desc: 'Resume-aware mock interview with AI scoring, real interviewer-style probing questions, and detailed learning report.', action: () => document.getElementById('setup-section')?.scrollIntoView({ behavior: 'smooth' }), icon: Brain, color: 'blue', tag: 'Deep Practice' },
        { title: 'Rapid Fire', desc: 'Timed drills to sharpen technical recall, build pressure tolerance, and improve answer speed.', action: onStartRapidFire, icon: Flame, color: 'orange', tag: 'Speed Round' },
        { title: 'Resume Scorer', desc: 'AI-powered ATS analysis with gap detection, keyword optimization, and magic bullet rewrites.', action: onStartResumeScorer, icon: Shield, color: 'cyan', tag: 'CV Audit' },
        { title: 'Resume Builder', desc: 'Create ATS-optimized resumes with professional templates and AI-enhanced bullet points.', action: onStartResumeBuilder, icon: PenTool, color: 'emerald', tag: 'Build Faster' },
    ];

    const colorMap = {
        blue: { bg: 'from-blue-500/15 to-indigo-500/5', border: 'border-blue-500/20 hover:border-blue-400/40', icon: 'bg-blue-500/15 text-blue-400', tag: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
        orange: { bg: 'from-orange-500/15 to-rose-500/5', border: 'border-orange-500/20 hover:border-orange-400/40', icon: 'bg-orange-500/15 text-orange-400', tag: 'bg-orange-500/10 text-orange-300 border-orange-500/20' },
        cyan: { bg: 'from-cyan-500/15 to-sky-500/5', border: 'border-cyan-500/20 hover:border-cyan-400/40', icon: 'bg-cyan-500/15 text-cyan-400', tag: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' },
        emerald: { bg: 'from-emerald-500/15 to-teal-500/5', border: 'border-emerald-500/20 hover:border-emerald-400/40', icon: 'bg-emerald-500/15 text-emerald-400', tag: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
    };

    /* ─── Handlers ─── */
    const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type === 'dragenter' || e.type === 'dragover'); };
    const attachFile = (file) => { if (!file) return; if (file.type === 'application/pdf' || file.name.endsWith('.docx')) { setResumeFile(file); setSuccess('Resume selected!'); setError(null); } else setError('Please upload PDF or DOCX'); };
    const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); attachFile(e.dataTransfer.files?.[0]); };

    const handleStart = async () => {
        if (!resumeFile || !jobRole || !jobDescription) { setError('Please fill all fields'); return; }
        if (!isAuthenticated) {
            const cb = () => { window.removeEventListener('auth-success', cb); handleStart(); };
            window.addEventListener('auth-success', cb);
            window.dispatchEvent(new CustomEvent('require-auth', { detail: { message: 'Create a free account to generate your personalized AI interview.' } }));
            return;
        }
        setLoading(true); setError(null);
        try {
            const fd = new FormData();
            fd.append('file', resumeFile); fd.append('job_role', jobRole); fd.append('job_description', jobDescription);
            const { data } = await apiClient.post('/upload-resume', fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 });
            if (!data.session_id || !data.first_question) throw new Error('Invalid response');
            onStartInterview({ sessionId: data.session_id, analysis: data.analysis, firstQuestion: data.first_question, questions: data.questions_list || [], totalQuestions: data.total_questions || 4, jobRole, jobDescription, difficulty: data.difficulty, learningFocus: data.learning_focus, keyTopics: data.key_topics || [], interviewTips: data.interview_tips || [] });
        } catch (err) { setError(err.response?.data?.detail || err.message || 'Failed to start') }
        finally { setLoading(false); }
    };

    /* ─── Animation helpers ─── */
    const fade = (d = 0) => ({ initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0, transition: { duration: 0.6, delay: d, ease: [0.22, 0.68, 0, 1.07] } } });

    /* ═══════════════════════════════════════════════════════════════
       RENDER
       ═══════════════════════════════════════════════════════════════ */
    return (
        <div className="min-h-screen bg-[#04080F] text-white overflow-hidden">

            {/* ═══════ AMBIENT BG ═══════ */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
                {/* Large top glow */}
                <div className="absolute -top-[300px] left-1/2 -translate-x-1/2 w-[1200px] h-[700px] rounded-full opacity-[0.07]"
                    style={{ background: 'radial-gradient(ellipse at center, #3b82f6, #6366f1 30%, transparent 70%)' }} />
                {/* Side accents */}
                <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] rounded-full opacity-[0.04]"
                    style={{ background: 'radial-gradient(circle, #06b6d4, transparent 70%)' }} />
                <div className="absolute bottom-20 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.04]"
                    style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }} />
                {/* Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:72px_72px]" />
            </div>

            <div className="relative z-10">

                {/* ═══════ HERO ═══════ */}
                <section className="pt-16 pb-8 px-4 sm:px-6">
                    <div className="max-w-5xl mx-auto text-center">
                        {/* Badge */}
                        <motion.div {...fade(0)} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm mb-8">
                            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" /></span>
                            <span className="text-[13px] text-slate-300 font-medium">AI-Powered Interview Platform</span>
                        </motion.div>

                        {/* Headline */}
                        <motion.h1 {...fade(0.05)} className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-extrabold leading-[1.08] tracking-[-0.03em] mb-6">
                            {isAuthenticated ? (
                                <>{`Welcome back, `}<span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">{userName || 'Champion'}</span></>
                            ) : (
                                <>Prepare for interviews{' '}<br className="hidden sm:block" /><span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">that actually matter.</span></>
                            )}
                        </motion.h1>

                        {/* Sub */}
                        <motion.p {...fade(0.1)} className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
                            Resume-grounded AI interviews, rapid drills, voice practice, and resume optimization — everything you need to walk into your next interview with confidence.
                        </motion.p>

                        {/* CTAs */}
                        <motion.div {...fade(0.15)} className="flex flex-wrap items-center justify-center gap-3 mb-14">
                            <button onClick={() => document.getElementById('setup-section')?.scrollIntoView({ behavior: 'smooth' })}
                                className="group px-8 py-3.5 bg-white text-[#04080F] font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-slate-100 transition shadow-lg shadow-white/5">
                                Start Interview <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>
                            <button onClick={onStartHistory}
                                className="px-8 py-3.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] font-medium rounded-xl text-sm transition">
                                Dashboard
                            </button>
                        </motion.div>

                        {/* Stats row */}
                        <motion.div {...fade(0.2)} className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
                            {(isAuthenticated && historyStats.totalInterviews > 0 ? [
                                { val: historyStats.totalInterviews, label: 'Sessions', icon: TrendingUp },
                                { val: `${historyStats.averageScore}/10`, label: 'Avg Score', icon: Star },
                                { val: `${historyStats.streakDays || 1}d`, label: 'Streak', icon: Flame },
                                { val: '4', label: 'Prep Modes', icon: Zap },
                            ] : [
                                { val: '4', label: 'Prep Modes', icon: Zap },
                                { val: 'AI', label: 'Powered', icon: Brain },
                                { val: '∞', label: 'Practice', icon: Target },
                                { val: 'ATS', label: 'Optimized', icon: Shield },
                            ]).map((s, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center"><s.icon size={18} className="text-slate-400" /></div>
                                    <div><p className="text-white font-bold text-lg leading-none">{s.val}</p><p className="text-slate-500 text-[11px] uppercase tracking-wider mt-0.5">{s.label}</p></div>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* ═══════ SETUP SECTION ═══════ */}
                <section id="setup-section" className="py-16 px-4 sm:px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid lg:grid-cols-[0.45fr_0.55fr] gap-10 items-start">

                            {/* Left — Info */}
                            <motion.div {...fade(0)}>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center"><Zap size={16} className="text-blue-400" /></div>
                                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-300">Standard Interview</p>
                                </div>
                                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">AI interviews built from <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">your resume</span></h2>
                                <p className="text-slate-400 leading-relaxed mb-8">Upload your resume and target role. Our AI reads every line and generates interview questions that challenge your specific projects, claims, and experience — just like a real senior interviewer would.</p>

                                <div className="space-y-4">
                                    {[
                                        { icon: FileText, title: 'Resume-grounded questions', desc: 'Every question references your actual projects, tech stack, and claims.' },
                                        { icon: Mic, title: 'Real interview pressure', desc: 'Timed sessions with voice dictation so you practice thinking on your feet.' },
                                        { icon: Sparkles, title: 'Detailed AI feedback', desc: 'Score breakdowns, missing points, and actionable improvement tips per answer.' },
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-3.5">
                                            <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                                                <item.icon size={16} className="text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-white font-semibold text-sm">{item.title}</p>
                                                <p className="text-slate-500 text-[13px] leading-relaxed">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Right — Form Card */}
                            <motion.div {...fade(0.1)} className="relative">
                                {/* Glow behind card */}
                                <div className="absolute -inset-px rounded-[1.75rem] bg-gradient-to-b from-blue-500/20 via-transparent to-transparent opacity-50 blur-sm" />

                                <div className="relative bg-[#0B1120]/90 backdrop-blur-2xl border border-white/[0.08] rounded-[1.75rem] p-6 sm:p-8 shadow-2xl shadow-black/40">
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-bold">Create mock interview</h3>
                                        <span className="text-[12px] text-slate-500 font-medium"><span className="text-white font-bold">{setupProgress}</span>/3 ready</span>
                                    </div>

                                    {/* Progress */}
                                    <div className="flex gap-1.5 mb-6">
                                        {[0, 1, 2].map(i => (
                                            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i < setupProgress ? 'bg-blue-500' : 'bg-white/[0.06]'}`} />
                                        ))}
                                    </div>

                                    {/* Upload */}
                                    <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                                        className={`border border-dashed rounded-2xl p-5 text-center transition-all mb-5 cursor-pointer ${dragActive ? 'border-blue-400/50 bg-blue-500/[0.05]' : resumeFile ? 'border-emerald-500/30 bg-emerald-500/[0.03]' : 'border-white/[0.1] bg-white/[0.02] hover:bg-white/[0.03] hover:border-white/[0.15]'}`}>
                                        <Upload size={22} className={`mx-auto mb-2 ${resumeFile ? 'text-emerald-400' : 'text-slate-500'}`} />
                                        <p className="text-white font-semibold text-sm">{resumeFile ? resumeFile.name : 'Drop your resume'}</p>
                                        <p className="text-slate-600 text-[11px] mb-3">PDF or DOCX</p>
                                        <label className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white text-xs font-semibold cursor-pointer transition">
                                            {resumeFile ? 'Change' : 'Browse'}
                                            <input type="file" onChange={(e) => attachFile(e.target.files?.[0])} accept=".pdf,.docx" className="hidden" />
                                        </label>
                                    </div>

                                    {/* Inputs */}
                                    <div className="grid sm:grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Briefcase size={11} className="text-purple-400" />Job Role</label>
                                            <input value={jobRole} onChange={(e) => setJobRole(e.target.value)} placeholder="e.g. Frontend Developer"
                                                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:border-blue-500/40 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition" />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Target size={11} className="text-amber-400" />Best For</label>
                                            <div className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-slate-500 text-sm">Technical + Behavioral</div>
                                        </div>
                                    </div>

                                    <div className="mb-5">
                                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><BookOpen size={11} className="text-cyan-400" />Job Description</label>
                                        <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the job description for more targeted questions..." rows="3"
                                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:border-blue-500/40 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition resize-none" />
                                    </div>

                                    {/* CTA */}
                                    <button onClick={handleStart} disabled={loading || !resumeFile || !jobRole || !jobDescription}
                                        className="w-full py-3.5 bg-white hover:bg-slate-100 disabled:bg-white/[0.04] disabled:text-slate-600 text-[#04080F] font-bold rounded-xl transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-lg disabled:shadow-none">
                                        {loading ? (<><span className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-600 rounded-full animate-spin" />Analyzing Resume...</>) : (<><Zap size={16} />Start Standard Interview</>)}
                                    </button>

                                    {/* Output info */}
                                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                                        <span><span className="text-slate-600">Output</span> <span className="text-slate-400 font-medium">Resume-specific questions</span></span>
                                        <span><span className="text-slate-600">Focus</span> <span className="text-slate-400 font-medium">Real interviewer probing</span></span>
                                        <span><span className="text-slate-600">Result</span> <span className="text-slate-400 font-medium">Detailed AI report</span></span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ═══════ PREP MODES ═══════ */}
                <section className="py-16 px-4 sm:px-6">
                    <div className="max-w-6xl mx-auto">
                        <motion.div {...fade(0)} className="text-center mb-10">
                            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-blue-300/60 mb-3">Prep Modes</p>
                            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">One platform, four ways to improve</h2>
                            <p className="text-slate-500 max-w-lg mx-auto text-[15px]">Practice, score, build, and refine — everything in one focused flow.</p>
                        </motion.div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            {modes.map((m, i) => {
                                const c = colorMap[m.color];
                                return (
                                    <motion.button key={m.title} {...fade(0.05 + i * 0.06)} onClick={m.action}
                                        className={`group text-left p-6 sm:p-7 rounded-2xl bg-gradient-to-br ${c.bg} border ${c.border} transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20`}>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className={`w-10 h-10 rounded-xl ${c.icon} flex items-center justify-center`}><m.icon size={20} /></div>
                                            <span className={`text-[10px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full border ${c.tag}`}>{m.tag}</span>
                                        </div>
                                        <p className="text-white font-bold text-lg mb-1.5 tracking-tight">{m.title}</p>
                                        <p className="text-slate-400 text-[13px] leading-relaxed mb-4">{m.desc}</p>
                                        <span className="text-blue-300/70 text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                                            Explore <ChevronRight size={14} />
                                        </span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ═══════ HOW IT WORKS ═══════ */}
                <section className="py-16 px-4 sm:px-6">
                    <div className="max-w-4xl mx-auto">
                        <motion.div {...fade(0)} className="text-center mb-10">
                            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">How it works</h2>
                            <p className="text-slate-500 text-[15px]">Three steps to a better interview performance</p>
                        </motion.div>

                        <div className="grid sm:grid-cols-3 gap-6">
                            {[
                                { step: '01', title: 'Upload & Configure', desc: 'Upload your resume and paste the job description. Our AI reads every line to understand your experience.', icon: Upload },
                                { step: '02', title: 'Practice Under Pressure', desc: 'Answer AI-generated questions in a timed, realistic interview environment with voice and webcam support.', icon: Users },
                                { step: '03', title: 'Get Actionable Feedback', desc: 'Receive detailed scoring, strength analysis, improvement tips, and a personalized learning roadmap.', icon: TrendingUp },
                            ].map((item, i) => (
                                <motion.div key={i} {...fade(0.1 + i * 0.08)} className="relative p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-center">
                                    <div className="text-[40px] font-black text-white/[0.04] absolute top-3 right-5">{item.step}</div>
                                    <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                                        <item.icon size={22} className="text-blue-400" />
                                    </div>
                                    <h3 className="text-white font-bold mb-2">{item.title}</h3>
                                    <p className="text-slate-500 text-[13px] leading-relaxed">{item.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══════ TRUST BAR + FOOTER ═══════ */}
                <section className="py-10 px-4 sm:px-6 border-t border-white/[0.04]">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mb-6">
                            {[
                                { icon: Brain, text: 'Gemini AI Powered' },
                                { icon: Shield, text: 'ATS Optimized' },
                                { icon: Sparkles, text: 'Adaptive Learning' },
                                { icon: FileText, text: 'Resume-First Design' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-slate-600">
                                    <item.icon size={14} />
                                    <span className="text-[12px] font-semibold">{item.text}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-center text-slate-700 text-[11px] font-medium tracking-wide">
                            InterVue AI — Serious interview preparation, powered by intelligence.
                        </p>
                    </div>
                </section>
            </div>

            {error && <Notification message={error} type="error" onClose={() => setError(null)} />}
            {success && <Notification message={success} type="success" onClose={() => setSuccess(null)} />}
        </div>
    );
}
