import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native'
import { useRouter } from 'expo-router'
import {
  User,
  Settings,
  Building2,
  Shield,
  LogOut,
  ChevronRight,
  HelpCircle,
} from 'lucide-react-native'
import { useAuthStore } from '@naligrid/shared'
import { supabase } from '../../lib/supabase'
import { colors, spacing, radius, fontSize, fontWeight } from '../../constants/tokens'

export default function ProfileScreen() {
  const { user, profile, org, clearAuth } = useAuthStore()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    clearAuth()
    router.replace('/(auth)/welcome')
  }

  const menuItems = [
    { icon: Building2, label: 'Organization', value: org?.name || 'No organization', route: null },
    { icon: Shield, label: 'Role', value: profile?.role || user?.user_metadata?.role || 'User', route: null },
    { icon: Settings, label: 'Settings', value: null, route: '/settings' },
    { icon: HelpCircle, label: 'Help & Support', value: null, route: '/help' },
  ]

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar + Name */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <User size={32} color={colors.accent} />
          </View>
          <Text style={styles.displayName}>
            {(user?.user_metadata?.display_name as string) || profile?.display_name || 'User'}
          </Text>
          <Text style={styles.email}>{user?.email || ''}</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuCard}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuRow, i < menuItems.length - 1 && styles.menuRowBorder]}
              onPress={() => item.route && router.push(item.route)}
              activeOpacity={item.route ? 0.7 : 1}
            >
              <item.icon size={18} color={colors.textSecondary} />
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                {item.value && <Text style={styles.menuValue}>{item.value}</Text>}
              </View>
              {item.route && <ChevronRight size={16} color={colors.textMuted} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <LogOut size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 54,
    paddingBottom: 16,
    backgroundColor: '#1F2937',
    borderBottomWidth: 1,
    borderColor: '#374151',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#1F2937',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(212, 160, 23, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  displayName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  menuCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 20,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  menuValue: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
})
