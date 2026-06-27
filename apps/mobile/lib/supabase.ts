import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'

let storage: any = undefined
if (Platform.OS !== 'web') {
  storage = require('@react-native-async-storage/async-storage').default
}

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
)
