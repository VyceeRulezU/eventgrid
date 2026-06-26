import React, { useEffect } from 'react'
import { View, Image, StyleSheet, Dimensions, Text } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated'

const { width, height } = Dimensions.get('window')

interface Props {
  onFinish: () => void
}

export default function SplashScreenView({ onFinish }: Props) {
  // Animation values
  const glowOpacity = useSharedValue(0)
  const logoScale = useSharedValue(0.6)
  const logoOpacity = useSharedValue(0)
  const wordmarkOpacity = useSharedValue(0)
  const wordmarkY = useSharedValue(20)
  const taglineOpacity = useSharedValue(0)
  const barWidth = useSharedValue(0)
  const barGlow = useSharedValue(0)
  const outerGlow = useSharedValue(0)
  const exitOpacity = useSharedValue(1)

  useEffect(() => {
    // 1. Glow pulse behind logo
    glowOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) })
    outerGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sine) }),
        withTiming(0.5, { duration: 1800, easing: Easing.inOut(Easing.sine) }),
      ),
      -1,
      true,
    )

    // 2. Logo pops in
    logoScale.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.back(1.4)) })
    logoOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) })

    // 3. Wordmark slides up
    wordmarkOpacity.value = withDelay(400, withTiming(1, { duration: 500 }))
    wordmarkY.value = withDelay(400, withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }))

    // 4. Tagline fades in
    taglineOpacity.value = withDelay(700, withTiming(1, { duration: 400 }))

    // 5. Progress bar fills
    barWidth.value = withDelay(900, withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }))
    barGlow.value = withDelay(900, withTiming(1, { duration: 600 }))

    // 6. Exit fade after 2.6s total
    const exitTimer = setTimeout(() => {
      exitOpacity.value = withTiming(0, { duration: 400, easing: Easing.in(Easing.quad) }, (finished) => {
        if (finished) runOnJS(onFinish)()
      })
    }, 2600)

    return () => clearTimeout(exitTimer)
  }, [])

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(outerGlow.value, [0, 1], [0.3, 0.7]) * glowOpacity.value,
    transform: [{ scale: interpolate(outerGlow.value, [0, 1], [1, 1.15]) }],
  }))

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }))

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
    transform: [{ translateY: wordmarkY.value }],
  }))

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }))

  const barFillStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value * 100}%`,
    shadowOpacity: barGlow.value * 0.8,
  }))

  const containerStyle = useAnimatedStyle(() => ({
    opacity: exitOpacity.value,
  }))

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Background radial glow */}
      <Animated.View style={[styles.glow, glowStyle]} />

      {/* Logo */}
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <Image
          source={require('../../assets/notification-icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Wordmark */}
      <Animated.View style={[styles.wordmarkRow, wordmarkStyle]}>
        <Animated.Text style={styles.wordmarkLight}>Nali</Animated.Text>
        <Animated.Text style={styles.wordmarkGold}>Grid</Animated.Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, taglineStyle]}>
        Event Management App
      </Animated.Text>

      {/* Progress bar */}
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, barFillStyle]} />
      </View>

      {/* Version */}
      <Animated.Text style={[styles.version, taglineStyle]}>
        v1.0.0
      </Animated.Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'transparent',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 80,
    // Android glow via elevation + bg
    elevation: 0,
    // Soft radial feel via layered bg
    borderWidth: 0,
    // Use a tinted circle for Android
    top: height / 2 - 160,
  },
  glowInner: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(212, 160, 23, 0.06)',
    position: 'absolute',
    top: height / 2 - 140,
  },
  logoContainer: {
    marginBottom: 28,
    // iOS shadow for glow effect
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
  },
  logo: {
    width: 120,
    height: 120,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  wordmarkLight: {
    fontSize: 38,
    fontWeight: '300',
    color: '#F9FAFB',
    letterSpacing: -0.5,
  },
  wordmarkGold: {
    fontSize: 38,
    fontWeight: '400',
    color: '#D4A017',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 0,
  },
  barTrack: {
    position: 'absolute',
    bottom: 64,
    left: 48,
    right: 48,
    height: 3,
    backgroundColor: '#1F2937',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#D4A017',
    borderRadius: 2,
    // iOS glow on bar
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
  },
  version: {
    position: 'absolute',
    bottom: 40,
    fontSize: 11,
    color: '#374151',
    letterSpacing: 1,
  },
})
