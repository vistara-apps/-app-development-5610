/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'hsl(210 40% 96%)',
        accent: 'hsl(170 70% 45%)',
        primary: 'hsl(204 70% 53%)',
        surface: 'hsl(210 40% 99%)',
        'text-primary': 'hsl(210 40% 15%)',
        'text-secondary': 'hsl(210 40% 40%)',
      },
      borderRadius: {
        'lg': '16px',
        'md': '10px',
        'sm': '6px',
      },
      boxShadow: {
        'card': '0 8px 24px hsla(210, 40%, 12%, 0.12)',
      },
      spacing: {
        'sm': '8px',
        'md': '12px',
        'lg': '20px',
        'xl': '32px',
      },
    },
  },
  plugins: [],
}