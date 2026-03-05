import { useState } from 'react';
import UnknownIngredientsModal from './UnknownIngredientsModal';

/**
 * Banner showing ingredient recognition status.
 * Renders below the score card when there are unknown or fallback ingredients.
 *
 * Props:
 *   productScore — the product_score object from the API
 */
const UnknownIngredientsBanner = ({ productScore }) => {
    const [showModal, setShowModal] = useState(false);

    if (!productScore) return null;

    const {
        recognized_count = 0,
        total_ingredient_count = 0,
        unknown_count = 0,
        unknown_items = [],
        fallback_count = 0,
        fallback_items = [],
    } = productScore;

    // Nothing to show if everything is matched
    if (unknown_count === 0 && fallback_count === 0) return null;

    return (
        <>
            <div className={`flex items-center justify-between rounded-2xl px-4 py-3 mb-4 border text-sm ${
                unknown_count > 0
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-blue-50 border-blue-200'
            }`}>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold text-gray-700">
                        Recognized {recognized_count} of {total_ingredient_count} ingredients
                    </span>
                    {unknown_count > 0 && (
                        <span className="text-xs text-amber-700">
                            · {unknown_count} unknown
                        </span>
                    )}
                    {fallback_count > 0 && (
                        <span className="text-xs text-blue-700">
                            · {fallback_count} pattern-matched
                        </span>
                    )}
                </div>
                {unknown_count > 0 && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="ml-3 shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold
                                   bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                    >
                        Review
                    </button>
                )}
            </div>

            {showModal && (
                <UnknownIngredientsModal
                    unknownItems={unknown_items}
                    fallbackItems={fallback_items}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
};

export default UnknownIngredientsBanner;
