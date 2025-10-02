import {
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Pressable,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useCallback, useState } from "react";
import * as ImagePicker from "expo-image-picker";

import FontAwesome from "@expo/vector-icons/FontAwesome";
import Feather from "@expo/vector-icons/Feather";

import { router } from "expo-router";

import { driver_reg_styles } from "../../styles/driver_reg_styles";
import Header from "../../components/driver_reg/Header";

import { useDriverAuthContext } from "../../context/DriverAuthContext";
import { useNotificationContext } from "../../context/NotificationContext";
import Notification from "../../components/Notification";

const DriverIdentification = () => {
  const styles = driver_reg_styles();
  const { updateDriverLicense } = useDriverAuthContext();
  const { showNotification, notification } = useNotificationContext()!;

  const [licenseNumber, setLicenseNumber] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [expiryDateObj, setExpiryDateObj] = useState<Date | undefined>(
    undefined
  );
  const [showExpiryPicker, setShowExpiryPicker] = useState<boolean>(false);
  const [frontImage, setFrontImage] = useState<string>("");
  const [backImage, setBackImage] = useState<string>("");
  const [selfieImage, setSelfieImage] = useState<string>("");
  const [frontAsset, setFrontAsset] = useState<any>(null);
  const [backAsset, setBackAsset] = useState<any>(null);
  const [selfieAsset, setSelfieAsset] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const pickImage = async (imageType: "front" | "back" | "selfie") => {
    try {
      const camPerm = await ImagePicker.requestCameraPermissionsAsync();
      const libPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (camPerm.status !== "granted" && libPerm.status !== "granted") {
        showNotification(
          "Camera or media library permission is required",
          "error"
        );
        return;
      }

      let result: any = { canceled: true };
      try {
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } catch (camErr) {
        console.warn("Camera launch failed, falling back to library:", camErr);
      }

      if (!result || result.canceled) {
        try {
          result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          });
        } catch (libErr) {
          console.error("launchImageLibraryAsync failed:", libErr);
          showNotification("Image picker failed", "error");
          return;
        }
      }

      if (
        !result ||
        result.canceled ||
        !result.assets ||
        result.assets.length === 0
      ) {
        return;
      }

      const asset = result.assets[0];
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
    } catch (err) {
      console.error("pickImage error:", err);
      showNotification("Failed to pick image", "error");
    }
  };

  const handleNext = async (): Promise<void> => {
    if (!licenseNumber.trim() || !expiryDate.trim()) {
      showNotification("License details required", "error");
      return;
    }

    if (!frontImage || !backImage || !selfieImage) {
      showNotification("All photos required", "error");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("number", licenseNumber);
      formData.append("expiry_date", expiryDate);

      const appendAsset = (asset: any, fieldName: string) => {
        if (!asset || !asset.uri) return;
        const uri = asset.uri;
        const parts = uri.split("/");
        const name = parts[parts.length - 1];
        const fileType = name.includes(".") ? name.split(".").pop() : "jpg";
        const mimeType = `image/${fileType}`;
        // @ts-ignore
        formData.append(fieldName, {
          uri,
          name,
          type: mimeType,
        } as any);
      };

      appendAsset(frontAsset, "license_front");
      appendAsset(backAsset, "license_back");
      appendAsset(selfieAsset, "selfie_with_license");

      await updateDriverLicense(formData);
      setSuccess(true);
      setTimeout(() => {
        router.push("/vehicle_information");
      }, 1500);
    } catch (err: any) {
      console.error("handleNext error:", err);
      showNotification(
        err?.message || "Failed to update driver license",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const onExpiryChange = useCallback(
    (_: any, selected?: Date) => {
      // Hide on Android after selection/dismiss
      if (Platform.OS === "android") setShowExpiryPicker(false);
      if (selected) {
        setExpiryDateObj(selected);
        const y = selected.getFullYear();
        const m = String(selected.getMonth() + 1).padStart(2, "0");
        const d = String(selected.getDate()).padStart(2, "0");
        setExpiryDate(`${y}-${m}-${d}`);
      }
    },
    [expiryDateObj]
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#121212", paddingBottom: 20 }}>
      <Notification notification={notification} />
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
            flexGrow: 1,
            paddingHorizontal: 20,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Form Header */}
          <View style={{ marginTop: 20 }}>
            <Text style={styles.form_header_text}>Driver Identification</Text>
            <Text style={styles.form_subheader_text}>
              Just fill in your driver identification details
            </Text>
          </View>

          {/* Form */}
          <View style={{ marginTop: 20 }}>
            <View style={styles.inp_container}>
              <Text style={styles.inp_label}>Driver's License Number</Text>
              <View style={styles.inp_holder}>
                <FontAwesome name="id-card-o" size={20} color="white" />
                <TextInput
                  style={styles.text_input}
                  autoCapitalize="words"
                  placeholder="Input license number"
                  placeholderTextColor={"#c5c5c5"}
                  value={licenseNumber}
                  onChangeText={setLicenseNumber}
                />
              </View>
            </View>
            <View style={styles.inp_container}>
              <Text style={styles.inp_label}>
                Driver's License expiration date
              </Text>
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
                    {expiryDate || "License card expiration date"}
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
            <View style={styles.two_column_conatainer}>
              <View style={styles.inp_container}>
                <Text style={styles.inp_label}>Driver's Licence front</Text>
                <TouchableWithoutFeedback onPress={() => pickImage("front")}>
                  <View style={[styles.img_input]}>
                    {frontImage ? (
                      <Image
                        source={{ uri: frontImage }}
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
                <Text style={styles.inp_label}>Driver's Licence back</Text>
                <TouchableWithoutFeedback onPress={() => pickImage("back")}>
                  <View style={[styles.img_input]}>
                    {backImage ? (
                      <Image
                        source={{ uri: backImage }}
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
            <View style={styles.inp_container}>
              <Text style={styles.inp_label}>Selfie with Driver's License</Text>
              <TouchableWithoutFeedback onPress={() => pickImage("selfie")}>
                <View style={[styles.img_input]}>
                  {selfieImage ? (
                    <Image
                      source={{ uri: selfieImage }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Feather name="camera" color={"#fff"} size={30} />
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
            <TouchableWithoutFeedback
              onPress={handleNext}
              disabled={loading || success}
            >
              <View
                style={[
                  styles.sign_btn,
                  (loading || success) && { opacity: 0.6 },
                ]}
              >
                <Text style={styles.sign_btn_text}>
                  {loading ? "Updating..." : success ? "Updated!" : "Next"}
                </Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default DriverIdentification;
