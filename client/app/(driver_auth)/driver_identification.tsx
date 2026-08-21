import {
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Modal,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";

import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useCallback, useMemo, useState } from "react";
import * as ImagePicker from "expo-image-picker";

import FontAwesome from "@expo/vector-icons/FontAwesome";
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { router } from "expo-router";

import { driver_reg_styles } from "../../styles/driver_reg_styles";
import Header from "../../components/driver_reg/Header";

import { useDriverAuthContext } from "../../context/DriverAuthContext";
import { useNotificationContext } from "../../context/NotificationContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type IdType = "driver_licence" | "passport" | "national_id";

interface IdOption {
  value: IdType;
  label: string;
  icon: string; // MaterialCommunityIcons name
  numberLabel: string;
  numberPlaceholder: string;
  expiryLabel: string;
  frontLabel: string;
  backLabel: string;
  selfieLabel: string;
  showExpiry: boolean;
}

const ID_OPTIONS: Record<IdType, IdOption> = {
  driver_licence: {
    value: "driver_licence",
    label: "Driver's Licence",
    icon: "card-account-details",
    numberLabel: "Driver's Licence Number",
    numberPlaceholder: "Enter licence number",
    expiryLabel: "Licence Expiry Date",
    frontLabel: "Licence Front",
    backLabel: "Licence Back",
    selfieLabel: "Selfie with Licence",
    showExpiry: true,
  },
  passport: {
    value: "passport",
    label: "Passport",
    icon: "passport",
    numberLabel: "Passport Number",
    numberPlaceholder: "Enter passport number",
    expiryLabel: "Passport Expiry Date",
    frontLabel: "Passport Bio-Data Page",
    backLabel: "Passport Signature Page",
    selfieLabel: "Selfie with Passport",
    showExpiry: true,
  },
  national_id: {
    value: "national_id",
    label: "National ID",
    icon: "credit-card-outline",
    numberLabel: "NIN / ID Number",
    numberPlaceholder: "Enter your NIN or ID number",
    expiryLabel: "",
    frontLabel: "ID Card Front",
    backLabel: "ID Card Back",
    selfieLabel: "Selfie with ID Card",
    showExpiry: false,
  },
};

// Which ID types each vehicle type may use
const ALLOWED_TYPES: Record<string, IdType[]> = {
  bike: ["driver_licence", "passport", "national_id"],
  keke: ["driver_licence", "passport", "national_id"],
  cab: ["driver_licence"],
  suv: ["driver_licence"],
  van: ["driver_licence"],
  truck: ["driver_licence"],
};

// ─── Component ────────────────────────────────────────────────────────────────

