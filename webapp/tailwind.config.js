/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: 'rgb(var(--brand) / <alpha-value>)',
                brandSoft: 'rgb(var(--brand-soft) / <alpha-value>)',
                brandDeep: 'rgb(var(--brand-deep) / <alpha-value>)',
                brandTint: 'rgb(var(--brand-tint) / <alpha-value>)',
                brandLine: 'rgb(var(--brand-line) / <alpha-value>)',
                brandGreen: 'rgb(var(--brand-green) / <alpha-value>)',
                bg1: 'rgb(var(--bg1) / <alpha-value>)',
                bg2: 'rgb(var(--bg2) / <alpha-value>)',
                primary: {
                    50: '#f2fbf2',
                    100: '#dcf4df',
                    200: '#bbe8c1',
                    300: '#8fd59a',
                    400: '#63bd72',
                    500: '#3d9f4f',
                    600: '#2f8440',
                    700: '#286937',
                    800: '#255430',
                    900: '#20462a',
                },
                accent: {
                    50: '#effcfb',
                    100: '#d1f7f3',
                    200: '#a5ece6',
                    300: '#6ddbd6',
                    400: '#35c5c6',
                    500: '#1ea8ad',
                    600: '#18878e',
                    700: '#176d73',
                    800: '#17595f',
                    900: '#164c51',
                },
                warning: {
                    light: '#fef3cd',
                    DEFAULT: '#f59e0b',
                    dark: '#d97706',
                },
                danger: {
                    light: '#fef2f2',
                    DEFAULT: '#ef4444',
                    dark: '#b91c1c',
                },
                success: {
                    light: '#ecfdf5',
                    DEFAULT: '#10b981',
                    dark: '#047857',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'glass': '0 2px 16px rgba(0, 0, 0, 0.06)',
                'glow': '0 0 24px rgba(61, 159, 79, 0.22)',
                'glow-accent': '0 0 20px rgba(16, 185, 129, 0.2)',
                'card': '0 2px 16px rgba(0, 0, 0, 0.06)',
                'card-hover': '0 4px 24px rgba(0, 0, 0, 0.10)',
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
