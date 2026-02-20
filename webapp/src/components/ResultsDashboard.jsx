import ScoreGauge from './ScoreGauge';
import IngredientCard from './IngredientCard';
import InsightsCharts from './InsightsCharts';

const ResultsDashboard = ({ data, productMetadata, mode, onReset }) => {
    const { final_score, verdict, good_ingredients, bad_ingredients, warnings, analysis_log } = data;

    // Determine verdict badge color
    const getVerdictColor = () => {
        if (final_score >= 80) return 'badge-success';
        if (final_score >= 50) return 'badge-info';
        if (final_score >= 30) return 'badge-warning';
        return 'badge-danger';
    };

    // Generate recommendations based on mode and score
    const getRecommendations = () => {
        const recommendations = [];

        if (mode === 'BULK') {
            if (final_score >= 70) {
                recommendations.push('✓ Excellent choice for muscle building');
                recommendations.push('✓ High protein quality supports recovery');
            } else if (final_score >= 40) {
                recommendations.push('⚠ Decent option but consider higher quality proteins');
                recommendations.push('⚠ Check for cleaner alternatives');
            } else {
                recommendations.push('✗ Not recommended for bulking');
                recommendations.push('✗ Look for products with whey protein isolate or pea protein');
            }
        } else { // CUT
            if (final_score >= 70) {
                recommendations.push('✓ Great for cutting phase');
                recommendations.push('✓ Low bloat risk helps maintain definition');
            } else if (final_score >= 40) {
                recommendations.push('⚠ May cause some bloating');
                recommendations.push('⚠ Consider alternatives with fewer carbs');
            } else {
                recommendations.push('✗ Too many low-quality ingredients for cutting');
                recommendations.push('✗ High bloat risk - avoid during cut');
            }
        }

        return recommendations;
    };

    return (
        <div className="container mx-auto px-4 py-8 custom-scrollbar max-h-screen overflow-y-auto">
            {/* Header */}
            <div className="text-center mb-8 animate-fade-in">
                {productMetadata ? (
                    <>
                        <h1 className="text-4xl font-display font-bold mb-2 gradient-text">
                            {productMetadata.name || 'Unknown Product'}
                        </h1>
                        {productMetadata.brand && (
                            <p className="text-xl text-gray-300 font-semibold mb-2">
                                {productMetadata.brand}
                            </p>
                        )}
                    </>
                ) : (
                    <h1 className="text-4xl font-display font-bold mb-2 gradient-text">
                        Analysis Complete
                    </h1>
                )}
                <p className="text-gray-400">
                    Mode: <span className="font-semibold text-white">{mode}</span>
                </p>
            </div>

            {/* Score Section */}
            <div className="max-w-4xl mx-auto mb-8">
                <div className="glass-strong p-8 text-center animate-slide-up">
                    <h2 className="text-2xl font-bold mb-6 text-white">Your Apex Score</h2>

                    <ScoreGauge score={final_score} verdict={verdict} />

                    <div className="mt-6">
                        <span className={`${getVerdictColor()} text-lg`}>
                            {verdict}
                        </span>
                    </div>
                </div>
            </div>

            {/* Ingredient Breakdown */}
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6 mb-8">
                {/* Good Ingredients */}
                <div className="glass-strong p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <h3 className="text-xl font-bold mb-4 text-success-400 flex items-center gap-2">
                        <span>✓</span>
                        <span>Quality Ingredients ({good_ingredients.length})</span>
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                        {good_ingredients.length > 0 ? (
                            good_ingredients.map((ingredient, idx) => (
                                <IngredientCard key={idx} ingredient={ingredient} type="good" />
                            ))
                        ) : (
                            <p className="text-gray-400 text-center py-8">No quality ingredients detected</p>
                        )}
                    </div>
                </div>

                {/* Bad Ingredients */}
                <div className="glass-strong p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <h3 className="text-xl font-bold mb-4 text-danger flex items-center gap-2">
                        <span>✗</span>
                        <span>Concerns ({bad_ingredients.length})</span>
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                        {bad_ingredients.length > 0 ? (
                            bad_ingredients.map((ingredient, idx) => (
                                <IngredientCard key={idx} ingredient={ingredient} type="bad" />
                            ))
                        ) : (
                            <p className="text-gray-400 text-center py-8">No concerning ingredients found</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
                <div className="max-w-6xl mx-auto mb-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                    <div className="glass-strong p-6 border-l-4 border-warning">
                        <h3 className="text-xl font-bold mb-4 text-warning flex items-center gap-2">
                            <span>⚠️</span>
                            <span>Warnings</span>
                        </h3>
                        <ul className="space-y-2">
                            {warnings.map((warning, idx) => (
                                <li key={idx} className="text-warning-light flex items-start gap-2">
                                    <span className="mt-1">•</span>
                                    <span>{warning}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Insights & Charts */}
            <div className="max-w-6xl mx-auto mb-8">
                <InsightsCharts
                    goodIngredients={good_ingredients}
                    badIngredients={bad_ingredients}
                    score={final_score}
                />
            </div>

            {/* Recommendations */}
            <div className="max-w-6xl mx-auto mb-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <div className="glass-strong p-6">
                    <h3 className="text-xl font-bold mb-4 text-accent-400 flex items-center gap-2">
                        <span>💡</span>
                        <span>Recommendations</span>
                    </h3>
                    <ul className="space-y-2">
                        {getRecommendations().map((rec, idx) => (
                            <li key={idx} className="text-gray-300 flex items-start gap-2">
                                <span className="mt-1">{rec.charAt(0)}</span>
                                <span>{rec.substring(2)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Analysis Log (Collapsible) */}
            <div className="max-w-6xl mx-auto mb-8">
                <details className="glass-strong p-6 animate-slide-up" style={{ animationDeay: '0.5s' }}>
                    <summary className="text-lg font-bold text-gray-300 cursor-pointer hover:text-white transition-colors">
                        📋 Detailed Analysis Log
                    </summary>
                    <div className="mt-4 space-y-1 text-sm text-gray-400 font-mono bg-black/30 p-4 rounded-lg max-h-64 overflow-y-auto custom-scrollbar">
                        {analysis_log.map((log, idx) => (
                            <div key={idx}>{log}</div>
                        ))}
                    </div>
                </details>
            </div>

            {/* Action Buttons */}
            <div className="max-w-6xl mx-auto text-center pb-8">
                <button
                    onClick={onReset}
                    className="btn-primary text-lg px-8 py-4"
                >
                    Scan Another Product
                </button>
            </div>
        </div>
    );
};

export default ResultsDashboard;
