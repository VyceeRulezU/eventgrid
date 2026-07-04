import React, { useState, useEffect } from 'react'
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
import { useRouter } from 'expo-router'
import { Eye, EyeOff, Mail, Lock, Key, ArrowLeft } from 'lucide-react-native'
import { AntDesign } from '@expo/vector-icons'
import * as Linking from 'expo-linking'
import { useAuthStore } from '@naligrid/shared'
import { supabase } from '../../lib/supabase'

export default function LoginScreen() {
  const router = useRouter()
  const { user } = useAuthStore()

  useEffect(() => {
    if (user) {
      router.replace('/(app)/dashboard')
    }
  }, [user])

  // Sign In values
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // UI toggles
  const [magicLinkMode, setMagicLinkMode] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [activeInput, setActiveInput] = useState<string | null>(null)
  
  // States
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleLogin = async () => {
    setError('')
    setSuccess('')

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    if (!magicLinkMode && !password.trim()) {
      setError('Please enter your password.')
      return
    }

    setLoading(true)

    try {
      if (magicLinkMode) {
        // Send OTP / Magic link via email
        const redirectUrl = Linking.createURL('(auth)/login')
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: email.trim().toLowerCase(),
          options: {
            emailRedirectTo: redirectUrl,
          }
        })
        if (otpError) throw otpError

        setSuccess('Magic link sent! Check your email to sign in.')
      } else {
        // Sign in with password
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password: password,
        })
        if (signInError) throw signInError
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to sign in. Please try again.')
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

  const handleFacebookAuth = async () => {
    setError('')
    setLoading(true)

    try {
      const redirectUrl = Linking.createURL('(auth)/login')
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
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
      setError(err?.message || 'Facebook OAuth failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Back Link to Welcome */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/(auth)/welcome')}
          activeOpacity={0.7}
        >
          <ArrowLeft size={16} color="#9CA3AF" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome back</Text>
          <View style={styles.subtitleRow}>
            <Text style={styles.subtitleText}>New to NaliGrid? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.linkText}>Create an account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Inputs */}
        <View style={styles.form}>
          {/* Email input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={[styles.inputWrapper, activeInput === 'email' && styles.inputActive]}>
              <Mail size={16} color={activeInput === 'email' ? '#D4A017' : '#9CA3AF'} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="you@example.com"
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
          </View>

          {/* Password input (Password mode only) */}
          {!magicLinkMode && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={[styles.inputWrapper, activeInput === 'password' && styles.inputActive]}>
                <Lock size={16} color={activeInput === 'password' ? '#D4A017' : '#9CA3AF'} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your password"
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
                    <EyeOff size={18} color="#9CA3AF" />
                  ) : (
                    <Eye size={18} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Forgot password link */}
              <TouchableOpacity
                style={styles.forgotPasswordLink}
                onPress={() => router.push('/(auth)/forgot-password')}
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Messages */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {success ? <Text style={styles.successText}>{success}</Text> : null}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#111827" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>
                {magicLinkMode ? 'Send Magic Link' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Mode Switch Trigger */}
          <TouchableOpacity
            style={styles.toggleModeButton}
            onPress={() => {
              setMagicLinkMode(!magicLinkMode)
              setError('')
              setSuccess('')
            }}
            activeOpacity={0.7}
          >
            {magicLinkMode ? (
              <Key size={14} color="#D4A017" style={styles.toggleIcon} />
            ) : (
              <Mail size={14} color="#D4A017" style={styles.toggleIcon} />
            )}
            <Text style={styles.toggleModeText}>
              {magicLinkMode ? 'Sign in with password instead' : 'Send magic link instead'}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Button */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleAuth}
            disabled={loading}
            activeOpacity={0.85}
          >
            <AntDesign name="google" size={16} color="#FFFFFF" style={styles.googleIcon} />
            <Text style={styles.googleButtonText}>Google</Text>
          </TouchableOpacity>

          {/* Facebook Button */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleFacebookAuth}
            disabled={loading}
            activeOpacity={0.85}
          >
            <AntDesign name="facebook-square" size={16} color="#1877F2" style={styles.googleIcon} />
            <Text style={styles.googleButtonText}>Facebook</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827', // var(--color-bg-base) matching web
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    marginBottom: 40,
    paddingVertical: 4,
  },
  backButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitleText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4A017', // Gold accent link
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#374151', // var(--color-border)
    borderRadius: 8, // var(--radius-md)
    paddingHorizontal: 14,
    height: 48,
  },
  inputActive: {
    borderColor: '#D4A017', // Gold active outline
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  eyeBtn: {
    padding: 4,
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D4A017',
  },
  submitButton: {
    height: 48,
    backgroundColor: '#D4A017', // Gold theme button
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#111827', // var(--color-text-inverse)
    fontSize: 15,
    fontWeight: '700',
  },
  toggleModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  toggleIcon: {
    marginRight: 2,
  },
  toggleModeText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#374151',
  },
  dividerText: {
    color: '#6B7280',
    fontSize: 11,
    marginHorizontal: 12,
    textTransform: 'lowercase',
  },
  googleButton: {
    flexDirection: 'row',
    height: 46,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
})
