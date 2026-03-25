/**
 * EditProfileModal – create or edit a household profile.
 * Clinical Naturalist design system.
 */
import { useState, useEffect } from 'react';

const DIET_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'halal', label: 'Halal' },
];

export default function EditProfileModal({ profile, onSave, onClose }) {
  const isNew = !profile?.id;

  const [name, setName] = useState(profile?.name || '');
  const [dietStyle, setDietStyle] = useState(profile?.diet_style || '');
  const [allergiesText, setAllergiesText] = useState(
    (profile?.allergies || []).join(', ')
  );
  const [avoidText, setAvoidText] = useState(
    (profile?.avoid_terms || []).join(', ')
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Name is required.');
      return;
    }

    setSaving(true);
    const data = {
      name: trimmedName,
      diet_style: dietStyle || null,
      allergies: allergiesText
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
      avoid_terms: avoidText
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    };

    try {
      await onSave(data, profile?.id);
    } catch {
      // Error is handled by parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 bg-cn-surface-container-lowest rounded-t-3xl sm:rounded-3xl shadow-xl w-full max-w-md p-6 space-y-5 animate-slide-up"
      >
        <h2 className="text-xl font-headline font-bold text-cn-on-surface">
          {isNew ? 'Add Profile' : 'Edit Profile'}
        </h2>

        {/* Error */}
        {error && (
          <p className="text-xs text-cn-error bg-cn-error-container rounded-xl px-3 py-2 font-body">
            {error}
          </p>
        )}

        {/* Name */}
        <div>
          <label className="block text-xs font-headline font-bold text-cn-on-surface-variant mb-1.5 uppercase tracking-wide">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mom, Dad, Kid"
            className="w-full px-4 py-3 rounded-xl bg-cn-surface-container-low text-cn-on-surface font-body placeholder-cn-outline focus:outline-none focus:ring-2 focus:ring-cn-primary/20 transition text-sm"
          />
        </div>

        {/* Diet */}
        <div>
          <label className="block text-xs font-headline font-bold text-cn-on-surface-variant mb-2 uppercase tracking-wide">
            Diet
          </label>
          <div className="flex flex-wrap gap-2">
            {DIET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDietStyle(opt.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition font-body ${
                  dietStyle === opt.value
                    ? 'bg-cn-primary-fixed text-cn-on-primary-fixed-variant'
                    : 'bg-cn-surface-container-high text-cn-on-surface-variant hover:bg-cn-surface-container-highest'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Allergies */}
        <div>
          <label className="block text-xs font-headline font-bold text-cn-on-surface-variant mb-1.5 uppercase tracking-wide">
            Allergies (comma-separated)
          </label>
          <input
            type="text"
            value={allergiesText}
            onChange={(e) => setAllergiesText(e.target.value)}
            placeholder="e.g. peanuts, milk, shellfish"
            className="w-full px-4 py-3 rounded-xl bg-cn-surface-container-low text-cn-on-surface font-body placeholder-cn-outline focus:outline-none focus:ring-2 focus:ring-cn-primary/20 transition text-sm"
          />
        </div>

        {/* Avoid terms */}
        <div>
          <label className="block text-xs font-headline font-bold text-cn-on-surface-variant mb-1.5 uppercase tracking-wide">
            Avoid (comma-separated)
          </label>
          <input
            type="text"
            value={avoidText}
            onChange={(e) => setAvoidText(e.target.value)}
            placeholder="e.g. palm oil, MSG, aspartame"
            className="w-full px-4 py-3 rounded-xl bg-cn-surface-container-low text-cn-on-surface font-body placeholder-cn-outline focus:outline-none focus:ring-2 focus:ring-cn-primary/20 transition text-sm"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-full bg-cn-surface-container-high text-cn-on-surface-variant font-headline font-bold text-sm hover:bg-cn-surface-container-highest transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 rounded-full bg-gradient-to-r from-cn-primary to-cn-primary-container text-cn-on-primary font-headline font-bold text-sm hover:shadow-cn-glow transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && (
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            )}
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
