import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react-native'
import { AntDesign } from '@expo/vector-icons'
import * as Linking from 'expo-linking'
import { supabase } from '../../lib/supabase'

export default function LoginScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ mode?: string }>()

  // Set initial screen state based on query params (e.g. redirected from Welcome screen signup click)
  const [isSignUp, setIsSignUp] = useState(params.mode === 'signup')
  
  // Input fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'planner' | 'coordinator'>('planner')

  // UI state
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // Input focus outline states
  const [activeInput, setActiveInput] = useState<string | null>(null)

  const handleAuth = async () => {
    setError('')
    setSuccess('')
    
    if (!email.trim() || !password.trim()) {
      setError('Please fill in email and password.')
      return
    }

    if (isSignUp && !name.trim()) {
      setError('Please enter your full name.')
      return
    }

    setLoading(true)

    try {
      if (isSignUp) {
        // 1. Sign Up flow (matching web app metadata structure)
        const metadata = {
          display_name: name.trim(),
          role: role,
          phone: phone.trim(),
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password: password,
          options: {
            data: metadata,
          },
        })

        if (signUpError) throw signUpError

        // 2. Best-effort auto-confirmation via Edge function (matches web app pattern)
        let confirmed = false
        try {
          const res = await fetch(
            `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/confirm-signup`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({ email: email.trim().toLowerCase() }),
            }
          )
          const resBody = await res.json()
          confirmed = resBody?.success === true
        } catch {
          // Fallback if Edge function is not reachable or fails
        }

        if (confirmed) {
          // Automatically sign in if auto-confirmed
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password: password,
          })
          if (signInError) throw signInError
        } else {
          setSuccess('Account created! Please check your email for verification.')
        }

      } else {
        // Sign In flow
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password: password,
        })
        if (signInError) throw signInError
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setError('')
    setLoading(true)

    try {
      const redirectUrl = Linking.createURL('(auth)/login')
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: Platform.OS !== 'web',
        },
      })

      if (authError) throw authError

      if (Platform.OS !== 'web' && data?.url) {
        await Linking.openURL(data.url)
      }
    } catch (err: any) {
      setError(err?.message || 'Google OAuth failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0D0D11" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Brand Display */}
        <View style={styles.brandRow}>
          <Text style={styles.brandTextLight}>Nali</Text>
          <Text style={styles.brandTextGold}>Grid</Text>
        </View>
        <Text style={styles.tagline}>Premium Event Day Companion</Text>

        {/* Auth Segment Tab Slider */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, !isSignUp && styles.activeTabBtn]}
            activeOpacity={0.8}
            onPress={() => { setIsSignUp(false); setError(''); setSuccess('') }}
          >
            <Text style={[styles.tabText, !isSignUp && styles.activeTabText]}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, isSignUp && styles.activeTabBtn]}
            activeOpacity={0.8}
            onPress={() => { setIsSignUp(true); setError(''); setSuccess('') }}
          >
            <Text style={[styles.tabText, isSignUp && styles.activeTabText]}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {/* Input Forms */}
        <View style={styles.formContainer}>
          {isSignUp && (
            <>
              {/* Full Name Field */}
              <View style={[styles.inputWrapper, activeInput === 'name' && styles.inputActive]}>
                <User size={18} color={activeInput === 'name' ? '#E91E63' : '#6B7280'} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Full Name"
                  placeholderTextColor="#4B5563"
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setActiveInput('name')}
                  onBlur={() => setActiveInput(null)}
                  autoCapitalize="words"
                />
              </View>

              {/* Phone Field */}
              <View style={[styles.inputWrapper, activeInput === 'phone' && styles.inputActive]}>
                <Phone size={18} color={activeInput === 'phone' ? '#E91E63' : '#6B7280'} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Phone Number (Optional)"
                  placeholderTextColor="#4B5563"
                  value={phone}
                  onChangeText={setPhone}
                  onFocus={() => setActiveInput('phone')}
                  onBlur={() => setActiveInput(null)}
                  keyboardType="phone-pad"
                />
              </View>
            </>
          )}

          {/* Email Field */}
          <View style={[styles.inputWrapper, activeInput === 'email' && styles.inputActive]}>
            <Mail size={18} color={activeInput === 'email' ? '#E91E63' : '#6B7280'} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Email Address"
              placeholderTextColor="#4B5563"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setActiveInput('email')}
              onBlur={() => setActiveInput(null)}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          {/* Password Field */}
          <View style={[styles.inputWrapper, activeInput === 'password' && styles.inputActive]}>
            <Lock size={18} color={activeInput === 'password' ? '#E91E63' : '#6B7280'} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Password"
              placeholderTextColor="#4B5563"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              onFocus={() => setActiveInput('password')}
              onBlur={() => setActiveInput(null)}
              autoComplete="current-password"
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
            >
              {showPassword ? (
                <EyeOff size={18} color="#6B7280" />
              ) : (
                <Eye size={18} color="#6B7280" />
              )}
            </TouchableOpacity>
          </View>

          {/* Role Picker Segment (Sign Up Only) */}
          {isSignUp && (
            <View style={styles.roleContainer}>
              <Text style={styles.roleLabel}>Choose Your Account Role</Text>
              <View style={styles.roleSegments}>
                <TouchableOpacity
                  style={[styles.roleSegmentBtn, role === 'planner' && styles.activeRoleSegmentBtn]}
                  onPress={() => setRole('planner')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.roleSegmentText, role === 'planner' && styles.activeRoleSegmentText]}>
                    Planner
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleSegmentBtn, role === 'coordinator' && styles.activeRoleSegmentBtn]}
                  onPress={() => setRole('coordinator')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.roleSegmentText, role === 'coordinator' && styles.activeRoleSegmentText]}>
                    Coordinator
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Messages */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {success ? <Text style={styles.successText}>{success}</Text> : null}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
            onPress={handleAuth}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google SSO Button */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleAuth}
            disabled={loading}
            activeOpacity={0.85}
          >
            <AntDesign name="google" size={18} color="#FFFFFF" style={styles.googleIcon} />
            <Text style={styles.googleButtonText}>Google</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Toggle Link */}
        <View style={styles.footerLinkRow}>
          <Text style={styles.footerText}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          </Text>
          <TouchableOpacity onPress={() => { setIsSignUp(!isSignUp); setError(''); setSuccess('') }}>
            <Text style={styles.footerActionText}>
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D11',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 6,
  },
  brandTextLight: {
    fontSize: 34,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandTextGold: {
    fontSize: 34,
    fontWeight: '600',
    color: '#D4A017',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D4A017',
    letterSpacing: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 40,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#15151E',
    borderRadius: 14,
    padding: 4,
    marginBottom: 28,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 11,
  },
  activeTabBtn: {
    backgroundColor: '#E91E63', // Magenta slider
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  formContainer: {
    gap: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15151E',
    borderWidth: 1.5,
    borderColor: '#22222E',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
  },
  inputActive: {
    borderColor: '#E91E63', // Highlight on focus
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  eyeBtn: {
    padding: 4,
  },
  roleContainer: {
    marginTop: 6,
  },
  roleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  roleSegments: {
    flexDirection: 'row',
    backgroundColor: '#15151E',
    borderWidth: 1,
    borderColor: '#22222E',
    borderRadius: 12,
    padding: 3,
  },
  roleSegmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  activeRoleSegmentBtn: {
    backgroundColor: 'rgba(233, 30, 99, 0.1)',
    borderWidth: 1,
    borderColor: '#E91E63',
  },
  roleSegmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeRoleSegmentText: {
    color: '#E91E63',
  },
  primaryButton: {
    height: 52,
    backgroundColor: '#E91E63', // Magenta button
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1F2937',
  },
  dividerText: {
    color: '#4B5563',
    fontSize: 11,
    marginHorizontal: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  googleButton: {
    flexDirection: 'row',
    height: 50,
    backgroundColor: '#15151E',
    borderWidth: 1,
    borderColor: '#22222E',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleIcon: {
    opacity: 0.9,
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    textAlign: 'center',
  },
  successText: {
    color: '#10B981',
    fontSize: 12,
    textAlign: 'center',
  },
  footerLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 36,
  },
  footerText: {
    fontSize: 13,
    color: '#6B7280',
  },
  footerActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E91E63',
  },
})
