/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#e6f7f0',
                    100: '#b3e6d1',
                    200: '#80d6b2',
                    300: '#4dc593',
                    400: '#1ab574',
                    500: '#00a455',
                    600: '#008344',
                    700: '#006233',
                    800: '#004122',
                    900: '#002111',
                },
                accent: {
                    50: '#e6f2ff',
                    100: '#b3d9ff',
                    200: '#80c0ff',
                    300: '#4da7ff',
                    400: '#1a8eff',
                    500: '#0075e6',
                    600: '#005db3',
                    700: '#004580',
                    800: '#002d4d',
                    900: '#00151a',
                },
                warning: {
                    light: '#fef3cd',
                    DEFAULT: '#ffb020',
                    dark: '#ff8c00',
                },
                danger: {
                    light: '#fee',
                    DEFAULT: '#ef4444',
                    dark: '#b91c1c',
                },
                success: {
                    light: '#d1fae5',
                    DEFAULT: '#10b981',
                    dark: '#047857',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                'glow': '0 0 20px rgba(0, 164, 85, 0.4)',
                'glow-accent': '0 0 20px rgba(0, 117, 230, 0.4)',
            },
            backdropBlur: {
                xs: '2px',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in',
                'slide-up': 'slideUp 0.5s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'spin-slow': 'spin 3s linear infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
