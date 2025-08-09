import {
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import React, { useState } from "react";

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
  const [frontImage, setFrontImage] = useState<string>("");
  const [backImage, setBackImage] = useState<string>("");
  const [selfieImage, setSelfieImage] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const pickImage = async (imageType: "front" | "back" | "selfie") => {
    // For now, just set placeholder images
    const placeholderImage = "image.png";

    switch (imageType) {
      case "front":
        setFrontImage(placeholderImage);
        break;
      case "back":
        setBackImage(placeholderImage);
        break;
      case "selfie":
        setSelfieImage(placeholderImage);
        break;
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
      const driverLicence = {
        number: licenseNumber,
        expiry_date: expiryDate,
        front_image: frontImage,
        back_image: backImage,
        selfie_with_licence: selfieImage,
      };

      await updateDriverLicense(driverLicence);
      setTimeout(() => {
        router.push("/vehicle_information");
      }, 1500);
    } catch (err: any) {
      showNotification(
        err.message || "Failed to update driver license",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Notification notification={notification} />
      <View
        style={{
          flex: 1,
          backgroundColor: "#121212",
        }}
      >
        {/* Header component obviously */}
        <Header />

        {/* Registration progress bar */}
        <View style={styles.progress_bar_container}>
          <View style={[styles.progress_bar, { backgroundColor: "#fff" }]} />
          <View style={[styles.progress_bar, { backgroundColor: "#fff" }]} />
          <View style={styles.progress_bar} />
        </View>

        <ScrollView style={{ paddingHorizontal: 20 }}>
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
                <TextInput
                  style={styles.text_input}
                  placeholder="License card expiration date"
                  placeholderTextColor={"#c5c5c5"}
                  autoCapitalize="none"
                  value={expiryDate}
                  onChangeText={setExpiryDate}
                />
              </View>
            </View>
            <View style={styles.two_column_conatainer}>
              <View style={styles.inp_container}>
                <Text style={styles.inp_label}>Driver's Licence front</Text>
                <TouchableWithoutFeedback onPress={() => pickImage("front")}>
                  <View
                    style={[
                      styles.img_input,
                      frontImage && { borderColor: "#4CAF50", borderWidth: 2 },
                    ]}
                  >
                    {frontImage ? (
                      <Feather name="check" color={"#4CAF50"} size={30} />
                    ) : (
                      <Feather name="camera" color={"#fff"} size={30} />
                    )}
                  </View>
                </TouchableWithoutFeedback>
              </View>
              <View style={styles.inp_container}>
                <Text style={styles.inp_label}>Driver's Licence back</Text>
                <TouchableWithoutFeedback onPress={() => pickImage("back")}>
                  <View
                    style={[
                      styles.img_input,
                      backImage && { borderColor: "#4CAF50", borderWidth: 2 },
                    ]}
                  >
                    {backImage ? (
                      <Feather name="check" color={"#4CAF50"} size={30} />
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
                <View
                  style={[
                    styles.img_input,
                    selfieImage && { borderColor: "#4CAF50", borderWidth: 2 },
                  ]}
                >
                  {selfieImage ? (
                    <Feather name="check" color={"#4CAF50"} size={30} />
                  ) : (
                    <Feather name="camera" color={"#fff"} size={30} />
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
            <TouchableWithoutFeedback onPress={handleNext} disabled={loading}>
              <View style={[styles.sign_btn, loading && { opacity: 0.6 }]}>
                <Text style={styles.sign_btn_text}>
                  {loading ? "Updating..." : "Next"}
                </Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </ScrollView>
      </View>
    </>
  );
};

export default DriverIdentification;
