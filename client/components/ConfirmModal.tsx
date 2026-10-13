import React, { FC } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  icon?: keyof typeof Feather.glyphMap;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const ConfirmModal: FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  icon,
  loading = false,
  onConfirm,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={loading ? undefined : onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.card}>
              {icon && (
                <View style={styles.icon_badge}>
                  <Feather name={icon} size={22} color="#ffffff" />
                </View>
              )}

              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>

              <View style={styles.button_row}>
                {cancelText ? (
                  <TouchableOpacity
                    style={styles.cancel_btn}
                    disabled={loading}
                    onPress={onClose}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancel_btn_text}>{cancelText}</Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  style={[
                    styles.confirm_btn,
                    loading && { opacity: 0.65 },
                  ]}
                  disabled={loading}
                  onPress={onConfirm}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#121212" />
                  ) : (
                    <Text style={styles.confirm_btn_text}>{confirmText}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#18181b",
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: "#27272a",
    alignItems: "center",
  },
  icon_badge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#27272a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#3f3f46",
  },
  title: {
    color: "#ffffff",
    fontFamily: "raleway-bold",
    fontSize: 17,
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    color: "#a1a1aa",
    fontFamily: "raleway-regular",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginBottom: 22,
  },
  button_row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
  },
  cancel_btn: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#3f3f46",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancel_btn_text: {
    color: "#d4d4d8",
    fontFamily: "raleway-semibold",
    fontSize: 13,
  },
  confirm_btn: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confirm_btn_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 13,
  },
});

export default ConfirmModal;
