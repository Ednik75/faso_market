/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Vert forêt — couleur principale (drapeau BF)
        forest: {
          50:  '#edfaf3',
          100: '#d3f5e3',
          200: '#abeacc',
          300: '#73d9ad',
          400: '#3abf8a',
          500: '#18a370',
          600: '#0d8259',
          700: '#0b6848',
          800: '#0b5239',
          900: '#0a4330',
          950: '#052e20',
        },
        // Or Sahel — accent luxe
        gold: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f4a200',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Rouge Burkina — secondaire (drapeau BF)
        crimson: {
          50:  '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        },
        // Sable chaud — background
        sand: {
          50:  '#fdfaf5',
          100: '#f9f2e7',
          200: '#f2e3cc',
          300: '#e8ceaa',
          400: '#dbb282',
          500: '#cf965e',
          600: '#b87a45',
          700: '#976139',
          800: '#7a4f31',
          900: '#63412a',
        },
      },
      backgroundImage: {
        'gradient-hero':    'linear-gradient(135deg, #052e20 0%, #0b5239 40%, #0d6844 70%, #18a370 100%)',
        'gradient-gold':    'linear-gradient(135deg, #f4a200 0%, #d97706 100%)',
        'gradient-crimson': 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
        'gradient-forest':  'linear-gradient(135deg, #0d8259 0%, #0b6848 100%)',
        'gradient-card':    'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.6) 100%)',
        'gradient-dark':    'linear-gradient(135deg, #0a4330 0%, #052e20 100%)',
        'pattern-geo':      "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'glass':   '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
        'glass-md':'0 16px 48px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)',
        'glass-lg':'0 24px 64px rgba(0,0,0,0.16), 0 8px 24px rgba(0,0,0,0.08)',
        'gold':    '0 8px 32px rgba(244,162,0,0.3)',
        'forest':  '0 8px 32px rgba(13,130,89,0.3)',
        'crimson': '0 8px 32px rgba(225,29,72,0.3)',
        'inner-sm':'inset 0 1px 2px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        'xl2': '1rem',
        'xl3': '1.5rem',
        'xl4': '2rem',
      },
      animation: {
        'fade-up':     'fadeUp 0.6s ease-out',
        'fade-in':     'fadeIn 0.4s ease-out',
        'slide-right': 'slideRight 0.4s ease-out',
        'pulse-gold':  'pulseGold 2s ease-in-out infinite',
        'float':       'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideRight: {
          '0%':   { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(244,162,0,0.4)' },
          '50%':      { boxShadow: '0 0 0 12px rgba(244,162,0,0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
