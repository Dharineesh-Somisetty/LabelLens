/**
 * LabelLens API client.
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
// onAuthStateChange fires before React processes the resulting setState,
// so _session is always current by the time any component useEffect
// triggers an API call after login – no async race condition.
let _session = null;

supabase.auth.getSession().then(({ data }) => {
    _session = data.session;
});

supabase.auth.onAuthStateChange((_event, session) => {
    _session = session;
});

// ── JWT interceptor ────────────────────────────────────────────
// Synchronously attach the Supabase access token to every request.
api.interceptors.request.use((config) => {
    if (_session?.access_token) {
        config.headers.Authorization = `Bearer ${_session.access_token}`;
    }
    return config;
});

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
