import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3, Clock, Award, Zap, Flame, Target, Trash2, ArrowLeft,
    TrendingUp, Calendar, Brain, Star, Shield, BookOpen, Lightbulb,
    Trophy, Sparkles, ChevronRight
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import GlassCard, { GlassStatCard } from './GlassCard';
import { getHistory, getStats, clearHistory } from '../utils/historyManager';
import { fetchStats, fetchInterviews, fetchLearningData } from '../utils/apiClient';
import { staggerContainer, staggerItem } from './PageTransition';

// ==================== CUSTOM TOOLTIP ====================
function CustomTooltip({ active, payload, label }) {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: 'rgba(15,23,42,0.95)',
                border: '1px solid rgba(59,130,246,0.4)',
                borderRadius: '12px',
                padding: '12px 16px',
                backdropFilter: 'blur(10px)',
            }}>
                <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>{label}</p>
                <p style={{ color: '#fff', fontWeight: 'bold', fontSize: '16px' }}>
                    Score: {payload[0].value}/10
                </p>
            </div>
        );
    }
    return null;
}

// ==================== XP LEVEL BAR ====================
function XPLevelBar({ xpData }) {
    if (!xpData) return null;
    const { total_xp, level, next_level, progress_percent, xp_to_next } = xpData;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
        >
            <GlassCard glowColor="purple">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{level?.icon || '🌱'}</span>
                        <div>
                            <p className="text-white font-bold text-lg">{level?.name || 'Beginner'}</p>
                            <p className="text-slate-400 text-sm">{total_xp} XP earned</p>
                        </div>
                    </div>
                    {next_level && (
                        <div className="text-right">
                            <p className="text-slate-500 text-xs">Next: {next_level.icon} {next_level.name}</p>
                            <p className="text-purple-400 text-sm font-semibold">{xp_to_next} XP to go</p>
                        </div>
                    )}
                </div>

                {/* XP Progress Bar */}
                <div className="w-full bg-slate-800/70 rounded-full h-4 overflow-hidden border border-slate-700/50">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress_percent}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        className="h-full rounded-full bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-400 relative"
                    >
                        <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" style={{ animationDuration: '3s' }} />
                    </motion.div>
                </div>
                <p className="text-slate-500 text-xs mt-2 text-center">{progress_percent}% to next level</p>
            </GlassCard>
        </motion.div>
    );
}

// ==================== SKILL RADAR ====================
function SkillRadar({ skillData }) {
    if (!skillData || Object.values(skillData).every(v => v === 0)) {
        return (
            <GlassCard glowColor="cyan">
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                    <Brain size={20} className="text-cyan-400" />
                    Skill Breakdown
                </h3>
                <p className="text-slate-500 text-center py-10">Complete interviews to see your skill radar</p>
            </GlassCard>
        );
    }

    const radarData = Object.entries(skillData).map(([skill, value]) => ({
        skill: skill.length > 12 ? skill.slice(0, 12) + '…' : skill,
        fullSkill: skill,
        value: value,
        fullMark: 100,
    }));

    return (
        <GlassCard glowColor="cyan">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <Brain size={20} className="text-cyan-400" />
                Skill Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke="rgba(148,163,184,0.15)" />
                    <PolarAngleAxis dataKey="skill" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                        dataKey="value"
                        stroke="#06B6D4"
                        fill="url(#radarFill)"
                        fillOpacity={0.5}
                        strokeWidth={2}
                    />
                    <defs>
                        <linearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.6} />
                            <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.2} />
                        </linearGradient>
                    </defs>
                </RadarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
                {Object.entries(skillData).map(([skill, val]) => (
                    <span key={skill} className={`text-xs px-2 py-1 rounded-full border ${val >= 70 ? 'text-green-300 border-green-500/30 bg-green-500/10' :
                            val >= 40 ? 'text-yellow-300 border-yellow-500/30 bg-yellow-500/10' :
                                'text-red-300 border-red-500/30 bg-red-500/10'
                        }`}>
                        {skill}: {val}%
                    </span>
                ))}
            </div>
        </GlassCard>
    );
}

