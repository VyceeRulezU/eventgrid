import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { useRouter, useSegments } from 'expo-router'
import { useAuthStore } from '@naligrid/shared'
import { supabase } from '../lib/supabase'
import { registerForPushNotifications } from '../lib/notifications'

export default function RootLayout() {
  const { user, setUser, clearAuth } = useAuthStore()
  const router = useRouter()
  const segments = useSegments()

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

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)'

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (user && inAuthGroup) {
      router.replace('/(app)/events')
    }
  }, [user, segments])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  )
}
