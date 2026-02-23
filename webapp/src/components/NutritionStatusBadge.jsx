/**
 * NutritionStatusBadge – shows how nutrition data was sourced.
 *
 * Props:
 *   status  – "verified_barcode" | "extracted_photo" | "not_detected"
 *   source  – optional descriptive source string
 */
const NutritionStatusBadge = ({ status, source }) => {
    let pill, label, subtext;

    switch (status) {
        case 'verified_barcode':
            pill = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            label = 'Nutrition verified from barcode';
            subtext = source || 'Source: OpenFoodFacts (barcode)';
            break;
        case 'extracted_photo':
            pill = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            label = 'Nutrition extracted from label photo';
            subtext = source || 'Source: label photo (OCR)';
            break;
        default: // not_detected
            pill = 'bg-amber-50 text-amber-700 border-amber-200';
            label = 'Nutrition not detected — ingredient-only estimate';
            subtext = source || 'Scored from ingredients only; conservative cap applied.';
    }

    return (
        <div className="flex flex-col items-center gap-1 mt-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm border ${pill}`}>
                {label}
            </span>
            <span className="text-[11px] text-gray-400">{subtext}</span>
        </div>
    );
};

export default NutritionStatusBadge;
