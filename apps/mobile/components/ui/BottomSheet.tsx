import { Modal, View, StyleSheet, TouchableWithoutFeedback } from 'react-native'
import { colors, spacing, radius } from '../../constants/tokens'

interface Props {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
}

export function BottomSheet({ visible, onClose, children }: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      <View style={styles.sheet}>
        <View style={styles.handle} />
        {children}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: colors.surface1,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing[6],
    paddingBottom: spacing[12],
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surface3,
    alignSelf: 'center',
    marginBottom: spacing[4],
  },
})
