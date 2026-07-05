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
  ImageBackground,
  Dimensions,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Eye, EyeOff, Mail, Lock, User, Phone, Check, X, ArrowLeft, Award } from 'lucide-react-native'
import { AntDesign } from '@expo/vector-icons'
import * as Linking from 'expo-linking'
import { useAuthStore } from '@naligrid/shared'
import { supabase } from '../../lib/supabase'

const { width } = Dimensions.get('window')

interface RoleOption {
  value: 'planner' | 'coordinator' | 'client'
  label: string
  desc: string
  image: string
}

const ROLES: RoleOption[] = [
  {
    value: 'planner',
    label: 'Event Planner',
    desc: 'Manage event setups, client portals, budgeting, and teams',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80', // Wedding Image matching
  },
  {
    value: 'coordinator',
    label: 'Coordinator',
    desc: 'Operational day-of coordination, assigning tasks, and timelines',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&q=80', // Traditional Image matching
  },
  {
    value: 'client',
    label: 'Client / Guest',
    desc: 'View your invited events and browse the vendor directory',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&q=80', // Corporate Image matching
  },
]

export default function RegisterScreen() {
  const router = useRouter()
  const { user } = useAuthStore()

  useEffect(() => {
    if (user) {
      router.replace('/(app)/dashboard')
    }
  }, [user])

  // Stepper
  const [step, setStep] = useState<'role' | 'form'>('role')
  
  // Registration data
  const [role, setRole] = useState<'planner' | 'coordinator' | 'client'>('planner')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [password, setPassword] = useState('')

  // UI state
  const [showPassword, setShowPassword] = useState(false)
  const [activeInput, setActiveInput] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Password checks
  const pwChecks = [
    { label: 'At least 6 characters', test: (p: string) => p.length >= 6 },
    { label: 'Uppercase & lowercase letters', test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
    { label: 'At least one number', test: (p: string) => /\d/.test(p) },
    { label: 'At least one special character', test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
  ]

  const handleRegister = async () => {
    setError('')
    setSuccess('')

    if (!name.trim()) {
      setError('Please enter your full name.')
      return
    }
    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    // Verify all password checks are passed
    const allChecksPassed = pwChecks.every(c => c.test(password))
    if (!allChecksPassed) {
      setError('Please satisfy all password security requirements.')
      return
    }

    setLoading(true)

    try {
      // 1. Trigger Supabase Auth sign up (incorporates metadata)
      const metadata = {
        display_name: name.trim(),
        role: role,
        phone: phone.trim(),
        ...(referralCode.trim() && { referred_by_code: referralCode.trim().toUpperCase() }),
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: metadata,
        },
      })

      if (signUpError) throw signUpError

      // 2. Best-effort confirmation via Edge Function (replicates web app trigger)
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
        // Fallback silently if edge function times out
      }

      if (confirmed) {
        // Sign in automatically
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password: password,
        })
        if (signInError) throw signInError
      } else {
        setSuccess('Account created! Please check your email to verify your registration.')
      }

    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.')
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
        
        {/* Step 1: Choose Account Role */}
        {step === 'role' ? (
          <View style={styles.stepContainer}>
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push('/(auth)/welcome')}
              activeOpacity={0.7}
            >
              <ArrowLeft size={16} color="#9CA3AF" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>

            <View style={styles.header}>
              <Text style={styles.title}>Join NaliGrid</Text>
              <View style={styles.subtitleRow}>
                <Text style={styles.subtitleText}>Choose your account type to get started, or </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                  <Text style={styles.linkText}>Sign in</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Role cards list */}
            <View style={styles.rolesList}>
              {ROLES.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  activeOpacity={0.9}
                  onPress={() => {
                    setRole(item.value)
                    setStep('form')
                  }}
                  style={styles.roleCard}
                >
                  <ImageBackground
                    source={{ uri: item.image }}
                    style={styles.roleCardBackground}
                    imageStyle={styles.roleCardImage}
                  >
                    <View style={styles.roleCardOverlay} />
                    <View style={styles.roleCardContent}>
                      <Text style={styles.roleCardTitle}>{item.label}</Text>
                      <Text style={styles.roleCardDesc}>{item.desc}</Text>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              ))}
            </View>

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
              activeOpacity={0.85}
            >
              <AntDesign name="google" size={16} color="#FFFFFF" style={styles.googleIcon} />
              <Text style={styles.googleButtonText}>Google</Text>
            </TouchableOpacity>

            {/* Facebook SSO Button */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleFacebookAuth}
              activeOpacity={0.85}
            >
              <AntDesign name="facebook-square" size={16} color="#1877F2" style={styles.googleIcon} />
              <Text style={styles.googleButtonText}>Facebook</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Step 2: Fill Account Details Form */
          <View style={styles.stepContainer}>
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setStep('role')}
              activeOpacity={0.7}
            >
              <ArrowLeft size={16} color="#9CA3AF" />
              <Text style={styles.backButtonText}>Back to Roles</Text>
            </TouchableOpacity>

            <View style={styles.header}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitleSubtext}>
                Signing up as{' '}
                <Text style={styles.highlightText}>
                  {role === 'planner' ? 'Event Planner' : role === 'coordinator' ? 'Coordinator' : 'Client / Guest'}
                </Text>
              </Text>
            </View>

            {/* Registration Form details */}
            <View style={styles.form}>
              
              {/* Full Name input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={[styles.inputWrapper, activeInput === 'name' && styles.inputActive]}>
                  <User size={16} color={activeInput === 'name' ? '#D4A017' : '#9CA3AF'} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Adebayo Benson"
                    placeholderTextColor="#4B5563"
                    value={name}
                    onChangeText={setName}
                    onFocus={() => setActiveInput('name')}
                    onBlur={() => setActiveInput(null)}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Email Address input */}
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
                  />
                </View>
              </View>

              {/* Phone Number (+234 placeholder) */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number (+234)</Text>
                <View style={[styles.inputWrapper, activeInput === 'phone' && styles.inputActive]}>
                  <Phone size={16} color={activeInput === 'phone' ? '#D4A017' : '#9CA3AF'} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="+234 800 000 0000"
                    placeholderTextColor="#4B5563"
                    value={phone}
                    onChangeText={setPhone}
                    onFocus={() => setActiveInput('phone')}
                    onBlur={() => setActiveInput(null)}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Referral code */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Referral Code (Optional)</Text>
                <View style={[styles.inputWrapper, activeInput === 'referral' && styles.inputActive]}>
                  <Award size={16} color={activeInput === 'referral' ? '#D4A017' : '#9CA3AF'} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter referral code"
                    placeholderTextColor="#4B5563"
                    value={referralCode}
                    onChangeText={setReferralCode}
                    onFocus={() => setActiveInput('referral')}
                    onBlur={() => setActiveInput(null)}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={[styles.inputWrapper, activeInput === 'password' && styles.inputActive]}>
                  <Lock size={16} color={activeInput === 'password' ? '#D4A017' : '#9CA3AF'} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter password"
                    placeholderTextColor="#4B5563"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    onFocus={() => setActiveInput('password')}
                    onBlur={() => setActiveInput(null)}
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
              </View>

              {/* Live Password Strength Requirement Indicators */}
              <View style={styles.pwRequirements}>
                {pwChecks.map((check, idx) => {
                  const passed = check.test(password)
                  return (
                    <View key={idx} style={styles.pwCheckRow}>
                      <View style={[styles.pwCheckIndicator, passed && styles.pwCheckIndicatorPassed]}>
                        {passed ? (
                          <Check size={10} color="#FFFFFF" />
                        ) : (
                          <X size={10} color="#6B7280" />
                        )}
                      </View>
                      <Text style={[styles.pwCheckLabel, passed && styles.pwCheckLabelPassed]}>
                        {check.label}
                      </Text>
                    </View>
                  )
                })}
              </View>

              {/* Messages */}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              {success ? <Text style={styles.successText}>{success}</Text> : null}

              <Text style={styles.tosText}>
                By registering, you accept our Terms of Service and Privacy Policy.
              </Text>

              {/* Submit Action */}
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#111827" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827', // var(--color-bg-base)
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 40,
  },
  stepContainer: {
    width: '100%',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    marginBottom: 32,
    paddingVertical: 4,
  },
  backButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    marginBottom: 28,
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
    flexWrap: 'wrap',
  },
  subtitleText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  subtitleSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  highlightText: {
    color: '#D4A017',
    fontWeight: '700',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4A017', // Gold links
  },
  rolesList: {
    gap: 16,
  },
  roleCard: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#374151',
  },
  roleCardBackground: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  roleCardImage: {
    borderRadius: 10,
  },
  roleCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 24, 39, 0.65)',
  },
  roleCardContent: {
    zIndex: 2,
  },
  roleCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  roleCardDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 15,
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
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 48,
  },
  inputActive: {
    borderColor: '#D4A017',
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
  pwRequirements: {
    backgroundColor: '#1F2937',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    gap: 8,
    marginTop: 2,
  },
  pwCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pwCheckIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pwCheckIndicatorPassed: {
    backgroundColor: '#10B981', // Green for valid checklist item
  },
  pwCheckLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  pwCheckLabelPassed: {
    color: '#FFFFFF',
  },
  tosText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginVertical: 12,
    lineHeight: 18,
  },
  submitButton: {
    height: 48,
    backgroundColor: '#D4A017',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
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
