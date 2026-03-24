const MODE_LABELS = {
    standard: 'standard',
    rapid_fire: 'rapid_fire',
    'rapid-fire': 'rapid_fire',
    rapidFire: 'rapid_fire',
    voice: 'voice',
};

export function normalizeMode(mode) {
    if (!mode) return 'standard';
    return MODE_LABELS[mode] || 'standard';
}

export function getModeStatsKey(mode) {
    const normalized = normalizeMode(mode);
    if (normalized === 'rapid_fire') return 'rapidFire';
    return normalized;
}

export function getModeDisplayName(mode) {
    const normalized = normalizeMode(mode);
    if (normalized === 'rapid_fire') return 'Rapid Fire';
    if (normalized === 'voice') return 'Voice';
    return 'Standard';
}

export function normalizeInterviewResult(payload = {}) {
    return {
        finalReport: payload.finalReport || payload.final_report || {},
        learningReport: payload.learningReport || payload.learning_report || {},
        summary: payload.summary || payload.interview_summary || {},
        results: payload.results || {},
    };
}

export function buildInterviewRecord({
    mode,
    jobRole,
    jobDescription = '',
    result = {},
    answers = [],
    questions = [],
    durationSeconds = 0,
}) {
    const normalizedMode = normalizeMode(mode);
    const normalized = normalizeInterviewResult(result);
    const summary = normalized.summary;
    const report = normalized.results;
    const rawScore = summary.average_score ?? report.average_score ?? 0;
    const score = typeof rawScore === 'string' ? parseFloat(rawScore) : rawScore || 0;
    const questionsCount =
        summary.total_questions ??
        report.total_questions ??
        answers.length ??
        questions.length ??
        0;

    return {
        mode: normalizedMode,
        jobRole: jobRole || 'Unknown',
        jobDescription,
        score,
        questionsCount,
        readiness: summary.estimated_readiness || normalized.finalReport.recommendation || '',
        final_report: Object.keys(normalized.finalReport).length ? normalized.finalReport : report,
        learning_report: normalized.learningReport,
        questions,
        answers,
        duration_seconds: durationSeconds,
    };
}

export function normalizeHistoryItem(item = {}) {
    return {
        ...item,
        mode: normalizeMode(item.mode),
        jobRole: item.jobRole || item.job_role || 'Interview',
        timestamp: item.timestamp || item.created_at || new Date().toISOString(),
        score: item.score || 0,
        questionsCount: item.questionsCount || (item.answers || []).length || (item.questions || []).length || 0,
    };
}

export function normalizeCloudStats(stats = {}) {
    return {
        totalInterviews: stats.total_interviews || 0,
        averageScore: stats.average_score || 0,
        bestScore: stats.best_score || 0,
        totalQuestions: stats.total_questions || 0,
        recentScores: (stats.recent_scores || []).map((score) => ({
            date: score.date,
            score: score.score,
            mode: normalizeMode(score.mode),
        })),
        modeBreakdown: {
            standard: stats.mode_breakdown?.standard || 0,
            rapidFire: stats.mode_breakdown?.['rapid-fire'] || stats.mode_breakdown?.rapid_fire || 0,
            voice: stats.mode_breakdown?.voice || 0,
        },
        roleBreakdown: stats.role_breakdown || {},
        streakDays: stats.streak_days || 0,
    };
}
