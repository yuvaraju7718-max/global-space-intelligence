/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          bg: '#050914',
          secondary: '#0A1222',
          panel: '#101B2D',
          'panel-hover': '#142238',
          'panel-glass': 'rgba(16, 27, 45, 0.75)',
          border: 'rgba(57, 213, 242, 0.12)',
          'border-subtle': 'rgba(255, 255, 255, 0.06)',
          'border-focus': 'rgba(57, 213, 242, 0.4)',
          cyan: '#39D5F2',
          blue: '#648CFF',
          violet: '#A78BFA',
          text: '#EAF3FF',
          muted: '#8798B3',
          success: '#10B981',
          failure: '#F43F5E',
          warning: '#F59E0B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -3px rgba(57, 213, 242, 0.25)',
        'glow-blue': '0 0 20px -3px rgba(100, 140, 255, 0.25)',
        'glow-violet': '0 0 20px -3px rgba(167, 139, 250, 0.25)',
        'panel': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backgroundImage: {
        'grid-pattern': "radial-gradient(rgba(57, 213, 242, 0.08) 1px, transparent 1px)",
        'space-gradient': 'radial-gradient(ellipse at 50% 0%, rgba(100, 140, 255, 0.08) 0%, rgba(5, 9, 20, 0) 70%)',
      }
    },
  },
  plugins: [],
}
