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
  Alert,
} from "react-native";
import { Image } from "expo-image";

import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useDriverAuthContext } from "../../context/DriverAuthContext";

type VehicleInformationModalProps = {
  visible: boolean;
  onClose: () => void;
};

const VehicleInformationModal: React.FC<VehicleInformationModalProps> = ({
  visible,
  onClose,
}) => {
  const { driver, updateVehicleInfo } = useDriverAuthContext();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    brand: driver?.vehicle_brand || "",
    model: driver?.vehicle_model || "",
    color: driver?.vehicle_color || "",
    year: driver?.vehicle_year || "",
    plate_number: driver?.plate_number || "",
  });

  const [images, setImages] = useState({
    exterior_image: driver?.vehicle_exterior || null,
    interior_image: driver?.vehicle_interior || null,
  });

  const pickImage = async (type: "exterior_image" | "interior_image") => {
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
      formDataToSend.append("brand", formData.brand);
      formDataToSend.append("model", formData.model);
      formDataToSend.append("color", formData.color);
      formDataToSend.append("year", formData.year);
      formDataToSend.append("plate_number", formData.plate_number);

      // Add images if they're new (local URIs)
      if (
        images.exterior_image &&
        images.exterior_image.startsWith("file://")
      ) {
        formDataToSend.append("vehicle_exterior", {
          uri: images.exterior_image,
          type: "image/jpeg",
          name: "exterior.jpg",
        } as any);
      }

      if (
        images.interior_image &&
        images.interior_image.startsWith("file://")
      ) {
        formDataToSend.append("vehicle_interior", {
          uri: images.interior_image,
          type: "image/jpeg",
          name: "interior.jpg",
        } as any);
      }

      await updateVehicleInfo(formDataToSend);
    } catch (error) {
      console.error("Failed to update vehicle info:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Vehicle Information</Text>
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
                <Text style={styles.label}>Vehicle Brand</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="directions-car" size={20} color="#666" />
                  <TextInput
                    style={styles.input}
                    value={formData.brand}
                    onChangeText={(text) =>
                      setFormData({ ...formData, brand: text })
                    }
                    placeholder="e.g., Toyota, Honda"
                    placeholderTextColor="#666"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Vehicle Model</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="directions-car" size={20} color="#666" />
                  <TextInput
                    style={styles.input}
                    value={formData.model}
                    onChangeText={(text) =>
                      setFormData({ ...formData, model: text })
                    }
                    placeholder="e.g., Camry, Accord"
                    placeholderTextColor="#666"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Vehicle Color</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="color-palette-outline"
                    size={20}
                    color="#666"
                  />
                  <TextInput
                    style={styles.input}
                    value={formData.color}
                    onChangeText={(text) =>
                      setFormData({ ...formData, color: text })
                    }
                    placeholder="e.g., Black, White, Silver"
                    placeholderTextColor="#666"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Year</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                  <TextInput
                    style={styles.input}
                    value={formData.year}
                    onChangeText={(text) =>
                      setFormData({ ...formData, year: text })
                    }
                    placeholder="e.g., 2020"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Plate Number</Text>
                <View style={styles.inputContainer}>
                  <FontAwesome name="id-card" size={18} color="#666" />
                  <TextInput
                    style={styles.input}
                    value={formData.plate_number}
                    onChangeText={(text) =>
                      setFormData({ ...formData, plate_number: text })
                    }
                    placeholder="e.g., ABC-123"
                    placeholderTextColor="#666"
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              {/* Image Upload Section */}
              <View style={styles.imageSection}>
                <Text style={styles.sectionTitle}>Vehicle Photos</Text>

                {/* Exterior Image */}
                <View style={styles.imageUploadGroup}>
                  <Text style={styles.label}>Exterior Photo</Text>
                  <TouchableOpacity
                    style={styles.imageUploadButton}
                    onPress={() => pickImage("exterior_image")}
                    activeOpacity={0.7}
                  >
                    {images.exterior_image ? (
                      <View style={styles.imageWrapper}>
                        <Image
                          source={{ uri: images.exterior_image }}
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
                          Tap to upload exterior photo
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Interior Image */}
                <View style={styles.imageUploadGroup}>
                  <Text style={styles.label}>Interior Photo</Text>
                  <TouchableOpacity
                    style={styles.imageUploadButton}
                    onPress={() => pickImage("interior_image")}
                    activeOpacity={0.7}
                  >
                    {images.interior_image ? (
                      <View style={styles.imageWrapper}>
                        <Image
                          source={{ uri: images.interior_image }}
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
                          Tap to upload interior photo
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

export default VehicleInformationModal;
