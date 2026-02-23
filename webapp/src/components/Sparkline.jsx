/**
 * Sparkline – decorative mini graph for stat cards.
 * Renders a small SVG wave pattern as a visual accent.
 *
 * Props:
 *   color   – stroke color (CSS color string)
 *   width   – SVG width (default 80)
 *   height  – SVG height (default 32)
 *   variant – 'wave' | 'bar' (default 'wave')
 */
const Sparkline = ({ color = '#6366f1', width = 80, height = 32, variant = 'wave' }) => {
    if (variant === 'bar') {
        const bars = [0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.3, 0.75];
        const barW = width / (bars.length * 2);
        return (
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="opacity-60">
                {bars.map((h, i) => (
                    <rect
                        key={i}
                        x={i * barW * 2 + barW * 0.5}
                        y={height - h * height}
                        width={barW}
                        height={h * height}
                        rx={barW / 2}
                        fill={color}
                        opacity={0.5 + h * 0.5}
                    />
                ))}
            </svg>
        );
    }

    // Wave variant
    const points = [0.3, 0.5, 0.4, 0.7, 0.6, 0.8, 0.5, 0.9, 0.7, 0.4, 0.6, 0.3];
    const step = width / (points.length - 1);
    const pathData = points
        .map((p, i) => {
            const x = i * step;
            const y = height - p * height * 0.8 - height * 0.1;
            return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
        })
        .join(' ');

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="opacity-50">
            <path
                d={pathData}
                stroke={color}
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default Sparkline;
