/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                /* ── Legacy brand aliases (keep for untouched components) ── */
                brand: 'rgb(var(--brand) / <alpha-value>)',
                brandSoft: 'rgb(var(--brand-soft) / <alpha-value>)',
                brandDeep: 'rgb(var(--brand-deep) / <alpha-value>)',
                brandTint: 'rgb(var(--brand-tint) / <alpha-value>)',
                brandLine: 'rgb(var(--brand-line) / <alpha-value>)',
                brandGreen: 'rgb(var(--brand-green) / <alpha-value>)',
                bg1: 'rgb(var(--bg1) / <alpha-value>)',
                bg2: 'rgb(var(--bg2) / <alpha-value>)',

                /* ── Clinical Naturalist design system ── */
                'cn-primary': '#006d37',
                'cn-primary-container': '#27ae60',
                'cn-on-primary': '#ffffff',
                'cn-on-primary-container': '#00391a',
                'cn-primary-fixed': '#7efba4',
                'cn-on-primary-fixed': '#00210c',
                'cn-on-primary-fixed-variant': '#005228',

                'cn-secondary': '#3c6847',
                'cn-secondary-container': '#bdefc5',
                'cn-on-secondary': '#ffffff',
                'cn-on-secondary-container': '#426e4c',

                'cn-tertiary': '#a7344c',
                'cn-tertiary-container': '#f26d83',
                'cn-on-tertiary': '#ffffff',
                'cn-on-tertiary-container': '#670021',

                'cn-error': '#ba1a1a',
                'cn-error-container': '#ffdad6',
                'cn-on-error': '#ffffff',

                'cn-surface': '#f8fafb',
                'cn-surface-dim': '#d8dadb',
                'cn-surface-bright': '#f8fafb',
                'cn-surface-container-lowest': '#ffffff',
                'cn-surface-container-low': '#f2f4f5',
                'cn-surface-container': '#eceeef',
                'cn-surface-container-high': '#e6e8e9',
                'cn-surface-container-highest': '#e1e3e4',
                'cn-surface-variant': '#e1e3e4',

                'cn-on-surface': '#191c1d',
                'cn-on-surface-variant': '#3d4a3f',
                'cn-outline': '#6d7a6e',
                'cn-outline-variant': '#bccabc',

                /* ── Keep existing palette for other pages ── */
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
                headline: ['Lexend', 'system-ui', 'sans-serif'],
                body: ['Public Sans', 'Inter', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'glass': '0 2px 16px rgba(0, 0, 0, 0.06)',
                'glow': '0 0 24px rgba(61, 159, 79, 0.22)',
                'glow-accent': '0 0 20px rgba(16, 185, 129, 0.2)',
                'card': '0 2px 16px rgba(0, 0, 0, 0.06)',
                'card-hover': '0 4px 24px rgba(0, 0, 0, 0.10)',
                'soft': '0 40px 60px -15px rgba(25, 28, 29, 0.06)',
                'cn-glow': '0 0 24px rgba(0, 109, 55, 0.20)',
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
