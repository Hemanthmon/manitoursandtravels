import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useRef, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { toApiError } from '@/api/client'
import { useAuth } from '@/auth/AuthProvider'
import { Button, Field } from '@/components/ui'
import { colors, radius, spacing } from '@/lib/theme'

export default function LoginScreen() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const passwordRef = useRef<TextInput>(null)

  async function handleSubmit() {
    if (!email || !password) {
      setError('Enter your email and password.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await signIn(email, password)
      // Stack.Protected swaps to the tabs automatically once `user` is set.
    } catch (err) {
      setError(toApiError(err).message)
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Image
                accessibilityLabel="Mani Tours and Travels"
                contentFit="contain"
                source={require('../../assets/logo.png')}
                style={styles.logoImage}
              />
            </View>
            <Text style={styles.brandSub}>Admin</Text>
          </View>

          <View style={styles.panel}>
            <Text style={styles.title}>Sign in</Text>
            <Text style={styles.subtitle}>Use your website admin account.</Text>

            <View style={styles.form}>
              <Field
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                label="Email"
                onChangeText={setEmail}
                onSubmitEditing={() => passwordRef.current?.focus()}
                placeholder="you@example.com"
                returnKeyType="next"
                textContentType="emailAddress"
                value={email}
              />

              <View>
                <Field
                  autoCapitalize="none"
                  autoComplete="current-password"
                  label="Password"
                  onChangeText={setPassword}
                  onSubmitEditing={handleSubmit}
                  placeholder="••••••••"
                  ref={passwordRef}
                  returnKeyType="go"
                  secureTextEntry={!showPassword}
                  textContentType="password"
                  value={password}
                />
                <Pressable
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  hitSlop={12}
                  onPress={() => setShowPassword((value) => !value)}
                  style={styles.eye}
                >
                  <Ionicons
                    color={colors.textMuted}
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                  />
                </Pressable>
              </View>

              {error && (
                <View style={styles.errorBox}>
                  <Ionicons color={colors.danger} name="alert-circle" size={18} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Button loading={submitting} onPress={handleSubmit} title="Sign in" />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy900 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  brand: { alignItems: 'center', marginBottom: spacing.xxl },
  logo: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
  },
  logoImage: { width: 200, height: 125 },
  brandSub: { fontSize: 14, color: colors.gold300, letterSpacing: 2, textTransform: 'uppercase' },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  form: { gap: spacing.lg, marginTop: spacing.xl },
  eye: { position: 'absolute', right: 14, top: 38 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  errorText: { flex: 1, color: colors.danger, fontSize: 14 },
})
