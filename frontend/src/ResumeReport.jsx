import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Star, Zap, Download, ArrowLeft, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import html2pdf from 'html2pdf.js';

export default function ResumeReport({ analysis, onReset }) {
    const reportRef = useRef(null);
    const [isDownloading, setIsDownloading] = useState(false);

    if (!analysis) return null;

    const { score = 0, summary = '', ats_feedback = {}, magic_rewrites = [] } = analysis;

    const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
    const scoreLabel = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Work';
    const scoreBg = score >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : score >= 60 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20';

    const handleDownloadPDF = () => {
        setIsDownloading(true);
        const element = reportRef.current;
        const opt = {
            margin: [0.5, 0.5],
            filename: `Resume_Analysis_${score}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save().then(() => {
            setIsDownloading(false);
        });
    };

    const missingKeywords = ats_feedback?.missing_keywords || [];
    const formattingIssues = ats_feedback?.formatting_issues || [];

    return (
        <div className="w-full max-w-5xl mx-auto px-4 py-8">

            {/* Top Bar */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-between items-center mb-8"
            >
                <button
                    onClick={onReset}
                    className="text-slate-400 hover:text-white transition text-sm flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-xl"
                >
                    <ArrowLeft size={16} /> Check Another
                </button>
                <button
                    onClick={handleDownloadPDF}
                    disabled={isDownloading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-500/10 transition-all text-sm disabled:opacity-60"
                >
                    {isDownloading ? (
                        <span className="animate-pulse">Generating PDF...</span>
                    ) : (
                        <><Download size={16} /> Download Report</>
                    )}
                </button>
            </motion.div>

            {/* Printable Area */}
            <div ref={reportRef} className="space-y-6" id="report-content">

                {/* ===== HERO: Score Circle + Summary ===== */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-slate-900/60 backdrop-blur border border-slate-800/50 rounded-3xl p-8 md:p-10"
                >
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        {/* Animated Score Circle */}
                        <div className="relative w-44 h-44 flex-shrink-0">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
                                <motion.circle
                                    cx="60" cy="60" r="52" fill="none"
                                    stroke={scoreColor}
                                    strokeWidth="8" strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 52}`}
                                    initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                                    animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - score / 100) }}
                                    transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.8, type: 'spring' }}
                                    className="text-5xl font-extrabold text-white"
                                >{score}</motion.span>
                                <span className="text-slate-500 text-xs font-medium mt-0.5">out of 100</span>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="flex-1 text-center md:text-left">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mb-3 ${scoreBg}`}>
                                <Star size={12} /> {scoreLabel}
                            </div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">
                                Resume Analysis
                            </h1>
                            <p className="text-slate-400 leading-relaxed text-sm">
                                {summary}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* ===== ATS COMPLIANCE ===== */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-slate-900/60 backdrop-blur border border-slate-800/50 rounded-3xl p-8"
                >
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <TrendingUp size={18} className="text-blue-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white">ATS Compliance</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Missing Keywords */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <AlertCircle size={12} /> Missing Keywords
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {missingKeywords.length > 0 ? (
                                    missingKeywords.map((kw, i) => (
                                        <motion.span
                                            key={i}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.3 + i * 0.05 }}
                                            className="px-3 py-1.5 bg-red-500/10 border border-red-500/15 text-red-300 rounded-lg text-xs font-medium flex items-center gap-1.5"
                                        >
                                            <X size={12} strokeWidth={3} /> {kw}
                                        </motion.span>
                                    ))
                                ) : (
                                    <span className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 rounded-xl text-xs flex items-center gap-2 font-medium">
                                        <Check size={14} /> All key skills detected
                                    </span>
                                )}
                            </div>
                            {missingKeywords.length > 0 && (
                                <p className="text-[11px] text-slate-600 mt-2">Adding these can boost ATS ranking by up to 40%</p>
                            )}
                        </div>

                        {/* Formatting Issues */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Check size={12} /> Formatting Health
                            </h4>
                            {formattingIssues.length > 0 ? (
                                <ul className="space-y-2">
                                    {formattingIssues.map((issue, i) => (
                                        <motion.li
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 + i * 0.05 }}
                                            className="text-sm text-slate-300 flex items-start gap-2.5 bg-white/[0.02] p-2.5 rounded-lg"
                                        >
                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                            {issue}
                                        </motion.li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="flex items-center gap-2.5 text-emerald-400 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 text-sm font-medium">
                                    <Check size={16} /> Clean & parseable layout
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* ===== MAGIC REWRITES ===== */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <Sparkles size={18} className="text-amber-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white">AI Magic Rewrites</h2>
                        <span className="ml-auto text-slate-600 text-xs hidden md:block">Before → After comparison</span>
                    </div>

                    <div className="space-y-4">
                        {magic_rewrites.length > 0 ? magic_rewrites.map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + idx * 0.1 }}
                                className="bg-slate-900/60 backdrop-blur border border-slate-800/50 rounded-2xl overflow-hidden hover:border-slate-700/80 transition-all group"
                            >
                                {/* Header */}
                                <div className="px-5 py-2.5 bg-white/[0.02] border-b border-slate-800/50 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Bullet #{idx + 1}</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2">
                                    {/* Original */}
                                    <div className="p-5 border-b md:border-b-0 md:border-r border-slate-800/50">
                                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-red-500/10 text-red-400 uppercase tracking-wider mb-2.5">
                                            Original
                                        </div>
                                        <p className="text-slate-400 text-sm leading-relaxed">
                                            "{item.original}"
                                        </p>
                                    </div>

                                    {/* Rewritten */}
                                    <div className="p-5 bg-emerald-500/[0.02]">
                                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 uppercase tracking-wider mb-2.5">
                                            <Zap size={9} /> AI Rewritten
                                        </div>
                                        <p className="text-white text-sm leading-relaxed mb-3 font-medium">
                                            "{item.rewritten}"
                                        </p>
                                        <div className="flex items-start gap-2 text-[11px] text-blue-300/80 bg-blue-500/5 p-2.5 rounded-lg border border-blue-500/10">
                                            <Star size={12} className="mt-0.5 shrink-0 text-blue-400" />
                                            <span><span className="font-bold text-blue-300">Why:</span> {item.explanation}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )) : (
                            <div className="bg-slate-900/60 backdrop-blur border border-slate-800/50 rounded-2xl p-6 text-slate-400 text-sm">
                                No rewrite suggestions yet. Try uploading a more detailed resume for stronger recommendations.
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Footer */}
                <div className="text-center pt-4">
                    <p className="text-slate-700 text-[10px] uppercase tracking-widest">
                        InterVue AI • {new Date().toLocaleDateString()}
                    </p>
                </div>
            </div>
        </div>
    );
}