const DriverIdentification = () => {
  const styles = driver_reg_styles();
  const { updateDriverLicense, driver } = useDriverAuthContext();
  const { showNotification } = useNotificationContext()!;

  const vehicleType = driver?.vehicle_type ?? "cab";
  const allowedTypes: IdType[] = ALLOWED_TYPES[vehicleType] ?? ["driver_licence"];
  const showSelector = allowedTypes.length > 1;

  const [selectedType, setSelectedType] = useState<IdType>(allowedTypes[0]);
  const activeOption = ID_OPTIONS[selectedType];

  const [idNumber, setIdNumber] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [expiryDateObj, setExpiryDateObj] = useState<Date | undefined>(undefined);
  const [showExpiryPicker, setShowExpiryPicker] = useState<boolean>(false);

  const [frontImage, setFrontImage] = useState<string>("");
  const [backImage, setBackImage] = useState<string>("");
  const [selfieImage, setSelfieImage] = useState<string>("");
  const [frontAsset, setFrontAsset] = useState<any>(null);
  const [backAsset, setBackAsset] = useState<any>(null);
  const [selfieAsset, setSelfieAsset] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [currentImageType, setCurrentImageType] = useState<
    "front" | "back" | "selfie" | null
  >(null);

  // ── Helpers ──

  const handleTypeChange = (type: IdType) => {
    setSelectedType(type);
    // Reset form when switching type
    setIdNumber("");
    setExpiryDate("");
    setExpiryDateObj(undefined);
    setFrontImage("");
    setBackImage("");
    setSelfieImage("");
    setFrontAsset(null);
    setBackAsset(null);
    setSelfieAsset(null);
  };

  const pickImage = (imageType: "front" | "back" | "selfie") => {
    setCurrentImageType(imageType);
    setShowImageModal(true);
  };

  const handleImageModalClose = () => {
    setShowImageModal(false);
    setCurrentImageType(null);
  };

  const applyAsset = (asset: any, imageType: "front" | "back" | "selfie") => {
    if (imageType === "front") {
      setFrontImage(asset.uri);
      setFrontAsset(asset);
    } else if (imageType === "back") {
      setBackImage(asset.uri);
      setBackAsset(asset);
    } else {
      setSelfieImage(asset.uri);
      setSelfieAsset(asset);
    }
  };

  const openCamera = async () => {
    handleImageModalClose();
    if (!currentImageType) return;
    const capturedType = currentImageType;
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        showNotification("Camera permission is required", "error");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result || result.canceled || !result.assets?.length) return;
      applyAsset(result.assets[0], capturedType);
    } catch (err) {
      showNotification("Failed to open camera", "error");
    }
  };

  const openGallery = async () => {
    handleImageModalClose();
    if (!currentImageType) return;
    const capturedType = currentImageType;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showNotification("Media library permission is required", "error");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result || result.canceled || !result.assets?.length) return;
      applyAsset(result.assets[0], capturedType);
    } catch (err) {
      showNotification("Failed to pick image", "error");
    }
  };

  const onExpiryChange = useCallback(
    (_: any, selected?: Date) => {
      if (Platform.OS === "android") setShowExpiryPicker(false);
      if (selected) {
        setExpiryDateObj(selected);
        const y = selected.getFullYear();
        const m = String(selected.getMonth() + 1).padStart(2, "0");
        const d = String(selected.getDate()).padStart(2, "0");
        setExpiryDate(`${y}-${m}-${d}`);
      }
    },
    [expiryDateObj],
  );

  const appendAsset = (formData: FormData, asset: any, fieldName: string) => {
    if (!asset || !asset.uri) return;
    const uri = asset.uri;
    const parts = uri.split("/");
    const name = parts[parts.length - 1];
    const fileType = name.includes(".") ? name.split(".").pop() : "jpg";
    const mimeType = `image/${fileType}`;
    // @ts-ignore
    formData.append(fieldName, { uri, name, type: mimeType } as any);
  };

  const handleNext = async (): Promise<void> => {
    if (!idNumber.trim()) {
      showNotification(`${activeOption.numberLabel} is required`, "error");
      return;
    }
    if (activeOption.showExpiry && !expiryDate.trim()) {
      showNotification(`${activeOption.expiryLabel} is required`, "error");
      return;
    }
    if (!frontImage || !backImage || !selfieImage) {
      showNotification("All photos are required", "error");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("number", idNumber);
      formData.append("identification_type", selectedType);
      if (expiryDate) formData.append("expiry_date", expiryDate);

      appendAsset(formData, frontAsset, "license_front");
      appendAsset(formData, backAsset, "license_back");
      appendAsset(formData, selfieAsset, "selfie_with_license");

      await updateDriverLicense(formData);
      setTimeout(() => {
        router.push("/vehicle_information");
      }, 1500);
    } catch (err: any) {
      showNotification(err?.message || "Failed to update identification", "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──

  return (
    <View style={{ flex: 1, backgroundColor: "#121212", paddingBottom: 20 }}>
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

        {/* Registration progress bar */}
        <View style={styles.progress_bar_container}>
          <View style={[styles.progress_bar, { backgroundColor: "#fff" }]} />
          <View style={[styles.progress_bar, { backgroundColor: "#fff" }]} />
          <View style={styles.progress_bar} />
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
          keyboardDismissMode="on-drag"
        >
          {/* Form Header */}
          <View style={{ marginTop: 20 }}>
            <Text style={styles.form_header_text}>Driver Identification</Text>
            <Text style={styles.form_subheader_text}>
              {showSelector
                ? "Choose your ID document type below"
                : "Fill in your driver's licence details"}
            </Text>
          </View>

          {/* ── ID Type Selector (only when multiple options exist) ── */}
          {showSelector && (
            <View style={id_styles.selectorContainer}>
              {allowedTypes.map((type) => {
                const opt = ID_OPTIONS[type];
                const active = selectedType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[id_styles.pill, active && id_styles.pillActive]}
                    onPress={() => handleTypeChange(type)}
                    activeOpacity={0.75}
                  >
                    <MaterialCommunityIcons
                      name={opt.icon as any}
                      size={18}
                      color={active ? "#121212" : "#aaa"}
                    />
                    <Text
                      style={[
                        id_styles.pillText,
                        active && id_styles.pillTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ── Form ── */}
          <View style={{ marginTop: 20 }}>
            {/* ID Number */}
            <View style={styles.inp_container}>
              <Text style={styles.inp_label}>{activeOption.numberLabel}</Text>
              <View style={styles.inp_holder}>
                <FontAwesome name="id-card-o" size={20} color="white" />
                <TextInput
                  style={styles.text_input}
                  autoCapitalize="characters"
                  placeholder={activeOption.numberPlaceholder}
                  placeholderTextColor="#c5c5c5"
                  value={idNumber}
                  onChangeText={setIdNumber}
                />
              </View>
            </View>

            {/* Expiry Date — hidden for national_id */}
            {activeOption.showExpiry && (
              <View style={styles.inp_container}>
                <Text style={styles.inp_label}>{activeOption.expiryLabel}</Text>
                <View style={styles.inp_holder}>
                  <FontAwesome name="calendar-o" size={20} color="white" />
                  <Pressable
                    onPress={() => setShowExpiryPicker(true)}
                    style={{ flex: 1 }}
                  >
                    <Text
                      style={[
                        styles.text_input,
                        {
                          paddingVertical: 10,
                          color: expiryDate ? "#fff" : "#c5c5c5",
                        },
                      ]}
                    >
                      {expiryDate || `Select ${activeOption.expiryLabel}`}
                    </Text>
                  </Pressable>
                </View>

                {showExpiryPicker && (
                  <DateTimePicker
                    value={expiryDateObj || new Date()}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "calendar"}
                    minimumDate={new Date()}
                    onChange={onExpiryChange}
                  />
                )}
              </View>
            )}

            {/* Front + Back images */}
            <View style={styles.two_column_conatainer}>
              <View style={styles.inp_container}>
                <Text style={styles.inp_label}>{activeOption.frontLabel}</Text>
                <TouchableWithoutFeedback onPress={() => pickImage("front")}>
                  <View style={[styles.img_input]}>
                    {frontImage ? (
                      <Image
                        source={{ uri: frontImage }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                    ) : (
                      <Feather name="camera" color="#fff" size={30} />
                    )}
                  </View>
                </TouchableWithoutFeedback>
              </View>
              <View style={styles.inp_container}>
                <Text style={styles.inp_label}>{activeOption.backLabel}</Text>
                <TouchableWithoutFeedback onPress={() => pickImage("back")}>
                  <View style={[styles.img_input]}>
                    {backImage ? (
                      <Image
                        source={{ uri: backImage }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                    ) : (
                      <Feather name="camera" color="#fff" size={30} />
                    )}
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </View>

            {/* Selfie */}
            <View style={styles.inp_container}>
              <Text style={styles.inp_label}>{activeOption.selfieLabel}</Text>
              <TouchableWithoutFeedback onPress={() => pickImage("selfie")}>
                <View style={[styles.img_input]}>
                  {selfieImage ? (
                    <Image
                      source={{ uri: selfieImage }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  ) : (
                    <Feather name="camera" color="#fff" size={30} />
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </View>
        </ScrollView>

        <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
          <TouchableWithoutFeedback onPress={handleNext} disabled={loading}>
            <View style={[styles.sign_btn, loading && { opacity: 0.6 }]}>
              <Text style={styles.sign_btn_text}>
                {loading ? "Uploading..." : "Next"}
              </Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

// ─── Additional Styles ────────────────────────────────────────────────────────

const id_styles = StyleSheet.create({
  selectorContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 20,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: "#444",
    backgroundColor: "#1E1E1E",
  },
  pillActive: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  pillText: {
    color: "#aaa",
    fontSize: 13,
    fontFamily: "raleway-semibold",
  },
  pillTextActive: {
    color: "#121212",
  },
});

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

export default DriverIdentification;
