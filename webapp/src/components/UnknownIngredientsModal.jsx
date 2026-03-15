import { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const CATEGORY_OPTIONS = [
    { value: '', label: 'Not sure' },
    { value: 'preservative', label: 'Preservative' },
    { value: 'artificial_color', label: 'Artificial Color' },
    { value: 'sweetener', label: 'Sweetener' },
    { value: 'emulsifier', label: 'Emulsifier' },
    { value: 'thickener', label: 'Thickener / Stabilizer' },
    { value: 'flavor_enhancer', label: 'Flavor Enhancer' },
    { value: 'natural', label: 'Natural / Safe' },
    { value: 'other', label: 'Other' },
];

/**
 * Modal for reviewing unknown + fallback ingredients.
 * Users can submit unknown ingredients to improve the KB.
 */
const UnknownIngredientsModal = ({ unknownItems = [], fallbackItems = [], onClose }) => {
    const [submitted, setSubmitted] = useState(new Set());
    const [submitting, setSubmitting] = useState(null);

    const handleSubmit = async (item, category) => {
        setSubmitting(item.normalized);
        try {
            await fetch(`${API_BASE_URL}/api/feedback/unknown-ingredient`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ingredient_text: item.raw || item.normalized,
                    suggested_category: category || null,
                }),
            });
            setSubmitted((prev) => new Set([...prev, item.normalized]));
        } catch (err) {
            console.error('Failed to submit ingredient feedback:', err);
        } finally {
            setSubmitting(null);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-[90%] max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                    Unknown Ingredients
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                    These weren't found in our knowledge base. They may be OCR errors
                    or ingredients we haven't cataloged yet.
                </p>

                {/* Unknown items */}
                {unknownItems.map((item) => (
                    <UnknownItemRow
                        key={item.normalized}
                        item={item}
                        isSubmitted={submitted.has(item.normalized)}
                        isSubmitting={submitting === item.normalized}
                        onSubmit={handleSubmit}
                    />
                ))}

                {/* Fallback items */}
                {fallbackItems.length > 0 && (
                    <>
                        <h4 className="text-sm font-semibold text-gray-600 mt-5 mb-2">
                            Pattern-Matched (Low Confidence)
                        </h4>
                        {fallbackItems.map((item) => (
                            <div
                                key={item.normalized}
                                className="bg-brandTint border border-brandLine rounded-xl px-3 py-2 mb-2 text-sm"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-700">
                                        {item.display_name || item.normalized}
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-brandDeep border border-brandLine">
                                        {item.fallback_category || item.category}
                                    </span>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                    Detected as {item.fallback_category || item.category} by pattern rules
                                </p>
                            </div>
                        ))}
                    </>
                )}

                <button
                    onClick={onClose}
                    className="mt-4 w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm
                               font-semibold hover:bg-gray-800 transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    );
};


const UnknownItemRow = ({ item, isSubmitted, isSubmitting, onSubmit }) => {
    const [category, setCategory] = useState('');

    return (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-3 mb-2">
            <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700 text-sm">
                    {item.display_name || item.raw || item.normalized}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">
                    Unknown · Needs review
                </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
                Not in our knowledge base yet or OCR unclear.
            </p>

            {!isSubmitted ? (
                <div className="flex items-center gap-2 mt-2">
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-gray-200
                                   bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-amber-300"
                    >
                        {CATEGORY_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={() => onSubmit(item, category)}
                        disabled={isSubmitting}
                        className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold
                                   bg-emerald-500 text-white hover:bg-emerald-600
                                   disabled:opacity-50 transition-colors"
                    >
                        {isSubmitting ? '…' : 'Help Improve'}
                    </button>
                </div>
            ) : (
                <p className="text-xs text-emerald-600 font-semibold mt-2">
                    ✓ Thanks! Submitted for review.
                </p>
            )}
        </div>
    );
};

export default UnknownIngredientsModal;
