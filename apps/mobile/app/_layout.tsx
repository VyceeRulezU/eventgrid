import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { useAuthStore } from '@naligrid/shared'
import { supabase } from '../lib/supabase'
import { registerForPushNotifications } from '../lib/notifications'

export default function RootLayout() {
  const { setUser, clearAuth } = useAuthStore()

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

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  )
}
