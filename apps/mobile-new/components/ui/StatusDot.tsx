import { View, StyleSheet } from 'react-native'
import { getStatusColor } from '../../constants/tokens'
import type { StatusLevel } from '@naligrid/shared'

interface Props {
  status: StatusLevel
  size?: number
}

export function StatusDot({ status, size = 10 }: Props) {
  const color = getStatusColor(status).dot
  return <View style={[styles.dot, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]} />
}

const styles = StyleSheet.create({
  dot: {
    flexShrink: 0,
  },
})
