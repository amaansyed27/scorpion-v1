
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#84a98c', // Moss Green
        'primary-focus': '#6e9177', // Darker Moss Green
        'secondary': '#f43f5e', // rose-500
        'accent': '#6366f1', // indigo-500
        'base-100': '#0f172a', // slate-900
        'base-200': '#1e293b', // slate-800
        'base-300': '#334155', // slate-700
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in-up': 'slideInUp 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}