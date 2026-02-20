import { useEffect, useState } from 'react';

const ScoreGauge = ({ score, verdict }) => {
    const [animatedScore, setAnimatedScore] = useState(0);

    useEffect(() => {
        // Animate score from 0 to actual score
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

    // Determine color based on score
    const getScoreColor = (s) => {
        if (s >= 80) return { from: '#10b981', to: '#059669', text: 'text-success-400' }; // Green
        if (s >= 50) return { from: '#fbbf24', to: '#f59e0b', text: 'text-warning' }; // Yellow
        if (s >= 30) return { from: '#fb923c', to: '#f97316', text: 'text-warning-dark' }; // Orange
        return { from: '#ef4444', to: '#dc2626', text: 'text-danger' }; // Red
    };

    const colors = getScoreColor(score);
    const circumference = 2 * Math.PI * 70; // radius = 70
    const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

    return (
        <div className="relative w-56 h-56 mx-auto animate-fade-in">
            {/* SVG Circle Gauge */}
            <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 160 160">
                {/* Background Circle */}
                <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="12"
                    fill="none"
                />

                {/* Animated Progress Circle */}
                <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke={`url(#scoreGradient)`}
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000 ease-out"
                    style={{
                        filter: 'drop-shadow(0 0 8px rgba(0, 164, 85, 0.6))'
                    }}
                />

                {/* Gradient Definition */}
                <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={colors.from} />
                        <stop offset="100%" stopColor={colors.to} />
                    </linearGradient>
                </defs>
            </svg>

            {/* Score Text in Center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`text-5xl font-bold ${colors.text}`}>
                    {Math.round(animatedScore)}
                </div>
                <div className="text-sm text-gray-400 mt-1">/ 100</div>
            </div>
        </div>
    );
};

export default ScoreGauge;
