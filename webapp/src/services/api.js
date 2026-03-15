/**
 * KWYC API client.
 * Base URL is configured via VITE_API_BASE_URL (never hardcode secrets here).
 */
import axios from 'axios';
import { supabase } from './supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

// ── Synchronous session reference ──────────────────────────────
// Updated eagerly so the request interceptor can run synchronously.
let _session = null;

supabase.auth.getSession().then(({ data }) => {
    _session = data.session;
});

supabase.auth.onAuthStateChange((_event, session) => {
    _session = session;
});

// ── Request interceptor – attach token ─────────────────────────
api.interceptors.request.use((config) => {
    if (_session?.access_token) {
        config.headers.Authorization = `Bearer ${_session.access_token}`;
    }
    return config;
});

// ── Response interceptor – retry once on 401 ───────────────────
// Supabase v2 fires onAuthStateChange asynchronously, so _session may
// not be populated yet when the first request fires after login.
// On a 401: force-refresh the session and replay the request once.
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retried) {
            original._retried = true;
            try {
                const { data } = await supabase.auth.getSession();
                _session = data.session;
                if (_session?.access_token) {
                    original.headers.Authorization = `Bearer ${_session.access_token}`;
                    return api(original);
                }
            } catch {
                // Session refresh failed – fall through and reject
            }
        }
        return Promise.reject(error);
    }
);

/**
 * Scan a barcode → full analysis result.
 * @param {string} barcode
 * @param {object} userProfile  – inline diet prefs (fallback)
 * @param {string} [profileId] – household profile id (preferred)
 */
export const scanBarcode = async (barcode, userProfile = {}, profileId = null) => {
    const body = {
        barcode,
        user_profile: userProfile,
    };
    if (profileId) body.profile_id = profileId;
    const res = await api.post('/api/scan/barcode', body);
    return res.data;
};

/**
 * Upload a label image → full analysis result.
 * @param {File} imageFile
 * @param {object} userProfile – inline diet prefs (fallback)
 * @param {string} [barcode]   – optional barcode to cache under
 * @param {string} [profileId] – household profile id (preferred)
 */
export const scanLabel = async (imageFile, userProfile = {}, barcode = '', profileId = null) => {
    const form = new FormData();
    form.append('image', imageFile);
    form.append('user_profile', JSON.stringify(userProfile));
    if (barcode) form.append('barcode', barcode);
    if (profileId) form.append('profile_id', profileId);
    const res = await api.post('/api/scan/label', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
};

/**
 * Product-locked chat.
 */
export const chat = async (sessionId, message, chatHistory = []) => {
    const res = await api.post('/api/chat', {
        session_id: sessionId,
        message,
        chat_history: chatHistory,
    });
    return res.data;
};

export default api;
