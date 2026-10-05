import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { toApiError, type FieldErrors } from '@/api/client'
import { useHomeStats, useSaveHomeStats } from '@/api/hooks'
import type { HomeStat, HomeStatIcon } from '@/api/types'
import { Button, Card, ErrorView, Field, FieldLabel, LoadingView } from '@/components/ui'
import { formatStatValue, homeStatIcons } from '@/lib/homeStats'
import { colors, radius, spacing } from '@/lib/theme'

// Edits the 4 "proof numbers" on the website's home page
// ("42,000+ Rides completed"). Saving updates the live site straight away.
export default function WebsiteStatsScreen() {
  const query = useHomeStats()
  const save = useSaveHomeStats()
  const [stats, setStats] = useState<HomeStat[] | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})

  useEffect(() => {
    if (query.data && !stats) setStats(query.data)
  }, [query.data, stats])

  if (query.isError) return <ErrorView message={query.error.message} onRetry={() => void query.refetch()} />
  if (!stats) return <LoadingView />

  const update = (index: number, patch: Partial<HomeStat>) =>
    setStats((current) => current?.map((stat, i) => (i === index ? { ...stat, ...patch } : stat)) ?? current)

  const onSave = () =>
    save.mutate(stats, {
      onSuccess: (saved) => {
        setStats(saved)
        setErrors({})
        Alert.alert('Saved', 'The website now shows these numbers.')
      },
      onError: (err) => {
        setErrors(toApiError(err).fieldErrors ?? {})
        Alert.alert('Could not save', err.message)
      },
    })

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          These 4 numbers appear in the “Why families choose us” part of the home page. Update them whenever they
          grow. Leave a number empty to hide that box.
        </Text>

        {stats.map((stat, index) => {
          const error = (field: keyof HomeStat) => errors[`${index}.${field}`]?.[0]
          return (
            <Card key={index} style={styles.card}>
              <Text style={styles.boxTitle}>Box {index + 1}</Text>

              {/* Preview: what visitors will see */}
              <View style={[styles.preview, !stat.value && { opacity: 0.45 }]}>
                <View style={styles.previewIcon}>
                  <Ionicons color={colors.gold300} name={homeStatIcons[stat.icon]} size={24} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.previewValue}>
                    {stat.value ? formatStatValue(stat.value) : '—'}
                    {stat.value && stat.suffix ? <Text style={{ color: colors.gold600 }}>{stat.suffix}</Text> : null}
                  </Text>
                  <Text style={styles.previewLabel}>{stat.value ? stat.label || 'Label' : 'Hidden on the website'}</Text>
                </View>
              </View>

              <View style={styles.row}>
                <Field
                  error={error('value')}
                  label="Number"
                  onChangeText={(value) => update(index, { value })}
                  placeholder="42000 or 24×7"
                  style={{ flex: 1 }}
                  value={stat.value}
                />
                <Field
                  error={error('suffix')}
                  label="After it"
                  onChangeText={(suffix) => update(index, { suffix })}
                  placeholder="+"
                  style={{ width: 84 }}
                  value={stat.suffix}
                />
              </View>
              <Field
                error={error('label')}
                label="Label"
                onChangeText={(label) => update(index, { label })}
                placeholder="e.g. Rides completed"
                value={stat.label}
              />

              <FieldLabel label="Icon" />
              <View style={styles.icons}>
                {(Object.keys(homeStatIcons) as HomeStatIcon[]).map((key) => {
                  const selected = stat.icon === key
                  return (
                    <Pressable
                      accessibilityLabel={key}
                      accessibilityState={{ selected }}
                      key={key}
                      onPress={() => update(index, { icon: key })}
                      style={[styles.iconChoice, selected && styles.iconChoiceSelected]}
                    >
                      <Ionicons color={selected ? colors.gold300 : colors.navy700} name={homeStatIcons[key]} size={20} />
                    </Pressable>
                  )
                })}
              </View>
            </Card>
          )
        })}

        <Text style={styles.tip}>Tip: type plain numbers like 42000 — the website adds the commas.</Text>
        <Button icon="checkmark" loading={save.isPending} onPress={onSave} title="Save changes" />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  intro: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  card: { gap: spacing.md },
  boxTitle: { fontSize: 12, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.ivory,
  },
  previewIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.navy900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewValue: { fontSize: 24, fontWeight: '800', color: colors.navy900 },
  previewLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginTop: 2 },
  row: { flexDirection: 'row', gap: spacing.sm },
  icons: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  iconChoice: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChoiceSelected: { backgroundColor: colors.navy900, borderColor: colors.navy900 },
  tip: { fontSize: 13, color: colors.textMuted },
})
