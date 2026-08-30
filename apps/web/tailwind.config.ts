import type { Config } from 'tailwindcss';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { lifeTokens } = require('../../packages/design-tokens/tokens.cjs');

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
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
      boxShadow: {
        life: '0 24px 70px rgba(0,0,0,.24)',
      },
    },
  },
  plugins: [],
};

export default config;
