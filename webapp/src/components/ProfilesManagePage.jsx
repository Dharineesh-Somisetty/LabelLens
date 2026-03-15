/**
 * ProfilesManagePage – full profile management screen.
 * Accessible from the Account drawer → "Manage Profiles".
 */
import { useState, useEffect, useCallback } from 'react';
import { listProfiles, createProfile, updateProfile, deleteProfile, setDefaultProfile } from '../services/profileApi';
import { useAuth } from '../context/AuthContext';
import EditProfileModal from './EditProfileModal';

export default function ProfilesManagePage({ onBack }) {
  const { session } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listProfiles();
      setProfiles(data);
      setError('');
    } catch (err) {
      // Never signOut automatically – a 401 is retried by the api.js interceptor.
      // If it still fails, show an error so the user can retry manually.
      setError('Could not load profiles.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) refresh();
  }, [session, refresh]);

  const handleSave = async (data, profileId) => {
    try {
      if (profileId) {
        await updateProfile(profileId, data);
      } else {
        await createProfile(data);
      }
      setShowModal(false);
      setEditTarget(null);
      setError('');
      await refresh();
    } catch (err) {
      const status = err.response?.status;
      if (status === 403) {
        setError('Upgrade to add more profiles.');
        return;
      }
      if (status === 422) {
        const detail = err.response?.data?.detail;
        setError(typeof detail === 'string' ? detail : 'Please check your input.');
        return;
      }
      setError(err.response?.data?.detail || 'Could not save profile.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this profile?')) return;
    try {
      await deleteProfile(id);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not delete profile.');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultProfile(id);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not set default.');
    }
  };

  return (
    <div className="min-h-screen bg-bg1 text-gray-800">
      <div className="mx-auto max-w-2xl px-4 py-10">

        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brandDeep mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-display font-extrabold text-gray-900">Manage Profiles</h1>
          <p className="text-sm text-gray-400 mt-1">
            Add, edit, or remove household profiles. Profiles customize ingredient scoring for each family member.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 flex items-center justify-between">
            <span>{error}</span>
            <div className="flex items-center gap-2 ml-2">
              <button onClick={() => { setError(''); refresh(); }} className="text-brandDeep font-medium hover:underline">Retry</button>
              <button onClick={() => setError('')} className="text-red-400">&#x2715;</button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="glass-strong p-5 animate-pulse">
                <div className="h-5 w-32 bg-gray-100 rounded mb-2" />
                <div className="h-3 w-48 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Profiles list */}
        {!loading && (
          <div className="space-y-3">
            {profiles.map((p) => (
              <div key={p.id} className="glass-strong p-5 flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-800">{p.name}</h3>
                    {p.is_default && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-brandTint text-brandDeep border border-brandLine font-medium">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {p.diet_style && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 capitalize">
                        {p.diet_style}
                      </span>
                    )}
                    {(p.allergies || []).map((a, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200">
                        {a}
                      </span>
                    ))}
                    {(p.avoid_terms || []).map((a, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                  {!p.is_default && (
                    <button
                      onClick={() => handleSetDefault(p.id)}
                      className="text-xs text-gray-400 hover:text-brandDeep p-1.5 rounded-lg hover:bg-gray-50 transition"
                      title="Set as default"
                    >
                      ★
                    </button>
                  )}
                  <button
                    onClick={() => { setEditTarget(p); setShowModal(true); }}
                    className="text-xs text-gray-400 hover:text-brandDeep p-1.5 rounded-lg hover:bg-gray-50 transition"
                    title="Edit"
                  >
                    ✎
                  </button>
                  {profiles.length > 1 && (
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-xs text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-50 transition"
                      title="Delete"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Add profile button */}
            <button
              onClick={() => { setEditTarget({}); setShowModal(true); }}
              className="w-full glass-strong p-4 text-center text-sm font-medium text-brandDeep hover:text-brand hover:bg-brandTint transition border-2 border-dashed border-brandLine rounded-3xl"
            >
              + Add Profile
            </button>
          </div>
        )}

        {!loading && profiles.length === 0 && !error && (
          <div className="text-center py-10">
            <p className="text-gray-400 text-sm mb-3">No profiles yet. Create one to personalize your scans.</p>
          </div>
        )}
      </div>

      {showModal && (
        <EditProfileModal
          profile={editTarget?.id ? editTarget : null}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
        />
      )}
    </div>
  );
}
