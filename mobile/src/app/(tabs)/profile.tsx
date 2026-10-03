import { Ionicons } from '@expo/vector-icons'
import Constants from 'expo-constants'
import { LinearGradient } from 'expo-linear-gradient'
import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { SITE_URL } from '@/api/client'
import { useChangePassword, useUpdateProfile } from '@/api/hooks'
import { useAuth } from '@/auth/AuthProvider'
import { Button, Field } from '@/components/ui'
import { initials } from '@/lib/format'
import { getPushStatus, registerForPushNotifications, type PushStatus } from '@/lib/notifications'
import { colors, radius, shadow, spacing } from '@/lib/theme'

type IconName = keyof typeof Ionicons.glyphMap

const PUSH_COPY: Record<PushStatus, { label: string; detail: string; tint: string }> = {
  granted: { label: 'On', detail: 'You get an alert for every new request.', tint: colors.success },
  denied: { label: 'Blocked', detail: 'Turn notifications on in your phone settings.', tint: colors.danger },
  undetermined: { label: 'Not set up', detail: 'Tap to allow lead alerts on this phone.', tint: colors.warning },
  'expo-go': { label: 'Not in Expo Go', detail: 'Install the app (APK) to get instant alerts.', tint: colors.textMuted },
  emulator: { label: 'Emulator', detail: 'Alerts only work on a real phone.', tint: colors.textMuted },
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const { user, signOut, updateUser } = useAuth()
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()

  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(user?.name ?? '')
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [pushStatus, setPushStatus] = useState<PushStatus | null>(null)

  // Re-check whenever the tab is opened (the admin may have changed settings).
  useFocusEffect(
    useCallback(() => {
      void getPushStatus().then(setPushStatus)
    }, []),
  )

  const saveName = () =>
    updateProfile.mutate(name, {
      onSuccess: ({ user: updated }) => {
        updateUser(updated)
        setEditingName(false)
      },
      onError: (err) => Alert.alert('Could not save', err.message),
    })

  const savePassword = () => {
    if (passwords.next.length < 8) return setPasswordError('New password must be at least 8 characters.')
    if (passwords.next !== passwords.confirm) return setPasswordError('The new passwords don’t match.')
    setPasswordError(null)
    changePassword.mutate(
      { currentPassword: passwords.current, newPassword: passwords.next },
      {
        onSuccess: () => {
          setChangingPassword(false)
          setPasswords({ current: '', next: '', confirm: '' })
          Alert.alert('Password changed', 'Use your new password next time you sign in, on the app and the website.')
        },
        onError: (err) => setPasswordError(err.message),
      },
    )
  }

  const confirmSignOut = () =>
    Alert.alert('Sign out?', 'You’ll stop getting lead alerts on this phone until you sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
    ])

  const push = pushStatus ? PUSH_COPY[pushStatus] : null
  const server = SITE_URL.replace(/^https?:\/\//, '')

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }} keyboardShouldPersistTaps="handled" style={{ backgroundColor: colors.background }}>
        <LinearGradient
          colors={[colors.navy700, colors.navy900, colors.navy950]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={[styles.hero, { paddingTop: insets.top + spacing.xl }]}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(user?.name, user?.email)}</Text>
          </View>
          <Text style={styles.name}>{user?.name || 'Admin'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.role}>
            <Ionicons color={colors.gold300} name="shield-checkmark" size={13} />
            <Text style={styles.roleText}>Administrator · Mani Tours and Travels</Text>
          </View>
        </LinearGradient>

        {/* ---------- Account ---------- */}
        <Section title="Account">
          {editingName ? (
            <View style={styles.inlineForm}>
              <Field autoFocus label="Your name" onChangeText={setName} onSubmitEditing={saveName} returnKeyType="done" value={name} />
              <View style={styles.formButtons}>
                <Button onPress={() => setEditingName(false)} style={{ flex: 1 }} title="Cancel" variant="secondary" />
                <Button disabled={!name.trim()} loading={updateProfile.isPending} onPress={saveName} style={{ flex: 1 }} title="Save" />
              </View>
            </View>
          ) : (
            <Row
              detail={user?.name || 'Add your name'}
              icon="person-outline"
              label="Name"
              onPress={() => {
                setName(user?.name ?? '')
                setEditingName(true)
              }}
            />
          )}
          <Row detail={user?.email} icon="mail-outline" label="Email" />
          {changingPassword ? (
            <View style={styles.inlineForm}>
              <Field
                autoCapitalize="none"
                label="Current password"
                onChangeText={(v) => setPasswords((p) => ({ ...p, current: v }))}
                secureTextEntry
                value={passwords.current}
              />
              <Field
                autoCapitalize="none"
                hint="At least 8 characters"
                label="New password"
                onChangeText={(v) => setPasswords((p) => ({ ...p, next: v }))}
                secureTextEntry
                value={passwords.next}
              />
              <Field
                autoCapitalize="none"
                label="Confirm new password"
                onChangeText={(v) => setPasswords((p) => ({ ...p, confirm: v }))}
                secureTextEntry
                value={passwords.confirm}
              />
              {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}
              <View style={styles.formButtons}>
                <Button
                  onPress={() => {
                    setChangingPassword(false)
                    setPasswordError(null)
                  }}
                  style={{ flex: 1 }}
                  title="Cancel"
                  variant="secondary"
                />
                <Button
                  disabled={!passwords.current || !passwords.next}
                  loading={changePassword.isPending}
                  onPress={savePassword}
                  style={{ flex: 1 }}
                  title="Update"
                />
              </View>
            </View>
          ) : (
            <Row icon="key-outline" label="Change password" onPress={() => setChangingPassword(true)} />
          )}
        </Section>

        {/* ---------- Notifications ---------- */}
        <Section title="Notifications">
          <Row
            detail={push?.detail}
            icon="notifications-outline"
            label="Lead alerts"
            onPress={
              pushStatus === 'denied'
                ? () => Linking.openSettings()
                : pushStatus === 'undetermined'
                  ? () => void registerForPushNotifications().then(() => getPushStatus().then(setPushStatus))
                  : undefined
            }
            trailing={push ? <Text style={[styles.statusText, { color: push.tint }]}>{push.label}</Text> : null}
          />
        </Section>

        {/* ---------- Website ---------- */}
        <Section title="Website">
          <Row icon="globe-outline" label="Open website" onPress={() => SITE_URL && Linking.openURL(SITE_URL)} trailingIcon="open-outline" />
          <Row
            detail="Same login as this app"
            icon="desktop-outline"
            label="Open web admin"
            onPress={() => SITE_URL && Linking.openURL(`${SITE_URL}/admin`)}
            trailingIcon="open-outline"
          />
        </Section>

        {/* ---------- About ---------- */}
        <Section title="About">
          <Row detail={`Version ${Constants.expoConfig?.version ?? '1.0.0'}`} icon="information-circle-outline" label="Mani Admin" />
          <Row detail={server || 'Not configured'} icon="server-outline" label="Connected to" />
        </Section>

        <Pressable onPress={confirmSignOut} style={({ pressed }) => [styles.signOut, pressed && { opacity: 0.85 }]}>
          <Ionicons color={colors.danger} name="log-out-outline" size={20} />
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  )
}

