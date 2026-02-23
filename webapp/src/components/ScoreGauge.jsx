import { useEffect, useState } from 'react';

const ScoreGauge = ({ score, verdict }) => {
    const [animatedScore, setAnimatedScore] = useState(0);

    useEffect(() => {
        const duration = 1500;
        const steps = 60;
        const increment = score / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= score) {
                setAnimatedScore(score);
                clearInterval(timer);
            } else {
                setAnimatedScore(current);
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [score]);

    // Color based on score
    const getScoreColor = (s) => {
        if (s >= 80) return { from: '#10b981', to: '#34d399', text: 'text-emerald-600', label: 'Excellent' };
        if (s >= 60) return { from: '#6366f1', to: '#818cf8', text: 'text-indigo-600', label: 'Good' };
        if (s >= 40) return { from: '#f59e0b', to: '#fbbf24', text: 'text-amber-600', label: 'Fair' };
        if (s >= 25) return { from: '#f97316', to: '#fb923c', text: 'text-orange-600', label: 'Poor' };
        return { from: '#ef4444', to: '#f87171', text: 'text-red-600', label: 'Bad' };
    };

    const colors = getScoreColor(score);

    // Full circle gauge using strokeDasharray/strokeDashoffset
    const r = 70;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (animatedScore / 100) * circumference;

    return (
        <div className="relative w-48 h-48 mx-auto animate-fade-in">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                {/* Gradient Definition */}
                <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={colors.from} />
                        <stop offset="100%" stopColor={colors.to} />
                    </linearGradient>
                </defs>

                {/* Background circle */}
                <circle
                    cx="80"
                    cy="80"
                    r={r}
                    stroke="#e5e7eb"
                    strokeWidth="12"
                    fill="none"
                />

                {/* Progress circle */}
                <circle
                    cx="80"
                    cy="80"
                    r={r}
                    stroke="url(#scoreGradient)"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-1000 ease-out"
                    style={{
                        filter: `drop-shadow(0 0 6px ${colors.from}66)`
                    }}
                />
            </svg>

            {/* Score text centered */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`text-4xl font-bold ${colors.text}`}>
                    {Math.round(animatedScore)}
                </div>
                <div className="text-sm text-gray-400 font-normal -mt-0.5">/100</div>
                <div className="text-sm text-gray-500 font-medium mt-1">
                    {colors.label}
                </div>
            </div>
        </div>
    );
};

export default ScoreGauge;
