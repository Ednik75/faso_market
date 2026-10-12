/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      colors: {
        // Terre latérite — couleur principale
        brand: {
          50:  '#fdf6f2',
          100: '#fae8dd',
          200: '#f3ccb7',
          300: '#e9a885',
          400: '#dc7d51',
          500: '#cc5f31',
          600: '#b8461f',
          700: '#97361b',
          800: '#7a2e1c',
          900: '#64291b',
          950: '#36120a',
        },
        // Mil / safran — accent
        accent: {
          50:  '#fef9ec',
          100: '#fcefc9',
          200: '#f9de8e',
          300: '#f6c953',
          400: '#f2b630',
          500: '#e2961a',
          600: '#c57113',
          700: '#a35014',
          800: '#853f17',
          900: '#6d3516',
        },
        // Erreurs / suppression
        danger: {
          50:  '#fef2f3',
          100: '#fde3e5',
          200: '#fbcbd0',
          300: '#f7a3ab',
          400: '#f06f7c',
          500: '#e44454',
          600: '#c62f3c',
          700: '#a72432',
          800: '#8b212e',
          900: '#76202c',
        },
        // Neutres chauds — fonds
        paper: {
          50:  '#fbf9f6',
          100: '#f5f1ea',
          200: '#ebe4d8',
          300: '#dcd1bf',
          400: '#bfae94',
          500: '#a08c6f',
          600: '#857157',
          700: '#6b5a46',
          800: '#57493b',
          900: '#483d33',
        },
        // Encre — texte et surfaces sombres
        ink: {
          700: '#3a3430',
          800: '#2a2522',
          900: '#1c1917',
          950: '#110f0d',
        },
      },
      boxShadow: {
        'soft':    '0 1px 2px rgba(28,25,23,0.04), 0 2px 8px rgba(28,25,23,0.04)',
        'soft-md': '0 2px 4px rgba(28,25,23,0.04), 0 12px 32px -8px rgba(28,25,23,0.12)',
        'soft-lg': '0 4px 8px rgba(28,25,23,0.04), 0 24px 56px -12px rgba(28,25,23,0.18)',
        'inner-sm':'inset 0 1px 2px rgba(28,25,23,0.05)',
      },
      borderRadius: {
        'xl2': '1rem',
        'xl3': '1.25rem',
        'xl4': '1.75rem',
      },
      animation: {
        'fade-up':     'fadeUp 0.5s cubic-bezier(.2,.7,.3,1)',
        'fade-in':     'fadeIn 0.3s ease-out',
        'slide-right': 'slideRight 0.3s cubic-bezier(.2,.7,.3,1)',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideRight: {
          '0%':   { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
