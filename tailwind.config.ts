import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: ["Cinzel", "Georgia", "serif"],
        heading: ["Cormorant Garamond", "Georgia", "serif"],
        body: ["Lato", "system-ui", "sans-serif"],
        accent: ["Amiri", "Georgia", "serif"],
      },
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        gold: "hsl(var(--gold))",
        "gold-light": "hsl(var(--gold-light))",
        "gold-dark": "hsl(var(--gold-dark))",
        maroon: "hsl(var(--maroon))",
        "maroon-light": "hsl(var(--maroon-light))",
        "maroon-dark": "hsl(var(--maroon-dark))",
        silver: "hsl(var(--silver))",
        "silver-light": "hsl(var(--silver-light))",
        "silver-dark": "hsl(var(--silver-dark))",
        emerald: "hsl(var(--emerald))",
        "emerald-light": "hsl(var(--emerald-light))",
        cream: "hsl(var(--cream))",
        "cream-dark": "hsl(var(--cream-dark))",
        ivory: "hsl(var(--ivory))",
        charcoal: "hsl(var(--charcoal))",
        "charcoal-light": "hsl(var(--charcoal-light))",
        burgundy: "hsl(var(--burgundy))",
        "burgundy-light": "hsl(var(--burgundy-light))",
        rose: "hsl(var(--rose))",
        blush: "hsl(var(--blush))",
        pearl: "hsl(var(--pearl))",
        champagne: "hsl(var(--champagne))",
        "rose-gold": "hsl(var(--rose-gold))",
        "rose-gold-light": "hsl(var(--rose-gold-light))",
        "rose-gold-dark": "hsl(var(--rose-gold-dark))",
        "royal-blue": "hsl(var(--royal-blue))",
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
        "fade-in": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(40px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        sparkle: {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.2)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.8s ease-out forwards",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "slide-in-right": "slide-in-right 0.5s ease-out forwards",
        "scale-in": "scale-in 0.4s ease-out forwards",
        shimmer: "shimmer 2s infinite linear",
        marquee: "marquee 30s linear infinite",
        float: "float 6s ease-in-out infinite",
        sparkle: "sparkle 2s ease-in-out infinite",
      },
      backgroundImage: {
        "gradient-gold": "linear-gradient(135deg, hsl(40 75% 50%) 0%, hsl(38 80% 38%) 100%)",
        "gradient-maroon": "linear-gradient(135deg, hsl(350 55% 28%) 0%, hsl(350 60% 20%) 100%)",
        "gradient-royal": "linear-gradient(135deg, hsl(350 55% 28%) 0%, hsl(40 75% 50%) 100%)",
        "gradient-emerald": "linear-gradient(135deg, hsl(160 50% 30%) 0%, hsl(160 55% 22%) 100%)",
      },
      boxShadow: {
        elegant: "0 8px 24px -8px hsl(30 15% 5% / 0.5)",
        gold: "0 8px 32px -8px hsl(40 75% 50% / 0.4)",
        antique: "0 4px 20px -4px hsl(30 15% 5% / 0.5), inset 0 1px 0 hsl(40 75% 50% / 0.1)",
        glow: "0 0 40px -10px hsl(40 75% 50% / 0.3)",
        "lg-elegant": "0 16px 48px -16px hsl(30 15% 5% / 0.6)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
