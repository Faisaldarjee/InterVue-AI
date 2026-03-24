import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, BookOpen, CheckCircle, Clock, Lightbulb, Sparkles, Target, Zap } from 'lucide-react';

function StatCard({ icon: Icon, label, value, tone }) {
    const toneClass = tone === 'green' ? 'text-emerald-400' : tone === 'purple' ? 'text-purple-400' : 'text-blue-400';
    return (
        <div className="bg-slate-900/60 backdrop-blur border border-slate-800/50 rounded-2xl p-5 text-center">
            <Icon size={24} className={`mx-auto mb-2 ${toneClass}`} />
            <p className="text-slate-500 text-xs mb-1">{label}</p>
            <p className="text-xl font-bold text-white">{value}</p>
        </div>
    );
}

function SummaryBanner({ averageScore, recommendation, overallSummary }) {
    const badgeClass = averageScore >= 8
        ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300'
        : averageScore >= 6
            ? 'bg-blue-500/15 border-blue-400/30 text-blue-300'
            : 'bg-amber-500/15 border-amber-400/30 text-amber-300';

    return (
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.12),transparent_30%)]" />
            <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="max-w-2xl">
                    <p className="text-xs uppercase tracking-[0.24em] font-semibold text-cyan-200 mb-3">Performance Snapshot</p>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                        {recommendation || 'Progress is building in the right direction'}
                    </h2>
                    <p className="text-slate-300 leading-relaxed">
                        {overallSummary || 'You now have a clear baseline, targeted feedback, and a better sense of where to focus your next session.'}
                    </p>
                </div>
                <div className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold ${badgeClass}`}>
                    Overall score: {averageScore}/10
                </div>
            </div>
        </div>
    );
}

function ListBlock({ title, icon: Icon, items, tone }) {
    if (!items || items.length === 0) return null;
    const titleClass = tone === 'green' ? 'text-emerald-400' : tone === 'orange' ? 'text-orange-400' : 'text-blue-400';
    const dotClass = tone === 'green' ? 'bg-emerald-400' : tone === 'orange' ? 'bg-orange-400' : 'bg-blue-400';

    return (
        <div className="mb-6">
            <h3 className={`font-semibold mb-3 flex items-center gap-2 ${titleClass}`}>
                <Icon size={16} />
                {title}
            </h3>
            <ul className="space-y-2">
                {items.map((item, index) => (
                    <li key={`${title}-${index}`} className="text-slate-300 flex items-start gap-2">
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${dotClass}`} />
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function ResultsPage({ data, onNewInterview, onGoDashboard }) {
    const summary = data?.summary || {};
    const learningReport = data?.learningReport || {};
    const finalReport = data?.finalReport || {};
    const averageScore = summary.average_score || 0;
    const confidence = learningReport.confidence_level || Math.max(5, Math.round(averageScore));
    const nextSteps = learningReport.next_steps || [];

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,#153b7a_0%,#081225_35%,#020617_100%)] p-4">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12 pt-8">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-block mb-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-emerald-300 text-sm font-medium">Interview Complete</span>
                        </div>
                    </motion.div>
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
                        Your Results
                    </motion.h1>
                    <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-slate-400 max-w-2xl mx-auto">
                        Clear feedback, targeted next steps, and a quick read on how ready you are for the real thing.
                    </motion.p>

                    {averageScore > 0 && (
                        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="mt-8 mb-10 flex justify-center">
                            <div className="relative w-40 h-40">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                                    <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(59,130,246,0.1)" strokeWidth="8" />
                                    <motion.circle
                                        cx="60"
                                        cy="60"
                                        r="52"
                                        fill="none"
                                        stroke={averageScore >= 7 ? '#10b981' : averageScore >= 5 ? '#f59e0b' : '#ef4444'}
                                        strokeWidth="8"
                                        strokeLinecap="round"
                                        strokeDasharray={`${2 * Math.PI * 52}`}
                                        initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                                        animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - averageScore / 10) }}
                                        transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-4xl font-extrabold text-white">{averageScore}</motion.p>
                                    <p className="text-slate-500 text-xs font-medium">out of 10</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="mb-8">
                    <SummaryBanner
                        averageScore={averageScore}
                        recommendation={finalReport.recommendation}
                        overallSummary={finalReport.overall_summary}
                    />
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-10">
                    <StatCard icon={BarChart3} label="Questions" value={summary.total_questions || 0} tone="blue" />
                    <StatCard icon={Clock} label="Duration" value={summary.duration ? summary.duration.split('.')[0] : 'N/A'} tone="purple" />
                    <StatCard icon={Zap} label="Readiness" value={summary.estimated_readiness || finalReport.recommendation || 'Improving'} tone="green" />
                    <StatCard icon={Target} label="Confidence" value={`${confidence}/10`} tone="blue" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 mb-8">
                    <div className="bg-slate-900/60 backdrop-blur border border-slate-800/50 rounded-3xl p-8">
                        <div className="flex items-center gap-2 mb-4">
                            <BookOpen size={24} className="text-blue-400" />
                            <h2 className="text-2xl font-bold text-white">Learning Report</h2>
                        </div>

                        {learningReport.overall_assessment ? (
                            <>
                                <div className={`inline-block px-6 py-3 rounded-full font-bold mb-6 ${confidence >= 8 ? 'bg-green-500/20 border border-green-500/40 text-green-300' : confidence >= 5 ? 'bg-yellow-500/20 border border-yellow-500/40 text-yellow-300' : 'bg-orange-500/20 border border-orange-500/40 text-orange-300'}`}>
                                    Confidence: {confidence}/10
                                </div>
                                <p className="text-white mb-6 leading-relaxed">{learningReport.overall_assessment}</p>
                                <ListBlock title="Strengths Demonstrated" icon={CheckCircle} items={learningReport.strengths_demonstrated} tone="green" />
                                <ListBlock title="Areas To Improve" icon={Lightbulb} items={learningReport.areas_for_improvement} tone="orange" />
                            </>
                        ) : (
                            <p className="text-slate-400">Your detailed learning feedback will appear here after a complete evaluated session.</p>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-slate-800/40 to-blue-900/40 backdrop-blur border border-blue-500/30 rounded-2xl p-8">
                            <h2 className="text-2xl font-bold text-white mb-4">Interview Readiness</h2>
                            {finalReport.recommendation ? (
                                <>
                                    <div className={`inline-block px-6 py-3 rounded-full font-bold mb-6 text-lg ${finalReport.recommendation === 'Strong Hire' ? 'bg-green-500/20 border border-green-500/40 text-green-300' : finalReport.recommendation === 'Good Fit' ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300' : 'bg-yellow-500/20 border border-yellow-500/40 text-yellow-300'}`}>
                                        {finalReport.recommendation}
                                    </div>
                                    {finalReport.estimated_interview_success_rate && (
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-slate-300">Estimated Success Rate</span>
                                                <span className="text-white font-bold">{finalReport.estimated_interview_success_rate}</span>
                                            </div>
                                            <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                                                <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-full" style={{ width: finalReport.estimated_interview_success_rate }} />
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="text-slate-400">Complete more sessions to unlock a sharper readiness recommendation.</p>
                            )}
                        </div>

                        <div className="bg-slate-900/60 backdrop-blur border border-slate-800/50 rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles size={18} className="text-blue-400" />
                                <h3 className="text-white font-bold text-lg">Action Plan</h3>
                            </div>
                            {nextSteps.length > 0 ? (
                                <ol className="space-y-3 text-blue-300 text-sm">
                                    {nextSteps.map((step, index) => (
                                        <li key={`step-${index}`} className="flex items-start gap-3">
                                            <span className="w-6 h-6 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 flex items-center justify-center text-xs font-bold shrink-0">
                                                {index + 1}
                                            </span>
                                            <span>{step}</span>
                                        </li>
                                    ))}
                                </ol>
                            ) : (
                                <p className="text-slate-400 text-sm">Practice once more, then come back here for a step-by-step improvement plan.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500 mb-2">Keep doing</p>
                        <p className="text-white font-semibold mb-2">What is already working</p>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            {learningReport.strengths_demonstrated?.[0] || 'Build on the answers where your structure, examples, or clarity already felt strong.'}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500 mb-2">Fix next</p>
                        <p className="text-white font-semibold mb-2">Highest leverage improvement</p>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            {learningReport.areas_for_improvement?.[0] || 'Focus on one repeatable weakness first so your next session shows a visible jump.'}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500 mb-2">Next session</p>
                        <p className="text-white font-semibold mb-2">What to test again</p>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            {nextSteps[0] || 'Run another interview soon while this feedback is fresh and measure whether your confidence improves.'}
                        </p>
                    </div>
                </div>

                {learningReport.motivational_message && (
                    <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-cyan-100 mb-8">
                        {learningReport.motivational_message}
                    </div>
                )}

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10 pb-8">
                    <button
                        onClick={onNewInterview}
                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl transition-all inline-flex items-center gap-2.5 group shadow-lg shadow-blue-500/10 text-sm"
                    >
                        <Zap size={18} />
                        Start Another Interview
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition" />
                    </button>
                    {onGoDashboard && (
                        <button
                            onClick={onGoDashboard}
                            className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all text-sm"
                        >
                            Open Dashboard
                        </button>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
