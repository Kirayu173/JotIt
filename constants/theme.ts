export const palette = {
  background: '#F6F5EF',
  surface: '#FFFFFF',
  surfaceSoft: '#FCFCF8',
  surfaceMuted: '#EEF2EA',
  primary: '#2F7A59',
  primaryMuted: '#DCEFE4',
  text: '#1F2E28',
  textMuted: '#63746B',
  border: '#D8E0D6',
  expense: '#DE6D58',
  expenseMuted: '#FCE9E3',
  income: '#2B8A67',
  incomeMuted: '#E2F4ED',
  warning: '#F2A23A',
  shadowBase: '#1F2E28',
  shadow: 'rgba(31, 46, 40, 0.08)',
  overlay: 'rgba(15, 23, 42, 0.28)',
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const elevation = {
  card: {
    shadowColor: palette.shadowBase,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  floating: {
    shadowColor: palette.shadowBase,
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
} as const;

