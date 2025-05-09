/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff1f1',
          100: '#ffe0e0',
          200: '#ffc7c7',
          300: '#ffa3a3',
          400: '#ff8787',
          500: '#ff6b6b',
          600: '#ff4f4f',
          700: '#ff3333',
          800: '#ff1a1a',
          900: '#ff0000',
        },
        secondary: {
          50: '#f0f1ff',
          100: '#e6e7ff',
          200: '#c5c7ff',
          300: '#a3a7ff',
          400: '#8287ff',
          500: '#6066ff',
          600: '#4e54c8',
          700: '#3c4296',
          800: '#2a3064',
          900: '#181e32',
        },
        accent: {
          50: '#fff0f5',
          100: '#ffe0eb',
          200: '#ffc1d7',
          300: '#ffa3c3',
          400: '#ff84af',
          500: '#fc466b',
          600: '#ff4757',
          700: '#ff2943',
          800: '#ff0b2f',
          900: '#ff001b',
        },
        dark: {
          50: '#f7f7f8',
          100: '#eeeef1',
          200: '#d5d6dd',
          300: '#bbbdc8',
          400: '#8b8ea3',
          500: '#6b6f87',
          600: '#4e516a',
          700: '#3e4054',
          800: '#2e2f3e',
          900: '#1a1c2a',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.2), 0 10px 20px -2px rgba(0, 0, 0, 0.15)',
        'glow': '0 0 20px rgba(255, 107, 107, 0.2)',
        'glow-secondary': '0 0 20px rgba(78, 84, 200, 0.2)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #4E54C8 0%, #8F94FB 100%)',
        'gradient-accent': 'linear-gradient(135deg, #FC466B 0%, #3F5EFB 100%)',
        'gradient-dark': 'linear-gradient(135deg, #1a1c2a 0%, #2d1f3d 100%)',
      },
    },
  },
  plugins: [],
};