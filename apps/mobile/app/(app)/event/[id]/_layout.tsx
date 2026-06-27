import { Stack } from 'expo-router'

export default function EventLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="board" />
      <Stack.Screen name="issues" />
      <Stack.Screen name="station/[stationId]" />
    </Stack>
  )
}
