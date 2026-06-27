import { useEffect, useState, useCallback, useRef } from 'react'
import { Stack } from 'expo-router'
import { useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useAuthStore } from '@naligrid/shared'
import { supabase } from '../lib/supabase'
import { registerForPushNotifications } from '../lib/notifications'
import SplashScreenView from '../components/ui/SplashScreenView'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const { user, setUser, clearAuth } = useAuthStore()
  const router = useRouter()
  const segments = useSegments()
  const [splashDone, setSplashDone] = useState(false)
  const [appReady, setAppReady] = useState(false)

  useEffect(() => {
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email ?? '',
              user_metadata: session.user.user_metadata as Record<string, unknown>,
            })
            try { await registerForPushNotifications(session.user.id) } catch {}
          } else {
            clearAuth()
          }
        },
      )
      return () => subscription.unsubscribe()
    } catch {
      return () => {}
    }
  }, [])

  useEffect(() => {
    if (!splashDone) return
    setAppReady(true)
    try { SplashScreen.hideAsync() } catch {}
  }, [splashDone])

  useEffect(() => {
    if (!appReady) return
    const inAuthGroup = segments[0] === '(auth)'

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (user && inAuthGroup) {
      router.replace('/(app)/events')
    }
  }, [user, segments, appReady])

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
