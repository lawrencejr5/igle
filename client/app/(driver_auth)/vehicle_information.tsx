import {
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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

const VehicleInformation = () => {
  const styles = driver_reg_styles();
  const { updateVehicleInfo } = useDriverAuthContext();
  const { showNotification, notification } = useNotificationContext()!;

  const [exteriorImage, setExteriorImage] = useState<string>("");
  const [interiorImage, setInteriorImage] = useState<string>("");
  const [brand, setBrand] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [color, setColor] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [plateNumber, setPlateNumber] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const pickImage = async (imageType: "exterior" | "interior") => {
    // For now, just set placeholder images
    const placeholderImage = "image.png";

    if (imageType === "exterior") {
      setExteriorImage(placeholderImage);
    } else {
      setInteriorImage(placeholderImage);
    }
  };

  const handleNext = async (): Promise<void> => {
    if (!exteriorImage || !interiorImage) {
      showNotification("Please upload images", "error");
      return;
    }

    if (
      !brand.trim() ||
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
      const vehicle = {
        exterior_image: exteriorImage,
        interior_image: interiorImage,
        brand: brand.trim(),
        model: model.trim(),
        color: color.trim(),
        year: year.trim(),
        plate_number: plateNumber.trim(),
      };

      await updateVehicleInfo(vehicle);
      setSuccess(true);
      showNotification("Updated successfully", "success");
      setTimeout(() => {
        router.push("/reviewing_message");
      }, 1500);
    } catch (err: any) {
      showNotification(
        err.message || "Failed to update vehicle information",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#121212" }}>
      <Notification notification={notification} />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "#121212" }}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <Header />

        <View style={styles.progress_bar_container}>
          <View style={[styles.progress_bar, { backgroundColor: "#fff" }]} />
          <View style={[styles.progress_bar, { backgroundColor: "#fff" }]} />
          <View style={[styles.progress_bar, { backgroundColor: "#999999" }]} />
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
                  <View
                    style={[
                      styles.img_input,
                      exteriorImage && {
                        borderColor: "#4CAF50",
                        borderWidth: 2,
                      },
                    ]}
                  >
                    {exteriorImage ? (
                      <Feather name="check" color={"#4CAF50"} size={30} />
                    ) : (
                      <Feather name="camera" color={"#fff"} size={30} />
                    )}
                  </View>
                </TouchableWithoutFeedback>
              </View>
              <View style={styles.inp_container}>
                <Text style={styles.inp_label}>Vehicle interior image</Text>
                <TouchableWithoutFeedback onPress={() => pickImage("interior")}>
                  <View
                    style={[
                      styles.img_input,
                      interiorImage && {
                        borderColor: "#4CAF50",
                        borderWidth: 2,
                      },
                    ]}
                  >
                    {interiorImage ? (
                      <Feather name="check" color={"#4CAF50"} size={30} />
                    ) : (
                      <Feather name="camera" color={"#fff"} size={30} />
                    )}
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </View>
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
              <Text style={styles.inp_label}>Vehicle year</Text>
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

export default VehicleInformation;
