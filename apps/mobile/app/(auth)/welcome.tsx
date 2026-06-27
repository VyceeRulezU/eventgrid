import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  ScrollView,
  StatusBar,
} from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'

const { width, height } = Dimensions.get('window')

interface GalleryItem {
  id: string
  title: string
  uri: string
  height: number
}

const COLUMN_LEFT: GalleryItem[] = [
  {
    id: '1',
    title: 'Christmas Tree Lighting',
    uri: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&q=80',
    height: 170,
  },
  {
    id: '2',
    title: 'Comedy Gala Night at The Club',
    uri: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=300&q=80',
    height: 220,
  },
  {
    id: '3',
    title: 'Wedding Reception',
    uri: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=300&q=80',
    height: 150,
  },
]

const COLUMN_CENTER: GalleryItem[] = [
  {
    id: '4',
    title: 'Comedy Gala Night at The Club',
    uri: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=300&q=80',
    height: 120,
  },
  {
    id: '5',
    title: "New Year's Eve Ball Drop",
    uri: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80',
    height: 240,
  },
  {
    id: '6',
    title: 'Cherry Blossom Yearly Festival',
    uri: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=300&q=80',
    height: 190,
  },
]

const COLUMN_RIGHT: GalleryItem[] = [
  {
    id: '7',
    title: 'Halloween House Party',
    uri: 'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?w=300&q=80',
    height: 140,
  },
  {
    id: '8',
    title: "St. Patrick's Parade",
    uri: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=300&q=80',
    height: 200,
  },
  {
    id: '9',
    title: 'Corporate Celebration',
    uri: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=300&q=80',
    height: 180,
  },
]

export default function WelcomeScreen() {
  const router = useRouter()

  const renderCard = (item: GalleryItem) => (
    <View key={item.id} style={[styles.cardContainer, { height: item.height }]}>
      <ImageBackground
        source={{ uri: item.uri }}
        style={styles.imageBackground}
        imageStyle={styles.imageStyle}
      >
        <View style={styles.cardOverlay} />
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardText} numberOfLines={2}>
            {item.title}
          </Text>
        </View>
      </ImageBackground>
    </View>
  )

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Masonry Event Gallery Section */}
      <View style={styles.galleryWrapper}>
        <ScrollView
          horizontal={false}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          contentContainerStyle={styles.galleryScrollContent}
        >
          <View style={styles.masonryGrid}>
            <View style={styles.gridColumn}>
              {COLUMN_LEFT.map(renderCard)}
            </View>
            <View style={styles.gridColumn}>
              {COLUMN_CENTER.map(renderCard)}
            </View>
            <View style={styles.gridColumn}>
              {COLUMN_RIGHT.map(renderCard)}
            </View>
          </View>
        </ScrollView>

        {/* Ambient Dark Gradient Fade Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)', '#000000']}
          locations={[0, 0.4, 0.95]}
          style={styles.gradientOverlay}
        />
      </View>

      {/* Description & Action Bottom Panel */}
      <View style={styles.bottomPanel}>
        <Text style={styles.title}>
          Effortlessly Plan &{'\n'}Manage Your Events
        </Text>

        <Text style={styles.subtitle}>
          With intuitive features such as guest list management, event scheduling, and budget tracking, you can streamline your event plan.
        </Text>

        {/* Pagination Dots */}
        <View style={styles.paginationRow}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
        </View>

        {/* Get Started Accent Button */}
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.85}
          onPress={() => router.push('/(auth)/register')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>

        {/* Already have an account link */}
        <View style={styles.loginLinkRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginLinkText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  galleryWrapper: {
    flex: 1,
    maxHeight: height * 0.62,
    overflow: 'hidden',
    position: 'relative',
  },
  galleryScrollContent: {
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  masonryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  gridColumn: {
    flex: 1,
    marginHorizontal: 3,
  },
  cardContainer: {
    width: '100%',
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  imageStyle: {
    borderRadius: 12,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  cardTextContainer: {
    padding: 8,
  },
  cardText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
    opacity: 0.9,
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: height * 0.45,
  },
  bottomPanel: {
    backgroundColor: '#000000',
    paddingHorizontal: 28,
    paddingBottom: 32,
    paddingTop: 12,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#374151',
  },
  activeDot: {
    width: 14,
    backgroundColor: '#E91E63', // Hot pink / Magenta highlight
  },
  button: {
    width: '100%',
    height: 52,
    backgroundColor: '#E91E63', // Hot pink / Magenta theme accent
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  loginLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  loginText: {
    color: '#6B7280',
    fontSize: 13,
  },
  loginLinkText: {
    color: '#E91E63',
    fontSize: 13,
    fontWeight: '700',
  },
})
