/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Primary — deep teal / healthcare blue
        primary: {
          50:  'hsl(196, 100%, 97%)',
          100: 'hsl(196, 87%, 90%)',
          200: 'hsl(196, 82%, 78%)',
          300: 'hsl(196, 75%, 65%)',
          400: 'hsl(196, 70%, 52%)',
          500: 'hsl(196, 72%, 40%)',
          600: 'hsl(196, 74%, 32%)',
          700: 'hsl(196, 78%, 24%)',
          800: 'hsl(196, 80%, 18%)',
          900: 'hsl(196, 82%, 12%)',
          DEFAULT: 'hsl(196, 72%, 40%)',
          foreground: 'hsl(0, 0%, 100%)',
        },
        // Accent — warm green for positive states
        accent: {
          50:  'hsl(160, 84%, 95%)',
          100: 'hsl(160, 80%, 85%)',
          500: 'hsl(160, 60%, 45%)',
          600: 'hsl(160, 62%, 38%)',
          DEFAULT: 'hsl(160, 60%, 45%)',
          foreground: 'hsl(0, 0%, 100%)',
        },
        // Neutral grey system
        border:      'hsl(220, 13%, 91%)',
        input:       'hsl(220, 13%, 91%)',
        ring:        'hsl(196, 72%, 40%)',
        background:  'hsl(220, 20%, 98%)',
        foreground:  'hsl(220, 20%, 10%)',
        card: {
          DEFAULT:    'hsl(0, 0%, 100%)',
          foreground: 'hsl(220, 20%, 10%)',
        },
        muted: {
          DEFAULT:    'hsl(220, 14%, 96%)',
          foreground: 'hsl(220, 10%, 48%)',
        },
        destructive: {
          DEFAULT:    'hsl(0, 72%, 51%)',
          foreground: 'hsl(0, 0%, 100%)',
        },
        warning: {
          DEFAULT:    'hsl(38, 92%, 50%)',
          foreground: 'hsl(0, 0%, 100%)',
        },
        success: {
          DEFAULT:    'hsl(142, 71%, 45%)',
          foreground: 'hsl(0, 0%, 100%)',
        },
        // Status badge colors
        status: {
          confirmed:  'hsl(196, 72%, 40%)',
          completed:  'hsl(142, 71%, 45%)',
          cancelled:  'hsl(0, 72%, 51%)',
          pending:    'hsl(38, 92%, 50%)',
          held:       'hsl(262, 52%, 47%)',
        },
      },
      borderRadius: {
        lg: '0.625rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      boxShadow: {
        card:  '0 1px 3px 0 rgba(0,0,0,.07), 0 1px 2px -1px rgba(0,0,0,.05)',
        modal: '0 20px 60px -12px rgba(0,0,0,.18)',
        sm:    '0 1px 2px 0 rgba(0,0,0,.05)',
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.25s ease-out',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'skeleton':   'skeleton 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' },              to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%, 100%': { opacity: '1' },        '50%': { opacity: '.7' } },
        skeleton:  { '0%': { backgroundPosition: '200% 0' }, '100%': { backgroundPosition: '-200% 0' } },
      },
    },
  },
  plugins: [],
}
