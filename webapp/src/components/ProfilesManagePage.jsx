/**
 * ProfilesManagePage – full profile management screen.
 * Redesigned with the Clinical Naturalist design system.
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
    <div className="min-h-screen bg-cn-surface text-cn-on-surface">
      <div className="max-w-3xl mx-auto px-6 py-12 pb-32">

        {/* Title Section */}
        <header className="mb-12 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={onBack}
              className="text-cn-outline hover:text-cn-primary transition-colors"
              aria-label="Go back"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h2 className="font-headline text-4xl font-extrabold tracking-tight text-cn-on-surface">
              Your Profiles
            </h2>
          </div>
          <p className="text-cn-on-surface-variant text-lg font-body">
            Manage household profiles for personalized ingredient analysis.
          </p>
        </header>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl bg-cn-error-container px-4 py-3 flex items-center justify-between animate-fade-in">
            <span className="text-sm text-cn-error font-body">{error}</span>
            <div className="flex items-center gap-2 ml-2">
              <button
                onClick={() => { setError(''); refresh(); }}
                className="text-cn-primary font-headline font-medium text-sm hover:underline"
              >
                Retry
              </button>
              <button onClick={() => setError('')} className="text-cn-error text-lg">&times;</button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="cn-card p-6 animate-pulse">
                <div className="h-5 w-32 bg-cn-surface-container-low rounded mb-3" />
                <div className="h-3 w-48 bg-cn-surface-container-low rounded mb-2" />
                <div className="flex gap-2 mt-3">
                  <div className="h-7 w-16 bg-cn-surface-container-low rounded-full" />
                  <div className="h-7 w-20 bg-cn-surface-container-low rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Profiles list */}
        {!loading && (
          <div className="space-y-16">

            {profiles.map((p) => (
              <section key={p.id} className="animate-slide-up">
                {/* Profile header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cn-primary to-cn-primary-container flex items-center justify-center text-white font-headline font-bold text-lg">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-headline text-xl font-bold tracking-tight text-cn-on-surface">{p.name}</h3>
                      {p.is_default && (
                        <span className="text-xs text-cn-primary font-medium">Default profile</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!p.is_default && (
                      <button
                        onClick={() => handleSetDefault(p.id)}
                        className="p-2 rounded-xl text-cn-outline hover:text-cn-primary hover:bg-cn-surface-container-low transition"
                        title="Set as default"
                      >
                        <span className="material-symbols-outlined text-xl">star</span>
                      </button>
                    )}
                    <button
                      onClick={() => { setEditTarget(p); setShowModal(true); }}
                      className="p-2 rounded-xl text-cn-outline hover:text-cn-primary hover:bg-cn-surface-container-low transition"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-xl">edit</span>
                    </button>
                    {profiles.length > 1 && (
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-2 rounded-xl text-cn-outline hover:text-cn-error hover:bg-red-50 transition"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Diet style */}
                {p.diet_style && (
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="material-symbols-outlined text-cn-primary text-xl">restaurant</span>
                      <h4 className="font-headline text-sm font-bold tracking-tight text-cn-on-surface-variant uppercase">Diet</h4>
                    </div>
                    <div className="cn-pref-card max-w-xs pointer-events-none">
                      <div className="flex flex-col">
                        <span className="font-headline font-bold text-cn-on-surface capitalize">{p.diet_style}</span>
                      </div>
                      <span className="material-symbols-outlined text-cn-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    </div>
                  </div>
                )}

                {/* Allergies */}
                {(p.allergies || []).length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="material-symbols-outlined text-cn-tertiary text-xl">warning</span>
                      <h4 className="font-headline text-sm font-bold tracking-tight text-cn-on-surface-variant uppercase">Allergies</h4>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {p.allergies.map((a, i) => (
                        <span key={i} className="cn-chip-warning">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Avoid terms */}
                {(p.avoid_terms || []).length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="material-symbols-outlined text-cn-outline text-xl">block</span>
                      <h4 className="font-headline text-sm font-bold tracking-tight text-cn-on-surface-variant uppercase">Avoid</h4>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {p.avoid_terms.map((a, i) => (
                        <span key={i} className="cn-chip-neutral">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* No details */}
                {!p.diet_style && !(p.allergies || []).length && !(p.avoid_terms || []).length && (
                  <p className="text-cn-outline text-sm font-body">No dietary preferences set. Tap edit to configure.</p>
                )}

                {/* Separator between profiles */}
                <div className="mt-8 h-px bg-cn-surface-container-high" />
              </section>
            ))}

            {/* Add profile button */}
            <button
              onClick={() => { setEditTarget({}); setShowModal(true); }}
              className="btn-cn-gradient"
            >
              + Add New Profile
            </button>
            <p className="text-center text-xs text-cn-on-surface-variant mt-4 uppercase tracking-widest font-headline font-bold">
              Profiles sync across all devices
            </p>
          </div>
        )}

        {!loading && profiles.length === 0 && !error && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 bg-cn-surface-container-low rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-cn-primary">person_add</span>
            </div>
            <h3 className="font-headline text-xl font-bold text-cn-on-surface mb-2">No profiles yet</h3>
            <p className="text-cn-on-surface-variant text-sm font-body mb-6">Create one to personalize your scans.</p>
            <button
              onClick={() => { setEditTarget({}); setShowModal(true); }}
              className="btn-cn-gradient max-w-sm mx-auto"
            >
              Create Your First Profile
            </button>
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
