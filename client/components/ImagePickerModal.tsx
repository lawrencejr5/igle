import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

type ImagePickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onCameraPress: () => void;
  onGalleryPress: () => void;
};

const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  visible,
  onClose,
  onCameraPress,
  onGalleryPress,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <View style={styles.handle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Profile Picture</Text>
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.optionRow}
              onPress={() => {
                onClose();
                onCameraPress();
              }}
            >
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: "rgba(76, 175, 80, 0.15)" },
                ]}
              >
                <Feather name="camera" color="#4CAF50" size={20} />
              </View>
              <Text style={styles.optionLabel}>Take a photo</Text>
              <Feather name="chevron-right" color="#666" size={20} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.optionRow}
              onPress={() => {
                onClose();
                onGalleryPress();
              }}
            >
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: "rgba(33, 150, 243, 0.15)" },
                ]}
              >
                <Feather name="image" color="#2196F3" size={20} />
              </View>
              <Text style={styles.optionLabel}>Choose from gallery</Text>
              <Feather name="chevron-right" color="#666" size={20} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1c1c1e",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: "#3a3a3c",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 15,
  },
  modalHeader: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "raleway-bold",
    color: "#fff",
  },
  optionsContainer: {
    paddingHorizontal: 20,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2c2c2e",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionLabel: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "raleway-medium",
    flex: 1,
  },
  cancelButton: {
    marginTop: 10,
    marginHorizontal: 20,
    backgroundColor: "#2c2c2e",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  cancelText: {
    color: "#ff453a",
    fontSize: 16,
    fontFamily: "raleway-bold",
  },
});

export default ImagePickerModal;
