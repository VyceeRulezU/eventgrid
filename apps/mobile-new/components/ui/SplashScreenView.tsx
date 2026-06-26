import React, { useEffect, useRef } from 'react'
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native'

const { width, height } = Dimensions.get('window')

interface Props {
  onFinish: () => void
}

export default function SplashScreenView({ onFinish }: Props) {
  const glowOpacity     = useRef(new Animated.Value(0)).current
  const logoScale       = useRef(new Animated.Value(0.5)).current
  const logoOpacity     = useRef(new Animated.Value(0)).current
  const wordmarkOpacity = useRef(new Animated.Value(0)).current
  const wordmarkY       = useRef(new Animated.Value(24)).current
  const taglineOpacity  = useRef(new Animated.Value(0)).current
  const taglineY        = useRef(new Animated.Value(12)).current
  const barWidth        = useRef(new Animated.Value(0)).current
  const particle1       = useRef(new Animated.Value(0)).current
  const particle2       = useRef(new Animated.Value(0)).current
  const particle3       = useRef(new Animated.Value(0)).current
  const exitOpacity     = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const duration = (ms: number) => ({ duration: ms, useNativeDriver: false })

    const particles = [particle1, particle2, particle3]
    particles.forEach((p, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(p, { toValue: 1, ...duration(2000 + i * 300) }),
          Animated.timing(p, { toValue: 0, ...duration(2000 + i * 300) }),
        ]),
      ).start()
    })

    Animated.sequence([
      // 1. Glow + logo pop in
      Animated.parallel([
        Animated.timing(glowOpacity, { toValue: 0.5, ...duration(800) }),
        Animated.timing(logoOpacity, { toValue: 1, ...duration(600) }),
        Animated.spring(logoScale, { toValue: 1, friction: 4, useNativeDriver: false }),
      ]),
      // 2. Wordmark slides up with slight overshoot
      Animated.parallel([
        Animated.timing(wordmarkOpacity, { toValue: 1, ...duration(500) }),
        Animated.spring(wordmarkY, { toValue: 0, friction: 6, useNativeDriver: false }),
      ]),
      // 3. Tagline fades in
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, ...duration(400) }),
        Animated.timing(taglineY, { toValue: 0, ...duration(400) }),
      ]),
      // 4. Progress bar sweeps across
      Animated.timing(barWidth, { toValue: 1, ...duration(1500) }),
      // 5. Pause then fade out
      Animated.delay(300),
      Animated.timing(exitOpacity, { toValue: 0, ...duration(400) }),
    ]).start(({ finished }) => {
      if (finished) onFinish()
    })
  }, [])

  const barWidthPct = barWidth.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0%', '100%'],
  })

  const particleTranslateY1 = particle1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -60],
  })
  const particleOpacity1 = particle1.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.6, 0],
  })
  const particleTranslateY2 = particle2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -80],
  })
  const particleOpacity2 = particle2.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.4, 0],
  })
  const particleTranslateY3 = particle3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -100],
  })
  const particleOpacity3 = particle3.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.3, 0],
  })

  return (
    <Animated.View style={[styles.container, { opacity: exitOpacity }]}>
      {/* Ambient glow */}
      <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />

      {/* Floating particles */}
      <Animated.View style={[styles.particle, styles.particle1, { opacity: particleOpacity1, transform: [{ translateY: particleTranslateY1 }] }]} />
      <Animated.View style={[styles.particle, styles.particle2, { opacity: particleOpacity2, transform: [{ translateY: particleTranslateY2 }] }]} />
      <Animated.View style={[styles.particle, styles.particle3, { opacity: particleOpacity3, transform: [{ translateY: particleTranslateY3 }] }]} />

      {/* Logo */}
      <Animated.View style={[
        styles.logoContainer,
        { opacity: logoOpacity, transform: [{ scale: logoScale }] },
      ]}>
        <Image
          source={require('../../assets/notification-icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* "Nali" + "Grid" wordmark */}
      <Animated.View style={[
        styles.wordmarkRow,
        { opacity: wordmarkOpacity, transform: [{ translateY: wordmarkY }] },
      ]}>
        <Animated.Text style={styles.wordmarkLight}>Nali</Animated.Text>
        <Animated.Text style={styles.wordmarkGold}>Grid</Animated.Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[
        styles.tagline,
        { opacity: taglineOpacity, transform: [{ translateY: taglineY }] },
      ]}>
        Event Management App
      </Animated.Text>

      {/* Loading bar */}
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, { width: barWidthPct }]} />
      </View>

      {/* Version */}
      <Animated.Text style={[styles.version, { opacity: taglineOpacity }]}>
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
    width: 280,
    height: 280,
    borderRadius: 140,
    top: height / 2 - 140,
    backgroundColor: 'rgba(212, 160, 23, 0.04)',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 80,
  },
  particle: {
    position: 'absolute',
    borderRadius: 2,
  },
  particle1: {
    width: 4,
    height: 4,
    backgroundColor: '#D4A017',
    top: height / 2 - 100,
    left: width / 2 - 60,
  },
  particle2: {
    width: 3,
    height: 3,
    backgroundColor: '#F9FAFB',
    top: height / 2 - 80,
    left: width / 2 + 40,
  },
  particle3: {
    width: 2,
    height: 2,
    backgroundColor: '#D4A017',
    top: height / 2 - 120,
    left: width / 2 + 10,
  },
  logoContainer: {
    marginBottom: 28,
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 10,
  },
  logo: {
    width: 120,
    height: 120,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  wordmarkLight: {
    fontSize: 40,
    fontWeight: '300',
    color: '#F9FAFB',
    letterSpacing: -0.5,
  },
  wordmarkGold: {
    fontSize: 40,
    fontWeight: '500',
    color: '#D4A017',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  barTrack: {
    position: 'absolute',
    bottom: 64,
    left: 48,
    right: 48,
    height: 2,
    backgroundColor: '#1F2937',
    borderRadius: 1,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#D4A017',
    borderRadius: 1,
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  version: {
    position: 'absolute',
    bottom: 40,
    fontSize: 11,
    color: '#374151',
    letterSpacing: 1,
    fontWeight: '500',
  },
})
