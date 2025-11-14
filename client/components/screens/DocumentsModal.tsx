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
  Image,
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useDriverAuthContext } from "../../context/DriverAuthContext";

type DocumentsModalProps = {
  visible: boolean;
  onClose: () => void;
};

const DocumentsModal: React.FC<DocumentsModalProps> = ({
  visible,
  onClose,
}) => {
  const { driver, updateDriverLicense } = useDriverAuthContext();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    number: driver?.driver_licence_number || "",
    expiry_date: driver?.driver_licence_expiry_date || "",
  });

  const [images, setImages] = useState({
    front_image: driver?.driver_licence_front || null,
    back_image: driver?.driver_licence_back || null,
    selfie_with_licence: driver?.driver_licence_selfie || null,
  });

  const pickImage = async (
    type: "front_image" | "back_image" | "selfie_with_licence"
  ) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImages({ ...images, [type]: result.assets[0].uri });
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const formDataToSend = new FormData();

      // Add text fields
      formDataToSend.append("number", formData.number);
      formDataToSend.append("expiry_date", formData.expiry_date);

      // Add images if they're new (local URIs)
      if (images.front_image && images.front_image.startsWith("file://")) {
        formDataToSend.append("license_front", {
          uri: images.front_image,
          type: "image/jpeg",
          name: "license_front.jpg",
        } as any);
      }

      if (images.back_image && images.back_image.startsWith("file://")) {
        formDataToSend.append("license_back", {
          uri: images.back_image,
          type: "image/jpeg",
          name: "license_back.jpg",
        } as any);
      }

      if (
        images.selfie_with_licence &&
        images.selfie_with_licence.startsWith("file://")
      ) {
        formDataToSend.append("selfie_with_license", {
          uri: images.selfie_with_licence,
          type: "image/jpeg",
          name: "selfie_with_license.jpg",
        } as any);
      }

      await updateDriverLicense(formDataToSend);
    } catch (error) {
      console.error("Failed to update driver license:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Driver's License Documents</Text>
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
                <Text style={styles.label}>License Number</Text>
                <View style={styles.inputContainer}>
                  <FontAwesome name="drivers-license" size={18} color="#666" />
                  <TextInput
                    style={styles.input}
                    value={formData.number}
                    onChangeText={(text) =>
                      setFormData({ ...formData, number: text })
                    }
                    placeholder="Enter license number"
                    placeholderTextColor="#666"
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Expiry Date</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                  <TextInput
                    style={styles.input}
                    value={formData.expiry_date}
                    onChangeText={(text) =>
                      setFormData({ ...formData, expiry_date: text })
                    }
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#666"
                  />
                </View>
              </View>

              {/* Image Upload Section */}
              <View style={styles.imageSection}>
                <Text style={styles.sectionTitle}>License Photos</Text>

                {/* Front Image */}
                <View style={styles.imageUploadGroup}>
                  <Text style={styles.label}>Front of License</Text>
                  <TouchableOpacity
                    style={styles.imageUploadButton}
                    onPress={() => pickImage("front_image")}
                    activeOpacity={0.7}
                  >
                    {images.front_image ? (
                      <View style={styles.imageWrapper}>
                        <Image
                          source={{ uri: images.front_image }}
                          style={styles.uploadedImage}
                        />
                        <View style={styles.imageOverlay}>
                          <Ionicons
                            name="camera-outline"
                            size={32}
                            color="#fff"
                          />
                          <Text style={styles.imageOverlayText}>
                            Tap to change
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Ionicons
                          name="camera-outline"
                          size={40}
                          color="#666"
                        />
                        <Text style={styles.imagePlaceholderText}>
                          Tap to upload front photo
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Back Image */}
                <View style={styles.imageUploadGroup}>
                  <Text style={styles.label}>Back of License</Text>
                  <TouchableOpacity
                    style={styles.imageUploadButton}
                    onPress={() => pickImage("back_image")}
                    activeOpacity={0.7}
                  >
                    {images.back_image ? (
                      <View style={styles.imageWrapper}>
                        <Image
                          source={{ uri: images.back_image }}
                          style={styles.uploadedImage}
                        />
                        <View style={styles.imageOverlay}>
                          <Ionicons
                            name="camera-outline"
                            size={32}
                            color="#fff"
                          />
                          <Text style={styles.imageOverlayText}>
                            Tap to change
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Ionicons
                          name="camera-outline"
                          size={40}
                          color="#666"
                        />
                        <Text style={styles.imagePlaceholderText}>
                          Tap to upload back photo
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Selfie with License */}
                <View style={styles.imageUploadGroup}>
                  <Text style={styles.label}>Selfie with License</Text>
                  <TouchableOpacity
                    style={styles.imageUploadButton}
                    onPress={() => pickImage("selfie_with_licence")}
                    activeOpacity={0.7}
                  >
                    {images.selfie_with_licence ? (
                      <View style={styles.imageWrapper}>
                        <Image
                          source={{ uri: images.selfie_with_licence }}
                          style={styles.uploadedImage}
                        />
                        <View style={styles.imageOverlay}>
                          <Ionicons
                            name="camera-outline"
                            size={32}
                            color="#fff"
                          />
                          <Text style={styles.imageOverlayText}>
                            Tap to change
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Ionicons
                          name="camera-outline"
                          size={40}
                          color="#666"
                        />
                        <Text style={styles.imagePlaceholderText}>
                          Tap to upload selfie with license
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
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
  input: {
    flex: 1,
    color: "#fff",
    fontFamily: "raleway-regular",
    fontSize: 14,
    paddingVertical: 16,
    paddingLeft: 12,
  },
  imageSection: {
    marginTop: 8,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "raleway-bold",
    marginBottom: 16,
  },
  imageUploadGroup: {
    marginBottom: 20,
  },
  imageUploadButton: {
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    borderStyle: "dashed",
    overflow: "hidden",
  },
  imagePlaceholder: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    color: "#666",
    fontFamily: "raleway-regular",
    fontSize: 14,
    marginTop: 8,
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
    height: 180,
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageOverlayText: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 14,
    marginTop: 8,
  },
  uploadedImage: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
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

export default DocumentsModal;
