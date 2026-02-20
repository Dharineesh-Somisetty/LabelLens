const IngredientCard = ({ ingredient, type = 'good' }) => {
    // Parse ingredient text (format: "ingredient name (+score)" or "ingredient name (reason)")
    const parseIngredient = (text) => {
        const match = text.match(/^(.+?)\s*\((.+?)\)$/);
        if (match) {
            return {
                name: match[1].trim(),
                detail: match[2].trim(),
            };
        }
        return {
            name: text,
            detail: null,
        };
    };

    const { name, detail } = parseIngredient(ingredient);
    const isPositive = detail && detail.startsWith('+');

    return (
        <div className={`ingredient-card ${type === 'good' ? 'border-l-4 border-success-500' : 'border-l-4 border-danger'}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <h4 className="font-semibold text-white capitalize mb-1">{name}</h4>
                    {detail && (
                        <p className={`text-sm ${isPositive ? 'text-success-400' : 'text-danger-light'}`}>
                            {detail}
                        </p>
                    )}
                </div>
                <div className="text-2xl">
                    {type === 'good' ? '✓' : '✗'}
                </div>
            </div>
        </div>
    );
};

export default IngredientCard;
