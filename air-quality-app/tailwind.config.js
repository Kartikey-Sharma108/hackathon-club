/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                aqi: {
                    good: '#00e400',
                    moderate: '#ffff00',
                    sensitive: '#ff7e00',
                    unhealthy: '#ff0000',
                    veryUnhealthy: '#8f3f97',
                    hazardous: '#7e0023',
                },
            },
            backdropBlur: {
                xs: '2px',
            },
        },
    },
    plugins: [],
}
