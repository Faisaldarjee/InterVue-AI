/**
 * API Client with Supabase Auth Token
 * Automatically attaches the user's JWT token to every API request
 */

import axios from 'axios';
import { getAccessToken } from './supabaseClient';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance
const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 120000, // 2 min for AI processing
});

// Attach auth token to every request
apiClient.interceptors.request.use(async (config) => {
    try {
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

export default apiClient;
