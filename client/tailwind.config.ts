import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    function({ addUtilities }: any) {
      const newUtilities = {
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
          'scrollbar-color': '#cbd5e1 #f1f5f9',
        },
        '.scrollbar-thumb-slate-300': {
          'scrollbar-color': '#cbd5e1 #f1f5f9',
        },
        '.scrollbar-track-slate-100': {
          'scrollbar-color': '#cbd5e1 #f1f5f9',
        },
        '.scrollbar-thumb-slate-600': {
          'scrollbar-color': '#475569 #1e293b',
        },
        '.scrollbar-track-slate-800': {
          'scrollbar-color': '#475569 #1e293b',
        },
        '.scrollbar-thin::-webkit-scrollbar': {
          width: '6px',
          height: '6px',
        },
        '.scrollbar-thin::-webkit-scrollbar-track': {
          background: '#f1f5f9',
          borderRadius: '3px',
        },
        '.scrollbar-thin::-webkit-scrollbar-thumb': {
          background: '#cbd5e1',
          borderRadius: '3px',
        },
        '.scrollbar-thin::-webkit-scrollbar-thumb:hover': {
          background: '#94a3b8',
        },
        '.dark .scrollbar-thin::-webkit-scrollbar-track': {
          background: '#1e293b',
        },
        '.dark .scrollbar-thin::-webkit-scrollbar-thumb': {
          background: '#475569',
        },
        '.dark .scrollbar-thin::-webkit-scrollbar-thumb:hover': {
          background: '#64748b',
        },
        '.custom-scrollbar::-webkit-scrollbar': {
          width: '10px',
          height: '10px',
        },
        '.custom-scrollbar::-webkit-scrollbar-track': {
          background: '#f1f5f9',
          borderRadius: '6px',
        },
        '.custom-scrollbar::-webkit-scrollbar-thumb': {
          background: '#cbd5e1',
          borderRadius: '6px',
          border: '2px solid #f1f5f9',
        },
        '.custom-scrollbar::-webkit-scrollbar-thumb:hover': {
          background: '#94a3b8',
          border: '2px solid #e2e8f0',
        },
        '.custom-scrollbar::-webkit-scrollbar-corner': {
          background: '#f1f5f9',
        },
        '.dark .custom-scrollbar::-webkit-scrollbar-track': {
          background: '#1e293b',
        },
        '.dark .custom-scrollbar::-webkit-scrollbar-thumb': {
          background: '#475569',
          border: '2px solid #1e293b',
        },
        '.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover': {
          background: '#64748b',
          border: '2px solid #334155',
        },
        '.dark .custom-scrollbar::-webkit-scrollbar-corner': {
          background: '#1e293b',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}
export default config
