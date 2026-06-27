import { useEffect, useRef, useState } from 'react'
import { View, Animated, StyleSheet, Dimensions, Image, Text } from 'react-native'
import { Redirect } from 'expo-router'
import { useAuthStore } from '@naligrid/shared'

const { height } = Dimensions.get('window')

export default function IndexScreen() {
  const { user } = useAuthStore()
  const [splashDone, setSplashDone] = useState(false)

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
    return user ? <Redirect href="/(app)/events" /> : <Redirect href="/(auth)/welcome" />
  }

  const barWidthPct = barWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  return (
    <Animated.View style={[styles.container, { opacity: exitOpacity }]}>
      <View style={styles.logoContainer}>
        <Image source={require('../assets/splash-icon.png')} style={styles.logo} resizeMode="contain" />
      </View>
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
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
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
