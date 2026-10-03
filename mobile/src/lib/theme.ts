// Brand palette mirrors the website's globals.css (navy / gold / ivory).
export const colors = {
  navy950: '#081426',
  navy900: '#0a1a30',
  navy800: '#0f2544',
  navy700: '#173257',
  navy600: '#274469',
  gold300: '#f0c868',
  gold500: '#d4a537',
  gold600: '#b9862a',
  ivory: '#fbf9f4',
  ivoryDim: '#f3eee1',

  background: '#f6f4ee',
  surface: '#ffffff',
  border: '#e7e2d5',
  text: '#0a1a30',
  textMuted: '#667085',
  danger: '#d92d20',
  dangerSoft: '#fee4e2',
  success: '#079455',
  successSoft: '#dcfae6',
  info: '#1570ef',
  infoSoft: '#d1e9ff',
  warningSoft: '#fef0c7',
  warning: '#b54708',
}

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 }

export const font = {
  title: { fontSize: 24, fontWeight: '700' as const, color: colors.text },
  heading: { fontSize: 17, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text },
  small: { fontSize: 13, color: colors.textMuted },
  label: { fontSize: 13, fontWeight: '600' as const, color: colors.text },
}

export const shadow = {
  shadowColor: '#0a1a30',
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
}
