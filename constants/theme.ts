export const Colors = {
  bg: '#F5F6F8',         
  surface: '#FFFFFF',    
  elevated: '#FFFFFF',   
  border: '#EAEAEA',     
  borderLight: '#F2F2F2',
  textPrimary: '#121212', 
  textSecondary: '#6B6B6B', 
  textMuted: '#9E9E9E',
  accent: '#121212',      
  accentDim: '#404040',
  accentGlow: 'rgba(0, 0, 0, 0.06)', 
  white: '#FFFFFF',
  black: '#000000',
  error: '#E05555',
  transparent: 'transparent',
};

export const Typography = {
  displayLarge: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.8, color: Colors.textPrimary },
  displayMedium: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.5, color: Colors.textPrimary },
  displaySmall: { fontSize: 20, fontWeight: '600' as const, letterSpacing: -0.3, color: Colors.textPrimary },
  bodyLarge: { fontSize: 16, fontWeight: '400' as const, color: Colors.textPrimary },
  bodyMedium: { fontSize: 14, fontWeight: '400' as const, color: Colors.textSecondary },
  bodySmall: { fontSize: 12, fontWeight: '400' as const, color: Colors.textMuted },
  labelLarge: { fontSize: 14, fontWeight: '600' as const, letterSpacing: 0.1, color: Colors.textPrimary },
  labelMedium: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.3, color: Colors.textSecondary },
  labelSmall: { fontSize: 10, fontWeight: '600' as const, letterSpacing: 0.8, color: Colors.textMuted },
  mono: { fontSize: 12, fontWeight: '400' as const, fontVariant: ['tabular-nums'] as const, color: Colors.textMuted },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const API_BASE = 'http://139.59.33.93:3000/api';