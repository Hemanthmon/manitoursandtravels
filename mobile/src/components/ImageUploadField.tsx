import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import * as ImagePicker from 'expo-image-picker'
import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native'

import { toApiError } from '@/api/client'
import { uploadImage } from '@/api/hooks'
import { colors, radius, spacing } from '@/lib/theme'

import { Button, FieldLabel } from './ui'

const MAX_WIDTH = 1600 // plenty for the website's hero/card images, keeps uploads well under 4 MB

export function ImageUploadField({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (url: string) => void
  error?: string
}) {
  const [uploading, setUploading] = useState(false)

  async function pickAndUpload() {
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    })
    if (picked.canceled || !picked.assets[0]) return

    const asset = picked.assets[0]
    setUploading(true)
    try {
      // Resize + re-encode as JPEG so phone photos (often 8–15 MB) fit the 4 MB limit.
      let saved: { uri: string }
      try {
        const context = ImageManipulator.manipulate(asset.uri)
        if (asset.width > MAX_WIDTH) context.resize({ width: MAX_WIDTH, height: null })
        const rendered = await context.renderAsync()
        saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 })
      } catch (err) {
        throw new Error(`Could not prepare the photo: ${err instanceof Error ? err.message : String(err)}`)
      }

      const url = await uploadImage({
        uri: saved.uri,
        name: `package-${Date.now()}.jpg`,
        type: 'image/jpeg',
      })
      onChange(url)
    } catch (err) {
      Alert.alert('Upload failed', toApiError(err).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <View style={{ gap: spacing.sm }}>
      <FieldLabel error={error} label="Cover image" />

      <Pressable
        accessibilityLabel={value ? 'Replace cover image' : 'Upload cover image'}
        disabled={uploading}
        onPress={pickAndUpload}
        style={[styles.preview, error ? { borderColor: colors.danger } : null]}
      >
        {value ? (
          <Image contentFit="cover" source={{ uri: value }} style={StyleSheet.absoluteFill} transition={150} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons color={colors.gold500} name="cloud-upload-outline" size={32} />
            <Text style={styles.placeholderText}>Tap to upload (16:9, max 4 MB)</Text>
          </View>
        )}
        {uploading && (
          <View style={styles.overlay}>
            <ActivityIndicator color={colors.ivory} size="large" />
            <Text style={styles.overlayText}>Uploading…</Text>
          </View>
        )}
      </Pressable>

      {value && !uploading ? (
        <View style={styles.actions}>
          <Button icon="images-outline" onPress={pickAndUpload} style={{ flex: 1 }} title="Replace" variant="secondary" />
          <Button icon="trash-outline" onPress={() => onChange('')} style={{ flex: 1 }} title="Remove" variant="danger" />
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  preview: {
    aspectRatio: 16 / 9,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.ivoryDim,
    overflow: 'hidden',
  },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  placeholderText: { fontSize: 13, color: colors.textMuted },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10,26,48,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  overlayText: { color: colors.ivory, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: spacing.md },
})
