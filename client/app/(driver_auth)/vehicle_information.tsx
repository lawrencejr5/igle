import {
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  StyleSheet,
  Pressable,
} from "react-native";
import { Image } from "expo-image";

import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";

import FontAwesome from "@expo/vector-icons/FontAwesome";
import Feather from "@expo/vector-icons/Feather";

import { router } from "expo-router";

import { driver_reg_styles } from "../../styles/driver_reg_styles";
import Header from "../../components/driver_reg/Header";

import { useDriverAuthContext } from "../../context/DriverAuthContext";
import { useNotificationContext } from "../../context/NotificationContext";

const VehicleInformation = () => {
  const styles = driver_reg_styles();
  const { updateVehicleInfo, driver } = useDriverAuthContext();
  const { showNotification, notification } = useNotificationContext()!;

  const [exteriorImage, setExteriorImage] = useState<string>("");
  const [interiorImage, setInteriorImage] = useState<string>("");
  const [exteriorAsset, setExteriorAsset] = useState<any>(null);
  const [interiorAsset, setInteriorAsset] = useState<any>(null);
  const [brand, setBrand] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [color, setColor] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [plateNumber, setPlateNumber] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [currentImageType, setCurrentImageType] = useState<
    "exterior" | "interior" | null
  >(null);

  const pickImage = async (imageType: "exterior" | "interior") => {
    setCurrentImageType(imageType);
    setShowImageModal(true);
  };

  const handleImageModalClose = () => {
    setShowImageModal(false);
    setCurrentImageType(null);
  };

  const openCamera = async () => {
    handleImageModalClose();
    if (!currentImageType) return;

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        showNotification("Camera permission is required", "error");
        return;
      }

      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (
        !result ||
        result.canceled ||
        !result.assets ||
        result.assets.length === 0
      )
        return;

      const asset = result.assets[0];
      if (currentImageType === "exterior") {
        setExteriorImage(asset.uri);
        setExteriorAsset(asset);
      } else {
        setInteriorImage(asset.uri);
        setInteriorAsset(asset);
      }
    } catch (err) {
      console.error("openCamera error:", err);
      showNotification("Failed to open camera", "error");
    }
  };

  const openGallery = async () => {
    handleImageModalClose();
    if (!currentImageType) return;

    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showNotification("Media library permission is required", "error");
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (
        !result ||
        result.canceled ||
        !result.assets ||
        result.assets.length === 0
      )
        return;

      const asset = result.assets[0];
      if (currentImageType === "exterior") {
        setExteriorImage(asset.uri);
        setExteriorAsset(asset);
      } else {
        setInteriorImage(asset.uri);
        setInteriorAsset(asset);
      }
    } catch (err) {
      console.error("openGallery error:", err);
      showNotification("Failed to pick image", "error");
    }
  };

  const handleNext = async (): Promise<void> => {
    if (!exteriorImage || !interiorImage) {
      showNotification("Please upload images", "error");
      return;
    }

    if (
      (driver?.vehicle_type !== "keke" && !brand.trim()) ||
      !model.trim() ||
      !color.trim() ||
      !year.trim() ||
      !plateNumber.trim()
    ) {
      showNotification("All fields required", "error");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append(
        "brand",
        brand ? brand.trim() : (driver?.vehicle_type ?? ""),
      );
      formData.append("model", model.trim());
      formData.append("color", color.trim());
      formData.append("year", year.trim());
      formData.append("plate_number", plateNumber.trim());

      const appendAsset = (asset: any, fieldName: string) => {
        if (!asset || !asset.uri) return;
        const uri = asset.uri;
        const parts = uri.split("/");
        const name = parts[parts.length - 1];
        const fileType = name.includes(".") ? name.split(".").pop() : "jpg";
        const mimeType = `image/${fileType}`;
        // @ts-ignore
        formData.append(fieldName, { uri, name, type: mimeType } as any);
      };

      appendAsset(exteriorAsset, "vehicle_exterior");
      appendAsset(interiorAsset, "vehicle_interior");

      const res = await updateVehicleInfo(formData);
      setSuccess(true);
      showNotification(res?.msg || "Updated successfully", "success");
      setTimeout(() => {
        router.push("/bank_details");
      }, 1500);
    } catch (err: any) {
      showNotification(
        err.message || "Failed to update vehicle information",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#121212" }}>
      {/* Image Selection Modal */}
      <Modal
        visible={showImageModal}
        transparent
        animationType="slide"
        onRequestClose={handleImageModalClose}
      >
        <View style={styles_modal.modalOverlay}>
          <TouchableWithoutFeedback onPress={handleImageModalClose}>
            <View style={styles_modal.modalOverlay} />
          </TouchableWithoutFeedback>
          <View style={styles_modal.modalContent}>
            <View style={styles_modal.modalHeader}>
              <Text style={styles_modal.modalTitle}>Select Image</Text>
            </View>

            <View style={styles_modal.optionsContainer}>
              <Pressable style={styles_modal.option} onPress={openCamera}>
                <View style={styles_modal.iconContainer}>
                  <Feather name="camera" color="#fff" size={40} />
                </View>
                <Text style={styles_modal.optionText}>Take Photo</Text>
              </Pressable>

              <Pressable style={styles_modal.option} onPress={openGallery}>
                <View style={styles_modal.iconContainer}>
                  <Feather name="image" color="#fff" size={40} />
                </View>
                <Text style={styles_modal.optionText}>Choose from Files</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "#121212" }}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <Header />

        <View style={styles.progress_bar_container}>
          <View style={[styles.progress_bar, { backgroundColor: "#fff" }]} />
          <View style={[styles.progress_bar, { backgroundColor: "#fff" }]} />
          <View style={[styles.progress_bar, { backgroundColor: "#fff" }]} />
          <View style={styles.progress_bar} />
        </View>

        <ScrollView
          style={{ flex: 1, backgroundColor: "#121212" }}
          contentContainerStyle={{
            backgroundColor: "#121212",
            paddingHorizontal: 20,
            paddingBottom: 20,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ marginTop: 20 }}>
            <Text style={styles.form_header_text}>Vehicle Information</Text>
            <Text style={styles.form_subheader_text}>
              We need to gather some information about your vehicle
            </Text>
          </View>

          {/* Form */}
          <View style={{ marginTop: 20 }}>
            <View style={styles.two_column_conatainer}>
              <View style={styles.inp_container}>
                <Text style={styles.inp_label}>Vehicle exterior image</Text>
                <TouchableWithoutFeedback onPress={() => pickImage("exterior")}>
                  <View style={[styles.img_input]}>
                    {exteriorImage ? (
                      <Image
                        source={{ uri: exteriorImage }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                    ) : (
                      <Feather name="camera" color={"#fff"} size={30} />
                    )}
                  </View>
                </TouchableWithoutFeedback>
              </View>
              <View style={styles.inp_container}>
                <Text style={styles.inp_label}>Vehicle interior image</Text>
                <TouchableWithoutFeedback onPress={() => pickImage("interior")}>
                  <View style={[styles.img_input]}>
                    {interiorImage ? (
                      <Image
                        source={{ uri: interiorImage }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                    ) : (
                      <Feather name="camera" color={"#fff"} size={30} />
                    )}
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </View>
            {driver?.vehicle_type !== "keke" && (
              <View style={styles.inp_container}>
                <Text style={styles.inp_label}>Vehicle brand</Text>
                <View style={styles.inp_holder}>
                  <FontAwesome name="car" size={20} color="white" />
                  <TextInput
                    style={styles.text_input}
                    autoCapitalize="words"
                    placeholder="e.g. Toyota"
                    placeholderTextColor="#c5c5c5"
                    value={brand}
                    onChangeText={setBrand}
                  />
                </View>
              </View>
            )}

            {driver?.vehicle_type === "keke" ? (
              <View style={styles.inp_container}>
                <Text style={styles.inp_label}>Keke brand</Text>
                <View style={styles.inp_holder}>
                  <FontAwesome name="bookmark-o" size={20} color="white" />
                  <TextInput
                    style={styles.text_input}
                    autoCapitalize="words"
                    placeholder="e.g. Bajaj, TVS, Piaggo"
                    placeholderTextColor="#c5c5c5"
                    value={model}
                    onChangeText={setModel}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.inp_container}>
                <Text style={styles.inp_label}>Vehicle model</Text>
                <View style={styles.inp_holder}>
                  <FontAwesome name="bookmark-o" size={20} color="white" />
                  <TextInput
                    style={styles.text_input}
                    autoCapitalize="words"
                    placeholder="e.g. Camry"
                    placeholderTextColor="#c5c5c5"
                    value={model}
                    onChangeText={setModel}
                  />
                </View>
              </View>
            )}

            <View style={styles.inp_container}>
              <Text style={styles.inp_label}>Vehicle color</Text>
              <View style={styles.inp_holder}>
                <FontAwesome name="paint-brush" size={20} color="white" />
                <TextInput
                  style={styles.text_input}
                  autoCapitalize="words"
                  placeholder="e.g. Red"
                  placeholderTextColor="#c5c5c5"
                  value={color}
                  onChangeText={setColor}
                />
              </View>
            </View>
            <View style={styles.inp_container}>
              <Text style={styles.inp_label}>Vehicle year (optional)</Text>
              <View style={styles.inp_holder}>
                <FontAwesome name="calendar" size={20} color="white" />
                <TextInput
                  style={styles.text_input}
                  autoCapitalize="none"
                  keyboardType="numeric"
                  placeholder="e.g. 2018"
                  placeholderTextColor="#c5c5c5"
                  value={year}
                  onChangeText={setYear}
                />
              </View>
            </View>
            <View style={styles.inp_container}>
              <Text style={styles.inp_label}>Vehicle plate number</Text>
              <View style={styles.inp_holder}>
                <FontAwesome name="id-card-o" size={20} color="white" />
                <TextInput
                  style={styles.text_input}
                  autoCapitalize="characters"
                  placeholder="e.g. ABC-123XYZ"
                  placeholderTextColor="#c5c5c5"
                  value={plateNumber}
                  onChangeText={setPlateNumber}
                />
              </View>
            </View>
          </View>
        </ScrollView>

        <View
          style={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: 10 }}
        >
          <TouchableWithoutFeedback onPress={handleNext} disabled={loading}>
            <View style={[styles.sign_btn, loading && { opacity: 0.6 }]}>
              <Text style={styles.sign_btn_text}>
                {loading ? "Updating..." : "Next"}
              </Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles_modal = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1E1E1E",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 15,
    paddingTop: 15,
  },
  modalHeader: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  option: {
    alignItems: "center",
    flex: 1,
    paddingVertical: 12,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  optionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});

export default VehicleInformation;
