// ==================== INTERVIEW HISTORY UTILS (Per-User) ====================
const BASE_KEY = 'intervue_ai_history';

// Current user ID — set this after login
let _currentUserId = null;

export function setCurrentUser(userId) {
    _currentUserId = userId;
}

function getKey() {
    return _currentUserId ? `${BASE_KEY}_${_currentUserId}` : BASE_KEY;
}

export function getHistory() {
    try {
        const data = localStorage.getItem(getKey());
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

export function saveInterview(record) {
    try {
        const history = getHistory();
        const entry = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            timestamp: new Date().toISOString(),
            ...record,
        };
        history.unshift(entry); // newest first

        // Keep max 50 records
        if (history.length > 50) history.length = 50;

        localStorage.setItem(getKey(), JSON.stringify(history));
        return entry;
    } catch (err) {
        console.error('Failed to save interview history:', err);
        return null;
    }
}

export function clearHistory() {
    localStorage.removeItem(getKey());
}

export function getStats() {
    const history = getHistory();
    if (history.length === 0) {
        return {
            totalInterviews: 0,
            averageScore: 0,
            bestScore: 0,
            totalQuestions: 0,
            recentScores: [],
            modeBreakdown: { standard: 0, rapidFire: 0, voice: 0 },
            roleBreakdown: {},
            streakDays: 0,
        };
    }

    const scores = history.map(h => h.score || 0).filter(s => s > 0);
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const totalQuestions = history.reduce((sum, h) => sum + (h.questionsCount || 0), 0);

    // Recent 10 scores for chart
    const recentScores = history.slice(0, 10).reverse().map(h => ({
        date: new Date(h.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        score: h.score || 0,
        mode: h.mode || 'standard',
    }));

    // Mode breakdown
    const modeBreakdown = { standard: 0, rapidFire: 0, voice: 0 };
    history.forEach(h => {
        if (h.mode === 'rapid-fire') modeBreakdown.rapidFire++;
        else if (h.mode === 'voice') modeBreakdown.voice++;
        else modeBreakdown.standard++;
    });

    // Role breakdown (top 5)
    const roleCounts = {};
    history.forEach(h => {
        const role = h.jobRole || 'Unknown';
        roleCounts[role] = (roleCounts[role] || 0) + 1;
    });
    const roleBreakdown = Object.entries(roleCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {});

    // Practice streak
    const uniqueDays = new Set(history.map(h =>
        new Date(h.timestamp).toISOString().split('T')[0]
    ));
    const today = new Date();
    let streakDays = 0;
    for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        if (uniqueDays.has(dateStr)) {
            streakDays++;
        } else if (i > 0) {
            break;
        }
    }

    return {
        totalInterviews: history.length,
        averageScore: Math.round(avgScore * 10) / 10,
        bestScore,
        totalQuestions,
        recentScores,
        modeBreakdown,
        roleBreakdown,
        streakDays,
    };
}
