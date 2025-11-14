import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useDriverAuthContext } from "../../context/DriverAuthContext";

type EditProfileModalProps = {
  visible: boolean;
  onClose: () => void;
};

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
}) => {
  const { driver, updateDriverInfo } = useDriverAuthContext();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: driver?.name || "",
    email: driver?.email || "",
    phone: driver?.phone || "",
    date_of_birth: driver?.date_of_birth || "",
  });

  const handleUpdate = async () => {
    setLoading(true);
    try {
      // Only send date_of_birth for update
      await updateDriverInfo({ date_of_birth: formData.date_of_birth });
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Edit Profile</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={{ padding: 10, paddingTop: 0 }}
              onPress={onClose}
            >
              <FontAwesome name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={[styles.inputContainer, styles.disabledInput]}>
                  <Ionicons name="person-outline" size={20} color="#666" />
                  <TextInput
                    style={styles.input}
                    value={formData.name}
                    placeholder="Enter your full name"
                    placeholderTextColor="#666"
                    editable={false}
                  />
                </View>
                <Text style={styles.disabledNote}>
                  Name cannot be edited here
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={[styles.inputContainer, styles.disabledInput]}>
                  <Ionicons name="mail-outline" size={20} color="#666" />
                  <TextInput
                    style={styles.input}
                    value={formData.email}
                    placeholder="Enter your email"
                    placeholderTextColor="#666"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={false}
                  />
                </View>
                <Text style={styles.disabledNote}>
                  Email cannot be edited here
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={[styles.inputContainer, styles.disabledInput]}>
                  <Ionicons name="call-outline" size={20} color="#666" />
                  <TextInput
                    style={styles.input}
                    value={formData.phone}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#666"
                    keyboardType="phone-pad"
                    editable={false}
                  />
                </View>
                <Text style={styles.disabledNote}>
                  Phone cannot be edited here
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date of Birth</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                  <TextInput
                    style={styles.input}
                    value={formData.date_of_birth}
                    onChangeText={(text) =>
                      setFormData({ ...formData, date_of_birth: text })
                    }
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#666"
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleUpdate}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#121212",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerText: {
    fontSize: 20,
    color: "#fff",
    fontFamily: "raleway-bold",
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "raleway-semibold",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  disabledInput: {
    opacity: 0.5,
    backgroundColor: "#0f0f0f",
  },
  disabledNote: {
    color: "#888",
    fontSize: 12,
    fontFamily: "raleway-regular",
    marginTop: 4,
    fontStyle: "italic",
  },
  input: {
    flex: 1,
    color: "#fff",
    fontFamily: "raleway-regular",
    fontSize: 14,
    paddingVertical: 16,
    paddingLeft: 12,
  },
  saveButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#000",
    fontSize: 16,
    fontFamily: "raleway-bold",
  },
});

export default EditProfileModal;
