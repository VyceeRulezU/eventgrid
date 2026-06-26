import { useEffect, useState, useCallback } from 'react'
import { Stack } from 'expo-router'
import { useRouter, useSegments } from 'expo-router'
import { useAuthStore } from '@naligrid/shared'
import { supabase } from '../lib/supabase'
import { registerForPushNotifications } from '../lib/notifications'
import SplashScreenView from '../components/ui/SplashScreenView'

export default function RootLayout() {
  const { user, setUser, clearAuth } = useAuthStore()
  const router = useRouter()
  const segments = useSegments()
  const [splashDone, setSplashDone] = useState(false)

  // Auth listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email ?? '',
            user_metadata: session.user.user_metadata as Record<string, unknown>,
          })
          await registerForPushNotifications(session.user.id)
        } else {
          clearAuth()
        }
      },
    )
    return () => subscription.unsubscribe()
  }, [])

  // Route guard — only runs after splash is done
  useEffect(() => {
    if (!splashDone) return
    const inAuthGroup = segments[0] === '(auth)'

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (user && inAuthGroup) {
      router.replace('/(app)/events')
    }
  }, [user, segments, splashDone])

  const handleSplashFinish = useCallback(() => {
    setSplashDone(true)
  }, [])

  if (!splashDone) {
    return <SplashScreenView onFinish={handleSplashFinish} />
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  )
}
