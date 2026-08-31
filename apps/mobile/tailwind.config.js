const { lifeTokens } = require('../../packages/design-tokens/tokens.cjs');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: lifeTokens.colors.background,
        foreground: lifeTokens.colors.foreground,
        card: lifeTokens.colors.surface,
        'card-elevated': lifeTokens.colors.surfaceElevated,
        primary: lifeTokens.colors.primary,
        'primary-foreground': lifeTokens.colors.primaryForeground,
        secondary: lifeTokens.colors.secondary,
        'secondary-foreground': lifeTokens.colors.secondaryForeground,
        muted: lifeTokens.colors.mutedSurface,
        'muted-foreground': lifeTokens.colors.muted,
        border: lifeTokens.colors.border,
        destructive: lifeTokens.colors.destructive,
        warning: lifeTokens.colors.warning,
        success: lifeTokens.colors.success,
      },
      borderRadius: {
        sm: lifeTokens.radius.sm,
        md: lifeTokens.radius.md,
        lg: lifeTokens.radius.lg,
        xl: lifeTokens.radius.xl,
      },
      spacing: {
        screen: lifeTokens.spacing.screen,
        card: lifeTokens.spacing.card,
        section: lifeTokens.spacing.section,
      },
    },
  },
  plugins: [],
};
