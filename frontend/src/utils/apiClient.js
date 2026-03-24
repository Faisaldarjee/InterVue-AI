/**
 * API Client with Supabase Auth Token
 * Automatically attaches the user's JWT token to every API request
 */

import axios from 'axios';
import { getAccessToken } from './supabaseClient';
import { getApiBaseUrl, resolveApiBaseUrl } from './apiBase';

// Create axios instance
const apiClient = axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 120000, // 2 min for AI processing
});

// Attach auth token to every request
apiClient.interceptors.request.use(async (config) => {
    try {
        config.baseURL = await resolveApiBaseUrl();
        const token = await getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (err) {
        console.warn('Failed to get auth token:', err);
    }
    return config;
});

// ==================== USER API CALLS ====================

/** Get user profile */
export async function fetchProfile() {
    const { data } = await apiClient.get('/api/user/profile');
    return data;
}

/** Get user stats for dashboard */
export async function fetchStats() {
    const { data } = await apiClient.get('/api/user/stats');
    return data.stats;
}

/** Get user interview history */
export async function fetchInterviews(limit = 50) {
    const { data } = await apiClient.get(`/api/user/interviews?limit=${limit}`);
    return data.interviews;
}

/** Save completed interview to database */
export async function saveInterviewToDB(interviewData) {
    try {
        const { data } = await apiClient.post('/api/user/save-interview', interviewData);
        return data;
    } catch (err) {
        console.error('Failed to save interview to DB:', err);
        return null;
    }
}

/** Get user's saved resumes */
export async function fetchResumes() {
    const { data } = await apiClient.get('/api/user/resumes');
    return data.resumes;
}

/** Get personalized learning data (skills, achievements, XP) */
export async function fetchLearningData() {
    const { data } = await apiClient.get('/api/user/learning');
    return data;
}

export async function analyzeResumeFile(formData) {
    const { data } = await apiClient.post('/analyze-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
}

export async function startRapidFireSession(payload) {
    const { data } = await apiClient.post('/start-rapid-fire', payload, {
        timeout: 60000,
    });
    return data;
}

export async function submitRapidFireBatch(payload) {
    const { data } = await apiClient.post('/api/rapid-fire/batch-submit', payload, {
        timeout: 90000,
    });
    return data;
}

export async function submitVoiceInterviewBatch(payload) {
    const { data } = await apiClient.post('/submit-voice-batch', payload, {
        timeout: 90000,
    });
    return data;
}

export async function submitStandardInterviewBatch(payload) {
    const { data } = await apiClient.post('/api/interview/final-submit', payload, {
        timeout: 120000,
    });
    return data;
}

export default apiClient;