function Row({
  icon,
  label,
  detail,
  onPress,
  trailing,
  trailingIcon = 'chevron-forward',
}: {
  icon: IconName
  label: string
  detail?: string | null
  onPress?: () => void
  trailing?: React.ReactNode
  trailingIcon?: IconName
}) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.ivory }]}>
      <View style={styles.rowIcon}>
        <Ionicons color={colors.navy700} name={icon} size={19} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
      </View>
      {trailing}
      {onPress ? <Ionicons color={colors.textMuted} name={trailingIcon} size={18} /> : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.gold500,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  avatarText: { fontSize: 30, fontWeight: '800', color: colors.navy950 },
  name: { fontSize: 22, fontWeight: '800', color: colors.ivory, marginTop: spacing.md },
  email: { fontSize: 14, color: 'rgba(251,249,244,0.7)', marginTop: 2 },
  role: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  roleText: { fontSize: 12, fontWeight: '600', color: colors.ivory },

  section: { marginTop: spacing.xl, paddingHorizontal: spacing.lg },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.ivoryDim, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowDetail: { fontSize: 13, color: colors.textMuted, marginTop: 1 },
  statusText: { fontSize: 13, fontWeight: '700' },
  inlineForm: { padding: spacing.lg, gap: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  formButtons: { flexDirection: 'row', gap: spacing.sm },
  error: { color: colors.danger, fontSize: 13 },

  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    paddingVertical: 15,
    borderRadius: radius.lg,
    backgroundColor: colors.dangerSoft,
  },
  signOutText: { fontSize: 16, fontWeight: '700', color: colors.danger },
})