// ==================== WEAK AREAS ====================
function WeakAreas({ weakAreas }) {
    if (!weakAreas || weakAreas.length === 0) return null;

    const severityStyles = {
        critical: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-300', icon: '🚨' },
        warning: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-300', icon: '⚠️' },
        info: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-300', icon: '💡' },
        success: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-300', icon: '✅' },
    };

    return (
        <GlassCard glowColor="orange">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <Lightbulb size={20} className="text-orange-400" />
                Areas to Improve
            </h3>
            <div className="space-y-3">
                {weakAreas.map((area, i) => {
                    const style = severityStyles[area.severity] || severityStyles.info;
                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`${style.bg} ${style.border} border rounded-xl p-4`}
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-xl">{style.icon}</span>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className={`font-semibold ${style.text}`}>{area.area}</p>
                                        {area.score !== undefined && area.score < 100 && (
                                            <span className="text-xs bg-slate-800/50 px-2 py-0.5 rounded-full text-slate-400">{area.score}%</span>
                                        )}
                                    </div>
                                    <p className="text-slate-400 text-sm">{area.tip}</p>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </GlassCard>
    );
}

// ==================== PRACTICE RECOMMENDATIONS ====================
function PracticeRecs({ recommendations, onAction }) {
    if (!recommendations || recommendations.length === 0) return null;

    const priorityColors = {
        high: 'from-red-600 to-orange-500',
        medium: 'from-blue-600 to-cyan-500',
        low: 'from-green-600 to-emerald-500',
    };

    return (
        <GlassCard glowColor="blue">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <Target size={20} className="text-blue-400" />
                Recommended Practice
            </h3>
            <div className="space-y-3">
                {recommendations.map((rec, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 hover:border-blue-500/30 transition-all group cursor-pointer"
                        onClick={() => onAction && onAction(rec.action)}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{rec.icon}</span>
                            <div className="flex-1">
                                <p className="text-white font-semibold">{rec.title}</p>
                                <p className="text-slate-400 text-sm">{rec.description}</p>
                            </div>
                            {rec.priority && (
                                <span className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${priorityColors[rec.priority] || priorityColors.medium} text-white font-medium`}>
                                    {rec.priority}
                                </span>
                            )}
                            <ChevronRight size={18} className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                        </div>
                    </motion.div>
                ))}
            </div>
        </GlassCard>
    );
}

// ==================== ACHIEVEMENTS ====================
function Achievements({ achievements }) {
    if (!achievements || achievements.length === 0) return null;

    const unlocked = achievements.filter(a => a.unlocked);
    const locked = achievements.filter(a => !a.unlocked);

    return (
        <GlassCard glowColor="yellow">
            <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                <Trophy size={20} className="text-yellow-400" />
                Achievements
                <span className="text-sm text-slate-500 font-normal ml-auto">{unlocked.length}/{achievements.length}</span>
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-4">
                {achievements.map((ach, i) => (
                    <motion.div
                        key={ach.id}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={`text-center p-3 rounded-xl border transition-all ${ach.unlocked
                                ? 'bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-400/50 hover:scale-105'
                                : 'bg-slate-800/30 border-slate-700/30 opacity-40 grayscale'
                            }`}
                        title={`${ach.name}: ${ach.description}`}
                    >
                        <span className="text-2xl block mb-1">{ach.icon}</span>
                        <p className={`text-xs font-medium ${ach.unlocked ? 'text-yellow-300' : 'text-slate-500'}`}>
                            {ach.name}
                        </p>
                    </motion.div>
                ))}
            </div>
        </GlassCard>
    );
}

// ==================== MAIN HISTORY DASHBOARD ====================
export default function HistoryDashboard({ onBack, onStartRapidFire }) {
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [cloudStats, setCloudStats] = useState(null);
    const [cloudInterviews, setCloudInterviews] = useState([]);
    const [learningData, setLearningData] = useState(null);

    // Local data (always available)
    const localHistory = useMemo(() => getHistory(), []);
    const localStats = useMemo(() => getStats(), []);

    // Fetch cloud data on mount
    useEffect(() => {
        async function loadCloudData() {
            try {
                const [statsRes, interviewsRes, learningRes] = await Promise.all([
                    fetchStats(),
                    fetchInterviews(50),
                    fetchLearningData().catch(() => null),
                ]);
                setCloudStats(statsRes);
                setCloudInterviews(interviewsRes || []);
                setLearningData(learningRes);
            } catch (err) {
                console.warn('Cloud data unavailable, using local only:', err);
            } finally {
                setLoading(false);
            }
        }
        loadCloudData();
    }, []);

    // Seamless merge: cloud data takes priority, local as fallback
    const hasCloudData = cloudStats && cloudStats.total_interviews > 0;

    const stats = hasCloudData ? {
        totalInterviews: cloudStats.total_interviews || 0,
        averageScore: cloudStats.average_score || 0,
        bestScore: cloudStats.best_score || 0,
        totalQuestions: cloudStats.total_questions || 0,
        recentScores: (cloudStats.recent_scores || []).map(s => ({
            date: s.date,
            score: s.score,
            mode: s.mode,
        })),
        modeBreakdown: {
            standard: cloudStats.mode_breakdown?.standard || 0,
            rapidFire: cloudStats.mode_breakdown?.['rapid-fire'] || 0,
            voice: cloudStats.mode_breakdown?.voice || 0,
        },
        roleBreakdown: cloudStats.role_breakdown || {},
        streakDays: cloudStats.streak_days || 0,
    } : localStats;

    const history = hasCloudData ? cloudInterviews.map(i => ({
        id: i.id,
        timestamp: i.created_at,
        mode: i.mode,
        jobRole: i.job_role,
        score: i.score,
        questionsCount: (i.answers || []).length || (i.questions || []).length,
    })) : localHistory;

    const COLORS = ['#3B82F6', '#EF4444', '#06B6D4'];
    const modeData = [
        { name: 'Standard', value: stats.modeBreakdown.standard },
        { name: 'Rapid Fire', value: stats.modeBreakdown.rapidFire },
        { name: 'Voice', value: stats.modeBreakdown.voice },
    ].filter(d => d.value > 0);

    const roleData = Object.entries(stats.roleBreakdown).map(([name, value]) => ({
        name: name.length > 15 ? name.slice(0, 15) + '…' : name,
        count: value,
    }));

    const handleClear = () => {
        clearHistory();
        setShowClearConfirm(false);
        window.location.reload();
    };

    const handleRecAction = (action) => {
        if (action === 'rapid-fire' && onStartRapidFire) {
            onStartRapidFire();
        } else if (action === 'resume') {
            onBack && onBack();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 overflow-hidden">
            {/* Animated background */}
            <div className="fixed inset-0 overflow-hidden -z-10">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={onBack}
                        className="text-slate-400 hover:text-white transition flex items-center gap-2 group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        Back Home
                    </button>
                    <button
                        onClick={() => setShowClearConfirm(true)}
                        className="text-slate-500 hover:text-red-400 transition flex items-center gap-2 text-sm"
                    >
                        <Trash2 size={16} />
                        Clear History
                    </button>
                </div>

                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <div className="inline-block mb-4 px-4 py-2 bg-blue-500/20 border border-blue-500/40 rounded-full backdrop-blur">
                        <span className="text-blue-300 text-sm font-semibold flex items-center gap-2">
                            <Sparkles size={16} /> Smart Learning Dashboard
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                        Your Learning Journey
                    </h1>
                    <p className="text-slate-400 max-w-xl mx-auto">
                        Track skills, earn XP, unlock achievements, and get personalized recommendations
                    </p>
                </motion.div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full mx-auto mb-4"></div>
                        <p className="text-slate-400">Loading your learning data...</p>
                    </div>
                ) : stats.totalInterviews === 0 ? (
                    /* Empty State */
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-20"
                    >
                        <GlassCard glowColor="blue" className="max-w-md mx-auto">
                            <Brain size={64} className="mx-auto mb-4 text-blue-400 opacity-50" />
                            <h2 className="text-2xl font-bold text-white mb-3">No Interviews Yet</h2>
                            <p className="text-slate-400 mb-6">
                                Complete your first interview to start tracking your progress!
                            </p>
                            <button
                                onClick={onBack}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all"
                            >
                                Start Practicing
                            </button>
                        </GlassCard>
                    </motion.div>
                ) : (
                    <>
                        {/* XP Level Bar */}
                        <XPLevelBar xpData={learningData?.xp} />

                        {/* Stats Row */}
                        <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 mt-6"
                        >
                            <motion.div variants={staggerItem}>
                                <GlassStatCard icon={Target} label="Interviews" value={stats.totalInterviews} color="blue" />
                            </motion.div>
                            <motion.div variants={staggerItem}>
                                <GlassStatCard icon={Award} label="Avg Score" value={`${stats.averageScore}/10`} color="yellow" />
                            </motion.div>
                            <motion.div variants={staggerItem}>
                                <GlassStatCard icon={Zap} label="Best Score" value={`${stats.bestScore}/10`} color="green" />
                            </motion.div>
                            <motion.div variants={staggerItem}>
                                <GlassStatCard icon={Flame} label="Streak" value={`${learningData?.streak || stats.streakDays || 0}d`} color="red" />
                            </motion.div>
                            <motion.div variants={staggerItem}>
                                <GlassStatCard icon={BookOpen} label="Q Bank" value={learningData?.question_bank_size || 0} color="purple" />
                            </motion.div>
                        </motion.div>

                        {/* Skill Radar + Weak Areas Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <SkillRadar skillData={learningData?.skill_breakdown} />
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <WeakAreas weakAreas={learningData?.weak_areas} />
                            </motion.div>
                        </div>

                        {/* Practice Recommendations */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45 }}
                            className="mb-6"
                        >
                            <PracticeRecs recommendations={learningData?.recommendations} onAction={handleRecAction} />
                        </motion.div>

                        {/* Achievements */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="mb-8"
                        >
                            <Achievements achievements={learningData?.achievements} />
                        </motion.div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Score Trend Chart */}
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.55 }}
                            >
                                <GlassCard glowColor="blue">
                                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                                        <TrendingUp size={20} className="text-blue-400" />
                                        Score Trend
                                    </h3>
                                    {stats.recentScores.length > 1 ? (
                                        <ResponsiveContainer width="100%" height={220}>
                                            <LineChart data={stats.recentScores}>
                                                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <YAxis domain={[0, 10]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Line
                                                    type="monotone"
                                                    dataKey="score"
                                                    stroke="url(#scoreGradient)"
                                                    strokeWidth={3}
                                                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5 }}
                                                    activeDot={{ r: 7, fill: '#60A5FA' }}
                                                />
                                                <defs>
                                                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="0">
                                                        <stop offset="0%" stopColor="#3B82F6" />
                                                        <stop offset="100%" stopColor="#8B5CF6" />
                                                    </linearGradient>
                                                </defs>
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <p className="text-slate-500 text-center py-10">Complete 2+ interviews to see trends</p>
                                    )}
                                </GlassCard>
                            </motion.div>

                            {/* Mode Breakdown Pie Chart */}
                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 }}
                            >
                                <GlassCard glowColor="purple">
                                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                                        <Calendar size={20} className="text-purple-400" />
                                        Mode Breakdown
                                    </h3>
                                    {modeData.length > 0 ? (
                                        <div className="flex items-center gap-4">
                                            <ResponsiveContainer width="50%" height={200}>
                                                <PieChart>
                                                    <Pie
                                                        data={modeData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={50}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {modeData.map((_, i) => (
                                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="space-y-3">
                                                {modeData.map((entry, i) => (
                                                    <div key={entry.name} className="flex items-center gap-3">
                                                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: COLORS[i] }} />
                                                        <span className="text-slate-300 text-sm">{entry.name}</span>
                                                        <span className="text-white font-bold ml-auto">{entry.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-slate-500 text-center py-10">No data yet</p>
                                    )}
                                </GlassCard>
                            </motion.div>
                        </div>

                        {/* Role Breakdown */}
                        {roleData.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.65 }}
                                className="mb-8"
                            >
                                <GlassCard glowColor="cyan">
                                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                                        <Target size={20} className="text-cyan-400" />
                                        Roles Practiced
                                    </h3>
                                    <ResponsiveContainer width="100%" height={180}>
                                        <BarChart data={roleData} layout="vertical">
                                            <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <YAxis type="category" dataKey="name" tick={{ fill: '#e2e8f0', fontSize: 12 }} axisLine={false} tickLine={false} width={120} />
                                            <Tooltip content={({ active, payload }) => {
                                                if (active && payload?.length) {
                                                    return (
                                                        <div style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(6,182,212,0.4)', borderRadius: '8px', padding: '8px 12px' }}>
                                                            <p style={{ color: '#fff', fontWeight: 'bold' }}>{payload[0].value} interviews</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }} />
                                            <Bar dataKey="count" fill="url(#barGradient)" radius={[0, 8, 8, 0]} barSize={24} />
                                            <defs>
                                                <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                                                    <stop offset="0%" stopColor="#06B6D4" />
                                                    <stop offset="100%" stopColor="#3B82F6" />
                                                </linearGradient>
                                            </defs>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </GlassCard>
                            </motion.div>
                        )}

                        {/* Recent History List */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                        >
                            <GlassCard glowColor="blue">
                                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                                    <Clock size={20} className="text-blue-400" />
                                    Recent Sessions
                                </h3>
                                <div className="space-y-3 max-h-96 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(59,130,246,0.3) transparent' }}>
                                    {history.slice(0, 15).map((item, idx) => (
                                        <motion.div
                                            key={item.id || idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '12px 16px',
                                                background: 'rgba(255,255,255,0.03)',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(255,255,255,0.06)',
                                            }}
                                            className="hover:bg-white/5 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${item.mode === 'rapid-fire' ? 'bg-red-400' :
                                                    item.mode === 'voice' ? 'bg-cyan-400' : 'bg-blue-400'
                                                    }`} />
                                                <div>
                                                    <p className="text-white text-sm font-medium">
                                                        {item.jobRole || item.job_role || 'Interview'}
                                                        <span className="text-slate-500 ml-2 text-xs capitalize">
                                                            ({item.mode === 'rapid-fire' ? '🔥 Rapid Fire' : item.mode === 'voice' ? '🎤 Voice' : '📝 Standard'})
                                                        </span>
                                                    </p>
                                                    <p className="text-slate-500 text-xs">
                                                        {new Date(item.timestamp || item.created_at).toLocaleDateString('en-IN', {
                                                            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`text-lg font-bold ${item.score >= 8 ? 'text-green-400' :
                                                item.score >= 5 ? 'text-yellow-400' :
                                                    item.score > 0 ? 'text-red-400' : 'text-slate-500'
                                                }`}>
                                                {item.score > 0 ? `${item.score}/10` : '—'}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </GlassCard>
                        </motion.div>
                    </>
                )}

                {/* Clear History Confirmation Modal */}
                {showClearConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
                        onClick={() => setShowClearConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <GlassCard glowColor="red" className="max-w-sm mx-4">
                                <h3 className="text-white font-bold text-lg mb-3">Clear All History?</h3>
                                <p className="text-slate-400 text-sm mb-6">This will permanently delete all your local interview records.</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowClearConfirm(false)}
                                        className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleClear}
                                        className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition font-medium"
                                    >
                                        Delete All
                                    </button>
                                </div>
                            </GlassCard>
                        </motion.div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
