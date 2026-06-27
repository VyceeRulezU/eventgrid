import { useEffect, useRef, useState } from 'react'
import { View, Animated, StyleSheet, Dimensions, Image, Text } from 'react-native'
import { Redirect } from 'expo-router'
import { useAuthStore } from '@naligrid/shared'

const { width, height } = Dimensions.get('window')

export default function IndexScreen() {
  const { user } = useAuthStore()
  const [splashDone, setSplashDone] = useState(false)

  const glowOpacity = useRef(new Animated.Value(0)).current
  const logoScale = useRef(new Animated.Value(0.5)).current
  const logoOpacity = useRef(new Animated.Value(0)).current
  const wordmarkOpacity = useRef(new Animated.Value(0)).current
  const wordmarkY = useRef(new Animated.Value(24)).current
  const taglineOpacity = useRef(new Animated.Value(0)).current
  const taglineY = useRef(new Animated.Value(12)).current
  const barWidth = useRef(new Animated.Value(0)).current
  const exitOpacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const dur = (ms: number) => ({ duration: ms, useNativeDriver: false })
    Animated.sequence([
      Animated.parallel([
        Animated.timing(glowOpacity, { toValue: 0.5, ...dur(800) }),
        Animated.timing(logoOpacity, { toValue: 1, ...dur(600) }),
        Animated.spring(logoScale, { toValue: 1, friction: 4, useNativeDriver: false }),
      ]),
      Animated.parallel([
        Animated.timing(wordmarkOpacity, { toValue: 1, ...dur(500) }),
        Animated.spring(wordmarkY, { toValue: 0, friction: 6, useNativeDriver: false }),
      ]),
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, ...dur(400) }),
        Animated.timing(taglineY, { toValue: 0, ...dur(400) }),
      ]),
      Animated.timing(barWidth, { toValue: 1, ...dur(1500) }),
      Animated.delay(300),
      Animated.timing(exitOpacity, { toValue: 0, ...dur(400) }),
    ]).start(({ finished }) => {
      if (finished) setSplashDone(true)
    })
  }, [])

  if (splashDone) {
    return user ? <Redirect href="/(app)/events" /> : <Redirect href="/(auth)/login" />
  }

  const barWidthPct = barWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  return (
    <Animated.View style={[styles.container, { opacity: exitOpacity }]}>
      <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />
      <Animated.View style={[styles.logoContainer, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <Image source={require('../assets/splash-icon.png')} style={styles.logo} resizeMode="contain" />
      </Animated.View>
      <Animated.View style={[styles.wordmarkRow, { opacity: wordmarkOpacity, transform: [{ translateY: wordmarkY }] }]}>
        <Text style={styles.wordmarkLight}>Nali</Text>
        <Text style={styles.wordmarkGold}>Grid</Text>
      </Animated.View>
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity, transform: [{ translateY: taglineY }] }]}>
        Event Management App
      </Animated.Text>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, { width: barWidthPct }]} />
      </View>
      <Text style={styles.version}>v1.0.0</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
    color: '#D4A017',
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
