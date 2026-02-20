import { Doughnut, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const InsightsCharts = ({ goodIngredients, badIngredients, score }) => {
    // Chart options with dark theme
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                labels: {
                    color: '#E5E7EB',
                    font: {
                        size: 12,
                    },
                },
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#E5E7EB',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 1,
            },
        },
    };

    // Donut Chart: Good vs Bad Ingredients Ratio
    const ratioData = {
        labels: ['Quality Ingredients', 'Concerns'],
        datasets: [
            {
                data: [goodIngredients.length, badIngredients.length],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)', // Success green
                    'rgba(239, 68, 68, 0.8)',  // Danger red
                ],
                borderColor: [
                    'rgba(16, 185, 129, 1)',
                    'rgba(239, 68, 68, 1)',
                ],
                borderWidth: 2,
            },
        ],
    };

    // Bar Chart: Score breakdown
    const scoreBreakdownData = {
        labels: ['Protein Quality', 'Bioavailability', 'Bloat Risk', 'Overall Score'],
        datasets: [
            {
                label: 'Score Contribution',
                data: [
                    score * 0.4, // Estimate protein quality contribution
                    score * 0.3, // Estimate bioavailability contribution
                    Math.max(0, 100 - score * 0.3), // Bloat risk penalty (inverted)
                    score,
                ],
                backgroundColor: [
                    'rgba(0, 164, 85, 0.8)',
                    'rgba(0, 117, 230, 0.8)',
                    'rgba(255, 176, 32, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                ],
                borderColor: [
                    'rgba(0, 164, 85, 1)',
                    'rgba(0, 117, 230, 1)',
                    'rgba(255, 176, 32, 1)',
                    'rgba(139, 92, 246, 1)',
                ],
                borderWidth: 2,
            },
        ],
    };

    const barOptions = {
        ...chartOptions,
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    color: '#9CA3AF',
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                },
            },
            x: {
                ticks: {
                    color: '#9CA3AF',
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                },
            },
        },
    };

    return (
        <div className="grid md:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '0.35s' }}>
            {/* Ingredient Ratio Chart */}
            <div className="glass-strong p-6">
                <h3 className="text-lg font-bold mb-4 text-white text-center">
                    Ingredient Distribution
                </h3>
                <div className="max-w-xs mx-auto">
                    <Doughnut data={ratioData} options={chartOptions} />
                </div>
                <div className="mt-4 text-center text-sm text-gray-400">
                    {goodIngredients.length > badIngredients.length ? (
                        <p className="text-success-400">✓ More quality ingredients than concerns</p>
                    ) : goodIngredients.length < badIngredients.length ? (
                        <p className="text-danger">✗ More concerns than quality ingredients</p>
                    ) : (
                        <p className="text-warning">⚠ Equal mix of quality and concerns</p>
                    )}
                </div>
            </div>

            {/* Score Breakdown Chart */}
            <div className="glass-strong p-6">
                <h3 className="text-lg font-bold mb-4 text-white text-center">
                    Score Breakdown
                </h3>
                <div className="h-64">
                    <Bar data={scoreBreakdownData} options={barOptions} />
                </div>
            </div>
        </div>
    );
};

export default InsightsCharts;
