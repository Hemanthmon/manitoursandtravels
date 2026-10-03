import { Ionicons } from '@expo/vector-icons'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native'

import { colors, font, radius, shadow, spacing } from '@/lib/theme'

type IconName = keyof typeof Ionicons.glyphMap

// ---------- Card ----------

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>
}

// ---------- Button ----------

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  style,
}: {
  title: string
  onPress?: PressableProps['onPress']
  variant?: ButtonVariant
  icon?: IconName
  loading?: boolean
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const palette = buttonPalette[variant]
  const isDisabled = disabled || loading

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.bg, borderColor: palette.border },
        pressed && { opacity: 0.85 },
        isDisabled && { opacity: 0.55 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {icon && <Ionicons color={palette.fg} name={icon} size={18} />}
          <Text style={[styles.buttonText, { color: palette.fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  )
}

const buttonPalette: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.gold500, fg: colors.navy950, border: colors.gold500 },
  secondary: { bg: colors.surface, fg: colors.navy900, border: colors.border },
  ghost: { bg: 'transparent', fg: colors.navy700, border: 'transparent' },
  danger: { bg: colors.dangerSoft, fg: colors.danger, border: colors.dangerSoft },
}

// ---------- Form fields ----------

export function Field({
  label,
  error,
  hint,
  style,
  ...inputProps
}: TextInputProps & {
  label: string
  error?: string
  hint?: string
  ref?: React.Ref<TextInput>
}) {
  return (
    <View style={[styles.field, style as StyleProp<ViewStyle>]}>
      <Text style={font.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          inputProps.multiline && styles.inputMultiline,
          error ? { borderColor: colors.danger } : null,
        ]}
        {...inputProps}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : hint ? <Text style={font.small}>{hint}</Text> : null}
    </View>
  )
}

export function FieldLabel({ label, error }: { label: string; error?: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={font.label}>{label}</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  )
}

// ---------- Chips & badges ----------

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string
  selected?: boolean
  onPress?: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && { color: colors.ivory }]}>{label}</Text>
    </Pressable>
  )
}

export function Badge({ label, fg, bg }: { label: string; fg: string; bg: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  )
}

// ---------- States ----------

export function LoadingView() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.gold600} size="large" />
    </View>
  )
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Ionicons color={colors.danger} name="cloud-offline-outline" size={40} />
      <Text style={[font.body, styles.centerText]}>{message}</Text>
      {onRetry && <Button icon="refresh" onPress={onRetry} title="Try again" variant="secondary" />}
    </View>
  )
}

export function EmptyState({ icon, title, message }: { icon: IconName; title: string; message?: string }) {
  return (
    <View style={styles.center}>
      <Ionicons color={colors.gold500} name={icon} size={44} />
      <Text style={font.heading}>{title}</Text>
      {message ? <Text style={[font.small, styles.centerText]}>{message}</Text> : null}
    </View>
  )
}

export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={font.heading}>{title}</Text>
      {action}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadow,
  },
  button: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buttonText: { fontSize: 15, fontWeight: '600' },
  field: { gap: 6 },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.text,
  },
  inputMultiline: { minHeight: 96, textAlignVertical: 'top', paddingTop: spacing.md },
  errorText: { fontSize: 13, color: colors.danger },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.navy900, borderColor: colors.navy900 },
  chipText: { fontSize: 14, fontWeight: '500', color: colors.navy900 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill },
  badgeText: { fontSize: 12, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  centerText: { textAlign: 'center' },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
})
