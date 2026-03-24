const EXPLICIT_API_URL = (process.env.REACT_APP_API_URL || '').trim().replace(/\/$/, '');

const LOCAL_API_CANDIDATES = [
    'http://localhost:8000',
    'http://127.0.0.1:8000',
];

const REMOTE_API_CANDIDATES = [
    'https://hirewise-backend.onrender.com',
    'https://intervue-ai-backend.onrender.com',
];

let resolvedApiUrl = EXPLICIT_API_URL || '';
let resolutionPromise = null;

function dedupe(items) {
    return [...new Set(items.filter(Boolean))];
}

function isLocalHostname(hostname) {
    return ['localhost', '127.0.0.1'].includes((hostname || '').toLowerCase());
}

function getCandidates() {
    if (EXPLICIT_API_URL) {
        return [EXPLICIT_API_URL];
    }

    if (typeof window === 'undefined') {
        return dedupe([...LOCAL_API_CANDIDATES, ...REMOTE_API_CANDIDATES]);
    }

    const hostname = window.location.hostname;
    if (isLocalHostname(hostname)) {
        return dedupe([...LOCAL_API_CANDIDATES, ...REMOTE_API_CANDIDATES]);
    }

    return dedupe([...REMOTE_API_CANDIDATES, ...LOCAL_API_CANDIDATES]);
}

async function canReachApi(baseUrl) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const response = await fetch(`${baseUrl}/health`, {
            method: 'GET',
            signal: controller.signal,
        });
        clearTimeout(timeout);
        return response.ok;
    } catch {
        return false;
    }
}

export async function resolveApiBaseUrl() {
    if (resolvedApiUrl) {
        return resolvedApiUrl;
    }

    if (!resolutionPromise) {
        resolutionPromise = (async () => {
            const candidates = getCandidates();
            for (const candidate of candidates) {
                if (await canReachApi(candidate)) {
                    resolvedApiUrl = candidate;
                    return candidate;
                }
            }

            resolvedApiUrl = candidates[0] || 'http://localhost:8000';
            return resolvedApiUrl;
        })();
    }

    return resolutionPromise;
}

export function getApiBaseUrl() {
    if (resolvedApiUrl) {
        return resolvedApiUrl;
    }
    return getCandidates()[0] || 'http://localhost:8000';
}
