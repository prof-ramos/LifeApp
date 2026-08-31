const lifeTokens = Object.freeze({
  colors: Object.freeze({
    background: '#07111F',
    foreground: '#F6F8FB',
    surface: '#0D1A2B',
    surfaceElevated: '#10283A',
    primary: '#79F2C0',
    primaryForeground: '#06111F',
    secondary: '#17304A',
    secondaryForeground: '#F6F8FB',
    muted: '#93A4B8',
    mutedSurface: '#122235',
    border: '#1D2B3B',
    destructive: '#EF4444',
    warning: '#F59E0B',
    success: '#22C55E',
  }),
  radius: Object.freeze({
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '30px',
    full: '9999px',
  }),
  spacing: Object.freeze({
    screen: '18px',
    card: '20px',
    section: '28px',
  }),
});

module.exports = { lifeTokens };
